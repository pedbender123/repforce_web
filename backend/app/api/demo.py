import time
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..db import database, models, models_crm, schemas
from ..core import permissions, security

router = APIRouter()

# --- DEMO SERVICE ---

class DemoService:
    def __init__(self, sys_db: Session):
        self.sys_db = sys_db

    def _get_crm_session(self, tenant_id: int):
        db = database.SessionCrm()
        schema_name = f"tenant_{tenant_id}"
        db.execute(text(f"SET search_path TO {schema_name}"))
        return db

    def start_demo(self, tenant_id: int, user_id: Optional[int] = None):
        """
        1. Set tenant.demo_mode_start = NOW()
        2. Populate sample data (Brands, Products, Clients, etc.)
        """
        tenant = self.sys_db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        start_time = datetime.now()
        tenant.demo_mode_start = start_time
        self.sys_db.commit()

        # POPULATE DATA
        crm_db = self._get_crm_session(tenant_id)
        try:
            # 1. Brands
            brands = []
            for name in ["Apex Innovations", "Nebula Corp", "Quantum Gear", "Synapse Sol", "Echo Dynamics"]:
                b = models_crm.Brand(name=name)
                crm_db.add(b)
                brands.append(b)
            crm_db.commit() # Get IDs

            # 2. Families & Types (Skip for brevity, use defaults if model allows, or create simple ones)
            # Assuming Product just needs Brand/Supplier
            
            # 3. Suppliers
            supplier = models_crm.Supplier(name="Global Demo Supply", email="demo@supply.com")
            crm_db.add(supplier)
            crm_db.commit()

            # 4. Products (20 items)
            products = []
            for i in range(1, 21):
                p = models_crm.Product(
                    name=f"Demo Product {i}",
                    sku=f"DEMO-{uuid.uuid4().hex[:6].upper()}",
                    price=float(random.randint(10, 500)),
                    brand_id=random.choice(brands).id,
                    supplier_id=supplier.id
                )
                crm_db.add(p)
                products.append(p)
            crm_db.commit()

            # 5. Clients (10 items)
            clients = []
            rp_id = user_id if user_id else 1 # Assign to requestor or admin
            for i in range(1, 11):
                c = models_crm.Client(
                    name=f"Demo Client {i}",
                    fantasy_name=f"Demo Client {i} LLC",
                    cnpj=f"00.000.000/000{i}-00",
                    status="active",
                    representative_id=rp_id
                )
                crm_db.add(c)
                clients.append(c)
            crm_db.commit()
            
            # 6. Orders (5 samples)
            # Create a few orders for the first few clients
            for i in range(5):
                client = clients[i]
                prod = random.choice(products)
                qty = random.randint(1, 5)
                total = prod.price * qty
                
                o = models_crm.Order(
                    client_id=client.id,
                    representative_id=rp_id,
                    status="draft",
                    total_value=total,
                    notes="Demonstração gerada automaticamente"
                )
                crm_db.add(o)
                crm_db.commit()
                
                item = models_crm.OrderItem(
                    order_id=o.id,
                    product_id=prod.id,
                    quantity=qty,
                    unit_price=prod.price,
                    net_unit_price=prod.price,
                    total=total
                )
                crm_db.add(item)
                crm_db.commit()

            return {"message": "Demo Mode Activated", "start_time": start_time}
            
        except Exception as e:
            crm_db.rollback()
            # If population fails, should we unset demo mode? 
            # Yes, cleaner.
            tenant.demo_mode_start = None
            self.sys_db.commit()
            raise HTTPException(status_code=500, detail=f"Failed to populate demo data: {str(e)}")
        finally:
            crm_db.close()

    def stop_demo(self, tenant_id: int):
        """
        1. Check tenant.demo_mode_start
        2. DELETE FROM tables WHERE created_at >= start
        3. Set demo_mode_start = NULL
        """
        tenant = self.sys_db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        if not tenant.demo_mode_start:
             return {"message": "Tenant is not in Demo Mode"}
        
        start_time = tenant.demo_mode_start
        crm_db = self._get_crm_session(tenant_id)
        
        try:
            # CLEANUP ORDER: Items -> Orders -> Visits -> Routes -> Contacts -> Clients -> Products -> Brands/Suppliers
            # We use created_at >= start_time
            # Note: Postgres formatting for datetime
            
            # 1. Order Items (via Orders usually cascade, but let's be safe if manual delete required)
            # Actually, let's delete parents and rely on cascade or manual child deletion if needed.
            # Safe logic: Delete leaves first.
            
            # 1. Order Items (Delete items belonging to orders of Demo Clients)
            crm_db.execute(text("""
                DELETE FROM order_items 
                WHERE order_id IN (
                    SELECT id FROM orders 
                    WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Demo Client%')
                )
            """))
            
            # 2. Orders (Delete orders of Demo Clients)
            crm_db.execute(text("""
                DELETE FROM orders 
                WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Demo Client%')
            """))
            
            # 3. Clients (Delete by name pattern)
            crm_db.execute(text("DELETE FROM clients WHERE name LIKE 'Demo Client%'"))
            
            # 4. Products (Delete by name pattern - careful of FKs in OrderItems, already deleted)
            crm_db.execute(text("DELETE FROM products WHERE name LIKE 'Demo Product%'"))
            
            # 5. Brands & Suppliers (Delete by specific names)
            demo_brands = ["Apex Innovations", "Nebula Corp", "Quantum Gear", "Synapse Sol", "Echo Dynamics"]
            crm_db.execute(text("DELETE FROM brands WHERE name = ANY(:brands)"), {"brands": demo_brands})
            crm_db.execute(text("DELETE FROM suppliers WHERE name = 'Global Demo Supply'"))
            
            # 6. Visits/Routes and others
            # If tasks refer to these, they might block deletion? 
            # Task has related_id but usually not FK constraint at DB level for generic related_id.
            # But just in case:
            # crm_db.execute(text("DELETE FROM tasks WHERE ...")) 
            
            # 7. Pricing Rules
            # Skipped as before.
            
            crm_db.commit()
            
            # Turn off flag
            tenant.demo_mode_start = None
            self.sys_db.commit()
            
            return {"message": "Demo Mode Ended. Cleaned up demo data."}
            
        except Exception as e:
            crm_db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to cleanup demo data: {str(e)}")
        finally:
            crm_db.close()


from fastapi import APIRouter, Depends, HTTPException, status, Body, Request

# ... (DemoService class remains same)

# --- DEPENDENCIES ---

def check_sysadmin(request: Request):
    if getattr(request.state, "role_name", "") != "sysadmin":
        raise HTTPException(status_code=403, detail="Acesso restrito a SysAdmin")
    return True

# --- ENDPOINTS ---

@router.post("/{tenant_id}/start")
def start_demo_mode(
    tenant_id: int, 
    request: Request,
    db: Session = Depends(database.get_db),
    _ = Depends(check_sysadmin)
):
    service = DemoService(db)
    user_id = int(request.state.user_id) if request.state.user_id else None
    return service.start_demo(tenant_id, user_id)

@router.post("/{tenant_id}/stop")
def stop_demo_mode(
    tenant_id: int, 
    db: Session = Depends(database.get_db),
    _ = Depends(check_sysadmin)
):
    service = DemoService(db)
    return service.stop_demo(tenant_id)
