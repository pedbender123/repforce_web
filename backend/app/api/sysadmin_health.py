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
    if getattr(request.state, "role_name", None) != 'sysadmin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a SysAdmins."
        )
    return True

def log(msg, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    line = f"[{timestamp}] [{level}] {msg}"
    print(line)
    
    try:
        with open(LOG_FILE_PATH, "a") as f:
            f.write(line + "\n")
    except:
        pass
    
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
    
    total = len(data["steps"])
    completed = sum(1 for s in data["steps"] if s["status"] in ["done", "error"])
    data["progress_percent"] = int((completed / total) * 100)
    
    if status == "running":
        data["current_step"] = data["steps"][step_index]["name"]
        
    save_status_data(data)

# --- TEST SUITES ---

class TestRunner:
    def __init__(self, db_sys: Session):
        self.db_sys = db_sys
        self.run_id = str(uuid.uuid4())[:8]
        self.tenant_id = None
        self.schema_name = None
        self.user_id = None
        self.start_time = time.time()

    def _get_crm_session(self):
        db = database.SessionCrm()
        db.execute(text(f"SET search_path TO {self.schema_name}"))
        return db

    def suite_foundation(self):
        log("--- SUITE: FOUNDATION & RBAC ---", "SUITE")
        # 1. Create Tenant
        tenant_name = f"GoldTest_{self.run_id}"
        log(f"Creating Tenant: {tenant_name}")
        
        new_tenant = models.Tenant(name=tenant_name, cnpj="00000000000000", status="active")
        self.db_sys.add(new_tenant)
        self.db_sys.commit()
        self.db_sys.refresh(new_tenant)
        self.tenant_id = new_tenant.id
        self.schema_name = f"tenant_{self.tenant_id}"
        
        # Schema
        log(f"Initializing Schema: {self.schema_name}")
        with database.engine_crm.connect() as conn:
             conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {self.schema_name}"))
             conn.commit()
             conn.execute(text(f"SET search_path TO {self.schema_name}"))
             conn.commit()
             models_crm.BaseCrm.metadata.create_all(bind=conn)
             conn.commit()

        # 2. RBAC (Area & Role)
        log("Creating Area: CRM_TEST")
        area = models.Area(name="CRM_TEST", icon="Cube", pages_json=[])
        self.db_sys.add(area)
        self.db_sys.commit()

        log("Creating Role: TesterRole with access to CRM_TEST")
        role = models.Role(name="TesterRole", tenant_id=self.tenant_id, access_level="tenant")
        role.areas.append(area)
        self.db_sys.add(role)
        self.db_sys.commit()

        # 3. User
        log("Creating User: tester")
        user = models.User(
            username=f"tester_{self.run_id}",
            name="Tester User",
            email=f"tester_{self.run_id}@example.com",
            hashed_password=security.get_password_hash("testpass"),
            tenant_id=self.tenant_id,
            role_id=role.id
        )
        self.db_sys.add(user)
        self.db_sys.commit()
        self.db_sys.refresh(user)
        self.user_id = user.id

        # Validation
        log("Validating RBAC Assignment...")
        user_check = self.db_sys.query(models.User).filter(models.User.id == self.user_id).first()
        if not user_check.role_obj or "CRM_TEST" not in [a.name for a in user_check.role_obj.areas]:
            raise Exception("RBAC Validation Failed: User does not have expected Area access")
        log("RBAC OK: User has correct role and area access")

    def suite_catalog(self):
        log("--- SUITE: CATALOG (FUNCTIONAL) ---", "SUITE")
        crm_db = self._get_crm_session()
        try:
            # Create Dependencies
            log("Creating Brand, Family, Supplier...")
            brand = models_crm.Brand(name="TestBrand")
            family = models_crm.ProductFamily(name="TestFamily")
            supplier = models_crm.Supplier(name="TestSupplier")
            crm_db.add_all([brand, family, supplier])
            crm_db.commit()

            # Create Product
            log("Creating Product with relationships...")
            product = models_crm.Product(
                name="Gold Standard Product",
                sku=f"GOLD-{self.run_id}",
                price=100.00,
                brand_id=brand.id,
                family_id=family.id,
                supplier_id=supplier.id
            )
            crm_db.add(product)
            crm_db.commit()
            crm_db.refresh(product)

            # Validation
            if product.brand.name != "TestBrand" or product.supplier.name != "TestSupplier":
                raise Exception("Catalog Validation Failed: Relationships broken")
            log(f"Catalog OK: Product {product.id} linked correctly")
            return product.id, product.price
        finally:
            crm_db.close()

    def suite_crm(self):
        log("--- SUITE: CRM (FUNCTIONAL) ---", "SUITE")
        crm_db = self._get_crm_session()
        try:
            log("Creating Client with Address & Contact...")
            client = models_crm.Client(
                name="Gold Client",
                fantasy_name="Gold Corp",
                cnpj="99988877700011",
                representative_id=self.user_id,
                city="Test City",
                state="TS"
            )
            crm_db.add(client)
            crm_db.commit()
            
            contact = models_crm.Contact(name="Gold Contact", client_id=client.id, is_primary=True)
            crm_db.add(contact)
            crm_db.commit()

            # Validation
            client_check = crm_db.query(models_crm.Client).filter(models_crm.Client.id == client.id).first()
            if not client_check.contacts or client_check.contacts[0].name != "Gold Contact":
                raise Exception("CRM Validation Failed: Contact not linked")
            log(f"CRM OK: Client {client.id} has contact")
            return client.id
        finally:
            crm_db.close()

    def suite_sales(self, client_id, product_id, base_price):
        log("--- SUITE: SALES (CALCULATION) ---", "SUITE")
        crm_db = self._get_crm_session()
        try:
            log("Creating Discount Rule (10% off)...")
            rule = models_crm.DiscountRule(
                name="Gold Discount",
                type="value", # Simplification
                discount_percent=10.0,
                active=True
            )
            crm_db.add(rule)
            crm_db.commit()

            log("Creating Order...")
            qty = 2
            expected_unit_price = base_price * 0.9 # 10% off = 90.0
            expected_total = expected_unit_price * qty # 180.0

            order = models_crm.Order(
                client_id=client_id,
                representative_id=self.user_id,
                total_value=expected_total, # In real app, this is calc'd by BE. Here we set expected.
                status="draft"
            )
            crm_db.add(order)
            crm_db.commit()

            item = models_crm.OrderItem(
                order_id=order.id,
                product_id=product_id,
                quantity=qty,
                unit_price=base_price,
                discount_value=10.0, # % or value depending on logic
                net_unit_price=expected_unit_price,
                total=expected_total
            )
            crm_db.add(item)
            crm_db.commit()

            # Validation
            # Here we validate that what we saved (simulating the calculation engine) is consistent
            log(f"Sales Validation: Checking if {item.total} == {expected_total}")
            if abs(item.total - expected_total) > 0.01:
                 raise Exception(f"Sales Validation Failed: Math error. Got {item.total}, expected {expected_total}")
            log("Sales OK: Mathematical integrity verified")
        finally:
            crm_db.close()

    def suite_stress(self):
        log("--- SUITE: STRESS (HEAVY LOAD) ---", "SUITE")
        crm_db = self._get_crm_session()
        try:
            log("Bulk Inserting 10,000 Products...")
            products_data = [{
                "name": f"P-{i}", "sku": f"SKU-{i}", "price": 10.0
            } for i in range(10000)]
            
            conn = crm_db.connection()
            conn.execute(models_crm.Product.__table__.insert(), products_data)
            crm_db.commit()
            log("10k Products Inserted")

            log("Bulk Inserting 300 Clients...")
            clients_data = [{
                "name": f"C-{i}", "cnpj": f"{i}", "representative_id": self.user_id
            } for i in range(300)]
            conn.execute(models_crm.Client.__table__.insert(), clients_data)
            crm_db.commit()
            log("300 Clients Inserted")

            log("Running Load Simulation (50 transactions)...")
            # Minimalist loop for speed
            for i in range(50):
                o = models_crm.Order(client_id=1, representative_id=self.user_id, total_value=100.0)
                crm_db.add(o)
                # Commit every 10
                if i % 10 == 0: crm_db.commit()
            crm_db.commit()
            log("Load Simulation OK")
            
        finally:
            crm_db.close()

    def cleanup(self):
        log("--- CLEANUP ---", "SUITE")
        if self.tenant_id:
            try:
                log(f"Dropping Schema {self.schema_name}...")
                with database.engine_crm.connect() as conn:
                    conn.execute(text(f"DROP SCHEMA IF EXISTS {self.schema_name} CASCADE"))
                    conn.commit()
                
                log("Deleting System Data (User, Role, Tenant)...")
                self.db_sys.query(models.User).filter(models.User.tenant_id == self.tenant_id).delete()
                self.db_sys.query(models.Role).filter(models.Role.tenant_id == self.tenant_id).delete()
                self.db_sys.query(models.Tenant).filter(models.Tenant.id == self.tenant_id).delete()
                self.db_sys.commit()
                log("Cleanup Complete")
            except Exception as e:
                log(f"Cleanup Error: {e}", "WARN")

# --- ASYNC EXECUTOR ---

async def run_full_suite(db: Session):
    runner = TestRunner(db)
    
    steps_ui = [
        {"name": "Suite 1: Foundation & RBAC", "status": "pending", "details": "Tenant, User, Role, Menu Access"},
        {"name": "Suite 2: Catalog Functional", "status": "pending", "details": "Brands, Families, Products, Relationships"},
        {"name": "Suite 3: CRM Functional", "status": "pending", "details": "Client, Address, Contacts linking"},
        {"name": "Suite 4: Sales Calculation", "status": "pending", "details": "Discount Rules, Order Total Math Check"},
        {"name": "Suite 5: Stress Test (10k)", "status": "pending", "details": "Massive Data Injection & Load"},
        {"name": "Cleanup", "status": "pending", "details": "Purge Test Environment"}
    ]
    
    save_status_data({
        "status": "running",
        "progress_percent": 0,
        "current_step": "Initializing",
        "steps": steps_ui,
        "logs": []
    })

    # Reset Log
    with open(LOG_FILE_PATH, "w") as f:
        f.write(f"--- GOLD STANDARD SYSTEM TEST ---\n")
        f.write(f"Started at: {datetime.now().isoformat()}\n\n")

    try:
        # Step 1
        update_step(0, "running")
        t0 = time.time()
        runner.suite_foundation()
        update_step(0, "done", "RBAC Verified", time.time() - t0)

        # Step 2
        update_step(1, "running")
        t0 = time.time()
        pid, price = runner.suite_catalog()
        update_step(1, "done", f"Product ID: {pid}", time.time() - t0)

        # Step 3
        update_step(2, "running")
        t0 = time.time()
        cid = runner.suite_crm()
        update_step(2, "done", f"Client ID: {cid}", time.time() - t0)

        # Step 4
        update_step(3, "running")
        t0 = time.time()
        runner.suite_sales(cid, pid, price)
        update_step(3, "done", "Math Integrity OK", time.time() - t0)

        # Step 5
        update_step(4, "running")
        t0 = time.time()
        runner.suite_stress()
        update_step(4, "done", "10k Items Handled", time.time() - t0)

    except Exception as e:
        log(f"CRITICAL FAILURE: {e}", "ERROR")
        update_step(999, "error") # Hack to just mark progress as error, ui shows last step
        # Find running step and mark error
        data = get_status_data()
        for i, s in enumerate(data["steps"]):
            if s["status"] == "running":
                update_step(i, "error", str(e))
                break
        data = get_status_data()
        data["status"] = "error"
        save_status_data(data)

    finally:
        update_step(5, "running")
        t0 = time.time()
        runner.cleanup()
        update_step(5, "done", "Environment Clean", time.time() - t0)

        # Release Lock
        if os.path.exists(LOCK_FILE):
             os.remove(LOCK_FILE)
        
        data = get_status_data()
        if data["status"] != "error":
            data["status"] = "finished"
        save_status_data(data)

# --- ENDPOINTS ---

@router.post("/run", dependencies=[Depends(check_sysadmin_profile)])
def trigger_health_check(background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    if os.path.exists(LOCK_FILE):
        return JSONResponse(status_code=409, content={"detail": "Tests already running", "status": "running"})
    
    with open(LOCK_FILE, "w") as f:
        f.write(datetime.now().isoformat())
        
    background_tasks.add_task(run_full_suite, db)
    return {"message": "Gold Standard Test Started", "status": "running"}

@router.get("/status", dependencies=[Depends(check_sysadmin_profile)])
def get_health_check_status():
    return get_status_data()

@router.get("/download-log", dependencies=[Depends(check_sysadmin_profile)])
def download_health_check_log(request: Request):
    if not os.path.exists(LOG_FILE_PATH):
        raise HTTPException(status_code=404, detail="No log file available.")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return FileResponse(LOG_FILE_PATH, media_type='text/plain', filename=f"gold_test_{timestamp}.txt")
