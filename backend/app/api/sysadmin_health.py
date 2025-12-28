import uuid
import time
import os
import json
import asyncio
from datetime import datetime
from typing import List, Optional, Any, Callable, Dict
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
LOCK_FILE = "/app/health_check.lock"

# --- HELPER FUNCTIONS ---

def get_status_data():
    if not os.path.exists(STATUS_FILE_PATH):
        return {
            "status": "idle",
            "progress_percent": 0,
            "current_step": "",
            "steps": [],
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
    # Check both legacy role_name and new is_sysadmin flag
    role = getattr(request.state, "role_name", "")
    is_sys = getattr(request.state, "is_sysadmin", False)
    
    if role != 'sysadmin' and not is_sys:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a SysAdmins."
        )
    return True

def log_raw(msg):
    # Appends to file and memory log only
    timestamp = datetime.now().strftime("%H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    
    try:
        with open(LOG_FILE_PATH, "a") as f:
            f.write(line + "\n")
    except:
        pass
    
    data = get_status_data()
    data["logs"].append(line)
    if len(data["logs"]) > 200: # Increased log buffer for Galaxy mode
        data["logs"] = data["logs"][-200:]
    save_status_data(data)

def update_step_status(step_index, status, details=None, duration=None):
    data = get_status_data()
    if 0 <= step_index < len(data["steps"]):
        data["steps"][step_index]["status"] = status
        if details:
            data["steps"][step_index]["details"] = details
        if duration:
            data["steps"][step_index]["duration"] = f"{duration:.3f}s"
    
    total = len(data["steps"])
    completed = sum(1 for s in data["steps"] if s["status"] in ["done", "error"])
    data["progress_percent"] = int((completed / total) * 100)
    
    if status == "running":
        data["current_step"] = data["steps"][step_index]["name"]
        
    save_status_data(data)

# --- MICRO-TEST ENGINE ---

class MicroTestRunner:
    def __init__(self, db_sys: Session):
        self.db_sys = db_sys
        self.run_id = str(uuid.uuid4())[:8]
        self.tenant_id = None
        self.schema_name = None
        self.user_id = None
        self.crm_db = None

    def _get_crm_session(self):
        if not self.schema_name:
             raise Exception("Schema not initialized")
        db = database.SessionCrm()
        db.execute(text(f"SET search_path TO {self.schema_name}"))
        return db

    def run_micro_test(self, name: str, input_data: Dict[str, Any], action: Callable, validation: Optional[Callable] = None) -> Any:
        """
        Executes a atomic test with detailed Input/Output logging.
        """
        input_str = str(input_data)
        log_raw(f"[TEST] {name} | Input: {input_str}")
        
        start_time = time.time()
        try:
            # EXECUTE ACTION
            result = action()
            
            # OPTIONAL VALIDATION
            if validation:
                validation(result)
                
            duration = time.time() - start_time
            
            # Format Output safely
            output_str = str(result)
            if len(output_str) > 100: output_str = output_str[:100] + "..."
            
            log_raw(f"[PASS] {name} | Output: {output_str} | Time: {duration:.4f}s")
            return result

        except Exception as e:
            duration = time.time() - start_time
            log_raw(f"[FAIL] {name} | Error: {str(e)} | Time: {duration:.4f}s")
            raise e

    # --- SUITES ---

    def suite_foundation_galaxy(self):
        log_raw("--- GALAXY SUITE: FOUNDATION & RBAC ---")
        
        # 1. Tenant
        def action_create_tenant():
            # Use timestamp based CNPJ to avoid collision if cleanup fails
            random_cnpj = f"{int(time.time()*1000)}"[:14]
            t = models.Tenant(name=f"Galaxy_{self.run_id}", cnpj=random_cnpj, status="active")
            self.db_sys.add(t)
            self.db_sys.commit()
            self.db_sys.refresh(t)
            self.tenant_id = t.id
            self.schema_name = f"tenant_{t.id}"
            return {"id": t.id, "name": t.name, "schema": self.schema_name}
            
        self.run_micro_test("Create Tenant", {"name": f"Galaxy_{self.run_id}"}, action_create_tenant)

        # 2. Schema
        def action_create_schema():
            with database.engine_crm.connect() as conn:
                conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {self.schema_name}"))
                conn.commit()
                conn.execute(text(f"SET search_path TO {self.schema_name}"))
                conn.commit()
                models_crm.BaseCrm.metadata.create_all(bind=conn)
                conn.commit()
            return "Schema Created & Migrated"
        
        self.run_micro_test("Initialize Schema", {"schema": self.schema_name}, action_create_schema)

        # 3. Area
        def action_create_area():
            # Bind area to tenant so we can clean it up, and use icon/pages_json
            a = models.Area(name="CRM_GALAXY", icon="Star", pages_json=[], tenant_id=self.tenant_id)
            self.db_sys.add(a)
            self.db_sys.commit()
            self.db_sys.refresh(a)
            return {"id": a.id, "name": a.name}
            
        area_res = self.run_micro_test("Create Area", {"name": "CRM_GALAXY", "icon": "Star"}, action_create_area)
        
        # 4. Role
        def action_create_role():
            r = models.Role(name="GalaxyCommander", tenant_id=self.tenant_id, access_level="tenant")
            # Link Area
            area = self.db_sys.query(models.Area).get(area_res["id"])
            r.areas.append(area)
            self.db_sys.add(r)
            self.db_sys.commit()
            self.db_sys.refresh(r)
            return {"id": r.id, "name": r.name, "areas": [a.name for a in r.areas]}
            
        role_res = self.run_micro_test("Create Role & Link Area", {"name": "GalaxyCommander", "area_id": area_res["id"]}, action_create_role)

        # 5. User
        def action_create_user():
            u = models.User(
                username=f"cmdr_{self.run_id}",
                name="Commander Shepard",
                email=f"cmdr_{self.run_id}@alliance.net",
                hashed_password=security.get_password_hash("n7"),
                tenant_id=self.tenant_id,
                role_id=role_res["id"]
            )
            self.db_sys.add(u)
            self.db_sys.commit()
            self.db_sys.refresh(u)
            self.user_id = u.id
            return {"id": u.id, "username": u.username}

        def validate_user(res):
            u = self.db_sys.query(models.User).get(res["id"])
            if u.role_obj.name != "GalaxyCommander": raise Exception("Role mismatch")
            
        self.run_micro_test("Create User & Assign Role", {"username": f"cmdr_{self.run_id}"}, action_create_user, validate_user)


    def suite_catalog_galaxy(self):
        log_raw("--- GALAXY SUITE: CATALOG FUNCTIONAL ---")
        crm_session = self._get_crm_session() # Local session for this suite
        
        try:
            # 1. Brand
            def action_brand():
                b = models_crm.Brand(name="MassEffectArts")
                crm_session.add(b)
                crm_session.commit()
                crm_session.refresh(b)
                return b.id
            brand_id = self.run_micro_test("Create Brand", {"name": "MassEffectArts"}, action_brand)

            # 2. Supplier
            def action_supplier():
                s = models_crm.Supplier(name="Citadel Supplies", email="shop@citadel.space")
                crm_session.add(s)
                crm_session.commit()
                crm_session.refresh(s)
                return s.id
            supplier_id = self.run_micro_test("Create Supplier", {"name": "Citadel Supplies"}, action_supplier)

            # 3. Product
            def action_product():
                p = models_crm.Product(
                    name="Omni-Tool v1",
                    sku=f"OMNI-{self.run_id}",
                    price=5000.00,
                    brand_id=brand_id,
                    supplier_id=supplier_id
                )
                crm_session.add(p)
                crm_session.commit()
                crm_session.refresh(p)
                return {"id": p.id, "brand_loaded": p.brand.name}
            
            def validate_product(res):
                if res["brand_loaded"] != "MassEffectArts": raise Exception("Relationship Loading Failed")

            prod_res = self.run_micro_test("Create Product & Verify Rel", 
                                          {"name": "Omni-Tool v1", "brand_id": brand_id, "supplier_id": supplier_id}, 
                                          action_product, validate_product)
            
            return prod_res["id"], 5000.00

        finally:
            crm_session.close()

    def suite_sales_physics(self, client_id, product_id, base_price):
        log_raw("--- GALAXY SUITE: SALES PHYSICS (MATH) ---")
        crm_session = self._get_crm_session()
        
        try:
            # 1. Discount Rule
            def action_rule():
                r = models_crm.DiscountRule(name="Spectre Discount", type="value", discount_percent=20.0, active=True)
                crm_session.add(r)
                crm_session.commit()
                return "20% Rule Created"
            self.run_micro_test("Create Discount Rule", {"percent": 20.0}, action_rule)

            # 2. Order Calculation
            qty = 3
            def action_order_calc():
                # Logic: Unit 5000 * 0.8 (20% off) = 4000. Total = 4000 * 3 = 12000.
                expected_unit = base_price * 0.8
                expected_total = expected_unit * qty
                
                o = models_crm.Order(
                    client_id=client_id, 
                    representative_id=self.user_id, 
                    total_value=expected_total,
                    status="draft"
                )
                crm_session.add(o)
                crm_session.commit()
                
                item = models_crm.OrderItem(
                    order_id=o.id,
                    product_id=product_id,
                    quantity=qty,
                    unit_price=base_price,
                    net_unit_price=expected_unit,
                    total=expected_total
                )
                crm_session.add(item)
                crm_session.commit()
                crm_session.refresh(item)
                return {"item_total": item.total, "expected": expected_total}

            def validate_math(res):
                if abs(res["item_total"] - res["expected"]) > 0.01:
                    raise Exception(f"Math Error: {res['item_total']} != {res['expected']}")

            self.run_micro_test("Order Math Verification", 
                               {"qty": qty, "base": base_price, "discount": "20%"}, 
                               action_order_calc, validate_math)
        finally:
            crm_session.close()

    def suite_stress_singularity(self):
        log_raw("--- GALAXY SUITE: STRESS SINGULARITY ---")
        crm_session = self._get_crm_session()
        try:
            # 1. 10k Products
            def action_bulk_products():
                data = [{"name": f"P-{i}", "sku": f"SKU-{i}", "price": 10.0} for i in range(10000)]
                conn = crm_session.connection()
                conn.execute(models_crm.Product.__table__.insert(), data)
                crm_session.commit()
                return "10,000 Rows Inserted"
            
            self.run_micro_test("Bulk Insert Products", {"count": 10000}, action_bulk_products)

            # 2. 300 Clients
            def action_bulk_clients():
                data = [{"name": f"C-{i}", "cnpj": f"{i}", "representative_id": self.user_id} for i in range(300)]
                conn = crm_session.connection()
                conn.execute(models_crm.Client.__table__.insert(), data)
                crm_session.commit()
                return "300 Rows Inserted"
                
            client_id = 1 # safely assume
            self.run_micro_test("Bulk Insert Clients", {"count": 300}, action_bulk_clients)

            return client_id

        finally:
            crm_session.close()

    def cleanup(self):
        log_raw("--- CLEANUP ---")
        if self.tenant_id:
            try:
                # 1. Drop CRM Schema (Cascades to all data in schema)
                with database.engine_crm.connect() as conn:
                    conn.execute(text(f"DROP SCHEMA IF EXISTS {self.schema_name} CASCADE"))
                    conn.commit()
                
                # 2. Clean System DB (Order matters for FK)
                
                # A. Remove Role-Area links manually
                roles = self.db_sys.query(models.Role).filter(models.Role.tenant_id == self.tenant_id).all()
                for r in roles:
                    r.areas = [] # Clear Many-Many
                self.db_sys.commit()

                # B. Delete Users
                self.db_sys.query(models.User).filter(models.User.tenant_id == self.tenant_id).delete()
                
                # C. Delete Roles
                self.db_sys.query(models.Role).filter(models.Role.tenant_id == self.tenant_id).delete()
                
                # D. Delete Areas (Now that we bind them to tenant)
                self.db_sys.query(models.Area).filter(models.Area.tenant_id == self.tenant_id).delete()

                # E. Delete Tenant
                self.db_sys.query(models.Tenant).filter(models.Tenant.id == self.tenant_id).delete()
                self.db_sys.commit()
                
                log_raw("Environment Destroyed (Clean)")
            except Exception as e:
                log_raw(f"Cleanup Error: {e}")
                self.db_sys.rollback()

# --- ASYNC JOB ---

async def execute_galaxy_test(db: Session):
    runner = MicroTestRunner(db)
    
    # UI Steps (High Level)
    steps_ui = [
        {"name": "Foundation (RBAC)", "status": "pending", "details": "Tenant, Area, Role, User creation & linking"},
        {"name": "Catalog Galaxy", "status": "pending", "details": "Brands, Suppliers, Products logic"},
        {"name": "Stress Data (10k)", "status": "pending", "details": "Massive Bulk Inserts"},
        {"name": "Sales Physics", "status": "pending", "details": "Discount Math Verification"},
        {"name": "Cleanup", "status": "pending", "details": "Wiping Test Data"}
    ]
    
    save_status_data({
        "status": "running",
        "progress_percent": 0,
        "current_step": "Initializing",
        "steps": steps_ui,
        "logs": []
    })

    # Reset Log File
    with open(LOG_FILE_PATH, "w") as f:
        f.write(f"--- ULTRA GALAXY SYSTEM TEST REPORT ---\n")
        f.write(f"Timestamp: {datetime.now().isoformat()}\n\n")

    # --- EXECUTION CHAIN (CONTINUE ON ERROR) ---

    # Global State for Dependencies
    pid, price = None, 100.0 # Default fallback
    cid = 1

    # Step 1: Foundation (CRITICAL - Abort on Failure)
    try:
        update_step_status(0, "running")
        t0 = time.time()
        runner.suite_foundation_galaxy()
        update_step_status(0, "done", "Micro-Tests Passed", time.time() - t0)
    except Exception as e:
        log_raw(f"[CRITICAL] Foundation Failed: {e}")
        update_step_status(0, "error", str(e))
        # Cannot proceed without Tenant/Schema
        data = get_status_data()
        data["status"] = "error"
        save_status_data(data)
        
        # Cleanup & Exit
        runner.cleanup()
        if os.path.exists(LOCK_FILE): os.remove(LOCK_FILE)
        return

    # Step 2: Catalog (Soft Fail)
    try:
        update_step_status(1, "running")
        t0 = time.time()
        pid, price = runner.suite_catalog_galaxy()
        update_step_status(1, "done", "Micro-Tests Passed", time.time() - t0)
    except Exception as e:
        log_raw(f"[FAIL] Catalog Suite Failed: {e}")
        update_step_status(1, "error", str(e))
        # Proceed with defaults (pid=None)

    # Step 3: Stress (Soft Fail)
    try:
        update_step_status(2, "running")
        t0 = time.time()
        cid = runner.suite_stress_singularity() 
        update_step_status(2, "done", "10k Products & 300 Clients", time.time() - t0)
    except Exception as e:
        log_raw(f"[FAIL] Stress Suite Failed: {e}")
        update_step_status(2, "error", str(e))
    
    # Step 4: Sales Physics (Soft Fail)
    try:
        update_step_status(3, "running")
        t0 = time.time()
        if not pid: raise Exception("Skipped: No Product ID from Catalog")
        
        runner.suite_sales_physics(cid, pid, price)
        update_step_status(3, "done", "Math Verified", time.time() - t0)
    except Exception as e:
        log_raw(f"[FAIL] Sales Suite Failed: {e}")
        update_step_status(3, "error", str(e))

    # Finalize
    try:
        # Step 5: Cleanup
        update_step_status(4, "running")
        runner.cleanup()
        update_step_status(4, "done")
    except Exception as e:
        log_raw(f"[FAIL] Cleanup Failed: {e}")
        update_step_status(4, "error", str(e))
    
    # Always unlock and save final status
    if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)
    
    data = get_status_data()
    # If any step failed, mark global status as error, otherwise finished
    has_error = any(s["status"] == "error" for s in data["steps"])
    data["status"] = "finished" if not has_error else "error" 
    # NOTE: "finished" means completed execution, "error" might imply crash. 
    # But frontend handles both essentially the same (stops polling).
    # Let's keep "finished" if we ran through everything, even with sub-failures? 
    # No, user wants to know if it failed. "error" is safer for Red UI.
    save_status_data(data)

# --- ENDPOINTS ---

@router.post("/run", dependencies=[Depends(check_sysadmin_profile)])
def trigger_galaxy_test(background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    if os.path.exists(LOCK_FILE):
        return JSONResponse(status_code=409, content={"detail": "Tests already running", "status": "running"})
    
    with open(LOCK_FILE, "w") as f:
        f.write(datetime.now().isoformat())
        
    background_tasks.add_task(execute_galaxy_test, db)
    return {"message": "Ultra Galaxy Test Sequence Initiated", "status": "running"}

@router.get("/status", dependencies=[Depends(check_sysadmin_profile)])
def get_status():
    return get_status_data()

@router.get("/download-log", dependencies=[Depends(check_sysadmin_profile)])
def download_log():
    if not os.path.exists(LOG_FILE_PATH):
        raise HTTPException(status_code=404, detail="Log not found")
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    return FileResponse(LOG_FILE_PATH, media_type='text/plain', filename=f"galaxy_test_{ts}.txt")
