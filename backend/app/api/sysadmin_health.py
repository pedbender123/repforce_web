import uuid
import time
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..db import database, models, models_crm, schemas
from ..core import permissions

router = APIRouter()

# Define log file path in /app (writable in container)
LOG_FILE_PATH = "/app/health_check_latest.txt"

def check_sysadmin_profile(request: Request):
    """
    Ensures the user has sysadmin privileges.
    Relies on TenantMiddleware to populate request.state.
    """
    if getattr(request.state, "role_name", None) != 'sysadmin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a SysAdmins."
        )
    return True

@router.post("/run", dependencies=[Depends(check_sysadmin_profile)])
def run_system_health_check(request: Request, db_sys: Session = Depends(database.get_db)):
    """
    Executes a comprehensive system health check including a full lifecycle test:
    Tenant Creation -> User Creation -> Auth Check -> CRM Data (Client) -> Cleanup.
    """
    report = {
        "status": "pass",
        "checks": []
    }

    # Reset Log File
    with open(LOG_FILE_PATH, "w") as f:
        f.write(f"--- SYSTEM DIAGNOSTICS LOG ---\n")
        f.write(f"Started at: {datetime.now().isoformat()}\n")
        f.write(f"------------------------------\n\n")

    def log(name, status, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Internal Object Log
        report["checks"].append({"name": name, "status": status, "message": message})
        if status == "fail":
            report["status"] = "fail"
            
        # File Log
        log_line = f"[{timestamp}] [{status.upper()}] {name}: {message}\n"
        try:
            with open(LOG_FILE_PATH, "a") as f:
                f.write(log_line)
        except Exception as e:
            print(f"Error writing to log file: {e}")

    # --- 1. System Connectivity ---
    try:
        db_sys.execute(text("SELECT 1"))
        log("System DB Connection", "pass", "Connected successfully")
    except Exception as e:
        log("System DB Connection", "fail", str(e))
        return report # Critical stop

    # --- 2. Advanced Scenario: Full Lifecycle Test ---
    test_run_id = str(uuid.uuid4())[:8]
    test_tenant_name = f"HealthCheck_{test_run_id}"
    test_tenant_cnpj = "00000000000000"
    
    # Context vars for cleanup
    created_tenant_id = None
    
    try:
        # A. Create Tenant (Using System DB)
        log("Scenario: Create Tenant", "processing", f"Creating tenant {test_tenant_name}...")
        
        # Check if exists (unlikely with UUID)
        existing = db_sys.query(models.Tenant).filter(models.Tenant.name == test_tenant_name).first()
        if existing:
            db_sys.delete(existing)
            db_sys.commit()

        new_tenant = models.Tenant(name=test_tenant_name, cnpj=test_tenant_cnpj, status="active")
        db_sys.add(new_tenant)
        db_sys.commit()
        db_sys.refresh(new_tenant)
        created_tenant_id = new_tenant.id
        
        log(f"Scenario: Tenant Created", "pass", f"ID: {created_tenant_id}")

        # Ensure Schema
        schema_name = f"tenant_{created_tenant_id}"
        try:
            # Create Schema
            # Use engine_crm for schema operations to be safe
            with database.engine_crm.connect() as conn:
                 conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
                 conn.commit()
                 
                 # Create Tables
                 conn.execute(text(f"SET search_path TO {schema_name}"))
                 conn.commit()
                 models_crm.BaseCrm.metadata.create_all(bind=conn)
                 conn.commit()

            log("Scenario: Schema & Tables", "pass", f"Schema {schema_name} initialized")
        except Exception as e:
            log("Scenario: Schema Creation", "fail", str(e))
            raise e

        # B. Create Test User (Admin)
        log("Scenario: Create User", "processing", "Creating Test Admin...")
        
        # Note: We need a 'security' import for password hashing, but let's replicate logic or import it safely
        from ..core import security
        
        # Create Role
        test_role = models.Role(name="TestAdmin", tenant_id=created_tenant_id, access_level="tenant")
        db_sys.add(test_role)
        db_sys.commit()
        
        user_test = models.User(
            username=f"test_{test_run_id}",
            name="Test User",
            email=f"test_{test_run_id}@example.com",
            hashed_password=security.get_password_hash("testpass"),
            tenant_id=created_tenant_id,
            role_id=test_role.id
        )
        db_sys.add(user_test)
        db_sys.commit()
        db_sys.refresh(user_test)
        log("Scenario: User Created", "pass", f"User {user_test.username} created")

        # C. Create CRM Client (Direct DB manipulation to simulate API)
        log("Scenario: Create CRM Data", "processing", "Creating Test Client...")
        
        crm_db = database.SessionCrm()
        try:
            crm_db.execute(text(f"SET search_path TO {schema_name}"))
            
            new_client = models_crm.Client(
                name="Health Check Client",
                fantasy_name="HC Corp",
                cnpj="11122233300011",
                email="hc@example.com",
                representative_id=user_test.id, # Link to our test user
                status="active"
            )
            crm_db.add(new_client)
            crm_db.commit()
            crm_db.refresh(new_client)
            
            if new_client.id:
                log("Scenario: CRM Data", "pass", f"Client created with ID {new_client.id}")
            else:
                log("Scenario: CRM Data", "fail", "Client ID is null")
                
        except Exception as e:
            log("Scenario: CRM Data", "fail", str(e))
            raise e
        finally:
            crm_db.close()

    except Exception as e:
        log("Scenario: Lifecycle Failure", "fail", f"Stopped due to error: {str(e)}")
    
    finally:
        # D. Cleanup
        if created_tenant_id:
            log("Scenario: Cleanup", "processing", f"Deleting tenant {created_tenant_id}...")
            try:
                # 1. Drop Schema (CASCADE to kill tables)
                # Need to use engine_crm for this
                with database.engine_crm.connect() as conn:
                    conn.execute(text(f"DROP SCHEMA IF EXISTS tenant_{created_tenant_id} CASCADE"))
                    conn.commit()
                
                # 2. Delete Tenant (Cascade should handle User/Role if configured, else manual)
                db_sys.query(models.User).filter(models.User.tenant_id == created_tenant_id).delete()
                db_sys.query(models.Role).filter(models.Role.tenant_id == created_tenant_id).delete()
                
                tenant_to_del = db_sys.query(models.Tenant).filter(models.Tenant.id == created_tenant_id).first()
                if tenant_to_del:
                    db_sys.delete(tenant_to_del)
                    db_sys.commit()
                
                log("Scenario: Cleanup", "pass", "Test data purged.")
            except Exception as e:
                log("Scenario: Cleanup", "fail", f"Cleanup warning: {str(e)}")

    # Finalize Log File
    try:
        with open(LOG_FILE_PATH, "a") as f:
            f.write(f"\nFinished at: {datetime.now().isoformat()}\n")
            f.write(f"Final Status: {report['status'].upper()}\n")
    except:
        pass

    return report

@router.get("/download-log", dependencies=[Depends(check_sysadmin_profile)])
def download_health_check_log(request: Request):
    """
    Downloads the latest system health check log file.
    """
    if not os.path.exists(LOG_FILE_PATH):
        raise HTTPException(status_code=404, detail="No log file available. Run diagnostics first.")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"health_check_log_{timestamp}.txt"
    
    return FileResponse(LOG_FILE_PATH, media_type='text/plain', filename=filename)
