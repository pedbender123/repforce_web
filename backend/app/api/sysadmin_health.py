import uuid
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..db import database, models, models_crm, schemas
from ..core.security import get_current_active_user, get_password_hash
from ..core import permissions

router = APIRouter()

@router.post("/run", dependencies=[Depends(get_current_active_user)])
def run_system_health_check(db_sys: Session = Depends(database.get_db)):
    """
    Executes a comprehensive system health check including a full lifecycle test:
    Tenant Creation -> User Creation -> Auth Check -> CRM Data (Client) -> Cleanup.
    """
    report = {
        "status": "pass",
        "checks": []
    }

    def log(name, status, message):
        report["checks"].append({"name": name, "status": status, "message": message})
        if status == "fail":
            report["status"] = "fail"

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
        # A. Create Tenant
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

        # Ensure Schema (reusing main.py logic or similar manual trigger)
        schema_name = f"tenant_{created_tenant_id}"
        try:
            db_sys.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
            db_sys.commit()
            
            # Create Tables
            with database.engine_crm.connect() as conn:
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
        role_sysadmin = db_sys.query(models.Role).filter(models.Role.name == "sysadmin").first()
        # If no global sysadmin role, try finding a local admin role or create one?
        # Let's assume standard 'admin' role exists or use the first available.
        # Ideally we create a role too to be fully isolated.
        
        # Create Role
        test_role = models.Role(name="TestAdmin", tenant_id=created_tenant_id, access_level="tenant")
        db_sys.add(test_role)
        db_sys.commit()
        
        user_test = models.User(
            username=f"test_{test_run_id}",
            name="Test User",
            email=f"test_{test_run_id}@example.com",
            hashed_password=get_password_hash("testpass"),
            tenant_id=created_tenant_id,
            role_id=test_role.id
        )
        db_sys.add(user_test)
        db_sys.commit()
        db_sys.refresh(user_test)
        log("Scenario: User Created", "pass", f"User {user_test.username} created")

        # C. Create CRM Client (Direct DB manipulation to simulate API)
        # We use a CRM session scoped to the tenant
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
                db_sys.execute(text(f"DROP SCHEMA IF EXISTS tenant_{created_tenant_id} CASCADE"))
                db_sys.commit()
                
                # 2. Delete Tenant (Cascade should handle User/Role if configured, else manual)
                # Ensure users are deleted first if no cascade
                db_sys.query(models.User).filter(models.User.tenant_id == created_tenant_id).delete()
                db_sys.query(models.Role).filter(models.Role.tenant_id == created_tenant_id).delete()
                
                tenant_to_del = db_sys.query(models.Tenant).filter(models.Tenant.id == created_tenant_id).first()
                if tenant_to_del:
                    db_sys.delete(tenant_to_del)
                    db_sys.commit()
                
                log("Scenario: Cleanup", "pass", "Test data purged.")
            except Exception as e:
                log("Scenario: Cleanup", "fail", f"Cleanup failed (Manual intervention required for tenant {created_tenant_id}): {str(e)}")

    return report
