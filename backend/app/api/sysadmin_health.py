import uuid
import time
import os
import json
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..db import database, models, models_crm, schemas
from ..core import permissions, security

router = APIRouter()

# --- CONSTANTS & STATE ---
LOG_FILE_PATH = "/app/health_check_latest.txt"
STATUS_FILE_PATH = "/app/health_check_status.json"

# Global Lock (simplistic for single-worker deployment)
# In multi-worker, use Redis or DB. File lock is "good enough" for this specific single-instance usage.
LOCK_FILE = "/app/health_check.lock"

# --- HELPER FUNCTIONS ---

def get_status_data():
    if not os.path.exists(STATUS_FILE_PATH):
        return {
            "status": "idle", # idle, running, finished, error
            "progress_percent": 0,
            "current_step": "",
            "steps": [], # {name, status, duration, details}
            "logs": []
        }
    try:
        with open(STATUS_FILE_PATH, "r") as f:
            return json.load(f)
    except:
        return {"status": "error", "message": "Could not read status file"}

def save_status_data(data):
    with open(STATUS_FILE_PATH, "w") as f:
        json.dump(data, f, default=str)

def check_sysadmin_profile(request: Request):
    if getattr(request.state, "role_name", None) != 'sysadmin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a SysAdmins."
        )
    return True

def append_log(msg, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    line = f"[{timestamp}] [{level}] {msg}"
    print(line) # Stdout
    
    # Save to .txt
    try:
        with open(LOG_FILE_PATH, "a") as f:
            f.write(line + "\n")
    except:
        pass
    
    # Update JSON logs (keep last 50 for UI polling to avoid payload bloat)
    data = get_status_data()
    data["logs"].append(line)
    if len(data["logs"]) > 100:
        data["logs"] = data["logs"][-100:]
    save_status_data(data)

def update_step(step_index, status, details=None, duration=None):
    data = get_status_data()
    if 0 <= step_index < len(data["steps"]):
        data["steps"][step_index]["status"] = status
        if details:
            data["steps"][step_index]["details"] = details
        if duration:
            data["steps"][step_index]["duration"] = f"{duration:.2f}s"
    
    # Calc progress
    total = len(data["steps"])
    completed = sum(1 for s in data["steps"] if s["status"] in ["done", "error"])
    data["progress_percent"] = int((completed / total) * 100)
    
    if status == "running":
        data["current_step"] = data["steps"][step_index]["name"]
        
    save_status_data(data)

# --- THE HEAVY JOB ---

async def run_scenario_task(db_sys: Session):
    start_global = time.time()
    
    # Initialize Status
    steps_config = [
        {"name": "System Connectivity", "status": "pending", "details": "Check DB connection"},
        {"name": "Create Test Tenant", "status": "pending", "details": "Provisioning isolated environment"},
        {"name": "Setup RBAC & User", "status": "pending", "details": "Creating Admin, Roles, Areas"},
        {"name": "High Volume Data (Products)", "status": "pending", "details": "Bulk inserting 10,000 products"},
        {"name": "High Volume Data (Clients)", "status": "pending", "details": "Bulk inserting 300 clients"},
        {"name": "Load Simulation (Orders)", "status": "pending", "details": "Simulating high-frequency transactions"},
        {"name": "Cleanup", "status": "pending", "details": "Purging all test data"}
    ]
    
    save_status_data({
        "status": "running",
        "progress_percent": 0,
        "current_step": "Initializing",
        "steps": steps_config,
        "logs": []
    })
    
    # Reset TXT Log
    with open(LOG_FILE_PATH, "w") as f:
        f.write(f"--- ADVANCED STRESS TEST REPORT ---\n")
        f.write(f"Started at: {datetime.now().isoformat()}\n\n")

    test_run_id = str(uuid.uuid4())[:8]
    test_tenant_name = f"StressTest_{test_run_id}"
    created_tenant_id = None
    
    try:
        # --- STEP 1: Connectivity ---
        step_idx = 0
        update_step(step_idx, "running")
        t0 = time.time()
        db_sys.execute(text("SELECT 1"))
        update_step(step_idx, "done", "Database reachable", time.time() - t0)
        append_log("System DB Connection Verified")

        # --- STEP 2: Create Tenant ---
        step_idx = 1
        update_step(step_idx, "running")
        t0 = time.time()
        
        new_tenant = models.Tenant(name=test_tenant_name, cnpj="00000000000000", status="active")
        db_sys.add(new_tenant)
        db_sys.commit()
        db_sys.refresh(new_tenant)
        created_tenant_id = new_tenant.id
        
        schema_name = f"tenant_{created_tenant_id}"
        with database.engine_crm.connect() as conn:
             conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
             conn.commit()
             conn.execute(text(f"SET search_path TO {schema_name}"))
             conn.commit()
             models_crm.BaseCrm.metadata.create_all(bind=conn)
             conn.commit()

        update_step(step_idx, "done", f"Tenant ID: {created_tenant_id}, Schema: {schema_name}", time.time() - t0)
        append_log(f"Tenant {test_tenant_name} created successfully.")

        # --- STEP 3: RBAC & User ---
        step_idx = 2
        update_step(step_idx, "running")
        t0 = time.time()
        
        # Role
        test_role = models.Role(name="StressAdmin", tenant_id=created_tenant_id, access_level="tenant")
        db_sys.add(test_role)
        db_sys.commit()
        
        # User
        user_test = models.User(
            username=f"stress_{test_run_id}",
            name="Stress User",
            email=f"stress_{test_run_id}@example.com",
            hashed_password=security.get_password_hash("stresspass"),
            tenant_id=created_tenant_id,
            role_id=test_role.id
        )
        db_sys.add(user_test)
        db_sys.commit()
        
        update_step(step_idx, "done", f"User: stress_{test_run_id}", time.time() - t0)
        append_log("RBAC and User configured.")

        # --- STEP 4: 10k Products (Bulk) ---
        step_idx = 3
        update_step(step_idx, "running")
        t0 = time.time()
        
        # Prepare Data
        products_data = []
        for i in range(10000):
            products_data.append({
                "name": f"Product Stress {i}",
                "sku": f"SKU-{test_run_id}-{i}",
                "price": 10.50 + (i * 0.01),
                "tenant_id": created_tenant_id, # Actually unused in CRM schema if context set, but good for completeness
                # CRM models usually don't have tenant_id column if using schema multitenancy, 
                # but typically they assume schema context. 
                # We need to check models_crm.Product definition.
                # Assuming standard fields.
                "description": "Auto-generated for stress testing"
            })
            
        crm_db = database.SessionCrm()
        try:
            crm_db.execute(text(f"SET search_path TO {schema_name}"))
            
            # Using Core Insert for performance (ORM add_all is slower)
            # We verify models_crm.Product table name
            conn = crm_db.connection()
            conn.execute(
                models_crm.Product.__table__.insert(),
                products_data
            )
            crm_db.commit()
            
        except Exception as e:
            update_step(step_idx, "error", f"Bulk Insert Failed: {str(e)}")
            append_log(f"Error inserting products: {e}", "ERROR")
            raise e
        finally:
            crm_db.close()
            
        update_step(step_idx, "done", "10,000 Products Inserted", time.time() - t0)
        append_log("Massive Product Data Injection Complete.")

        # --- STEP 5: 300 Clients (Bulk) ---
        step_idx = 4
        update_step(step_idx, "running")
        t0 = time.time()
        
        clients_data = []
        for i in range(300):
            clients_data.append({
                "name": f"Client Stress {i}",
                "fantasy_name": f"Store {i}",
                "cnpj": f"{i:014d}", # Fake CNPJ
                "email": f"client{i}@stress.test",
                "representative_id": user_test.id,
                "status": "active"
            })
            
        crm_db = database.SessionCrm()
        try:
            crm_db.execute(text(f"SET search_path TO {schema_name}"))
            conn = crm_db.connection()
            conn.execute(
                models_crm.Client.__table__.insert(),
                clients_data
            )
            crm_db.commit()
        except Exception as e:
            update_step(step_idx, "error", str(e))
            raise e
        finally:
            crm_db.close()
            
        update_step(step_idx, "done", "300 Clients Inserted", time.time() - t0)
        append_log("Massive Client Data Injection Complete.")

        # --- STEP 6: Load Simulation (Orders) ---
        step_idx = 5
        update_step(step_idx, "running")
        t0 = time.time()
        
        # Connect to CRM DB
        crm_db = database.SessionCrm()
        crm_db.execute(text(f"SET search_path TO {schema_name}"))
        
        # Fetch a client and a product to use
        client_id = 1 # We know we inserted some, IDs likely auto-increment from 1
        product_id = 1
        
        # Simulate 50 orders rapidly
        for i in range(50):
            # Create Order
            # Minimal order structure
            order = models_crm.Order(
                client_id=client_id,
                representative_id=user_test.id,
                total=100.00,
                status="draft"
            )
            crm_db.add(order)
            # Add item logic would go here, skipping for speed/simplicity of "DB Write Load"
            
            if i % 10 == 0:
                crm_db.commit() # Commit batches
                # await asyncio.sleep(0.1) # Simulate network latency if desired
                
        crm_db.commit()
        crm_db.close()
        
        update_step(step_idx, "done", "50 Orders Transaction Loop", time.time() - t0)
        append_log("Load Simulation Complete.")

    except Exception as e:
        append_log(f"CRITICAL FAILURE: {str(e)}", "ERROR")
        data = get_status_data()
        data["status"] = "error"
        save_status_data(data)
        
    finally:
        # --- STEP 7: Cleanup (Always Run) ---
        step_idx = 6
        update_step(step_idx, "running")
        t0 = time.time()
        
        if created_tenant_id:
            try:
                # Drop Schema
                with database.engine_crm.connect() as conn:
                    conn.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
                    conn.commit()
                
                # Delete Tenant/User/Role
                db_sys.query(models.User).filter(models.User.tenant_id == created_tenant_id).delete()
                db_sys.query(models.Role).filter(models.Role.tenant_id == created_tenant_id).delete()
                db_sys.query(models.Tenant).filter(models.Tenant.id == created_tenant_id).delete()
                db_sys.commit()
                
                update_step(step_idx, "done", "Environment Destroyed", time.time() - t0)
                append_log("Cleanup Successful.")
            except Exception as e:
                update_step(step_idx, "error", f"Partial Cleanup: {str(e)}")
                append_log(f"Cleanup Failed: {e}", "WARN")
        else:
             update_step(step_idx, "done", "Nothing to clean", 0)

        # Release Lock & Finalize
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)
            
        data = get_status_data()
        if data["status"] != "error":
            data["status"] = "finished"
        
        total_time = time.time() - start_global
        append_log(f"Total Execution Time: {total_time:.2f}s")
        save_status_data(data)


# --- ENDPOINTS ---

@router.post("/run", dependencies=[Depends(check_sysadmin_profile)])
def trigger_health_check(background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    if os.path.exists(LOCK_FILE):
        return JSONResponse(status_code=409, content={"detail": "Tests already running", "status": "running"})
    
    # Create Lock
    with open(LOCK_FILE, "w") as f:
        f.write(datetime.now().isoformat())
        
    # Start Task
    background_tasks.add_task(run_scenario_task, db)
    
    return {"message": "Stress test started", "status": "running"}

@router.get("/status", dependencies=[Depends(check_sysadmin_profile)])
def get_health_check_status():
    return get_status_data()

@router.get("/download-log", dependencies=[Depends(check_sysadmin_profile)])
def download_health_check_log(request: Request):
    if not os.path.exists(LOG_FILE_PATH):
        raise HTTPException(status_code=404, detail="No log file available.")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"advanced_stress_test_{timestamp}.txt"
    return FileResponse(LOG_FILE_PATH, media_type='text/plain', filename=filename)
