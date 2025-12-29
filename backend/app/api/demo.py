import time
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..db import session, models, models_tenant, schemas
from ..core import permissions, security

router = APIRouter()

# --- DEMO SERVICE ---

class DemoService:
    def __init__(self, sys_db: Session):
        self.sys_db = sys_db

    def _get_crm_session(self, tenant_id: int):
        db = session.SessionCrm()
        schema_name = f"tenant_{tenant_id}"
        # Set Search Path to Tenant schema then Public (for global access if needed)
        db.execute(text(f"SET search_path TO \"{schema_name}\", public"))
        return db

    def start_demo(self, tenant_id: int, user_id: Optional[int] = None):
        """
        1. Set tenant.demo_mode_start = NOW()
        2. Populate sample data (Brands, Products, Clients, etc.)
        """
        # Ensure schema tables exist (prevent 500 if tables missing)
        # Note: This is an attempt to recover, though migrations should handle it.
        try:
            session.BaseCrm.metadata.create_all(bind=session.engine_crm)
        except Exception as e:
            print(f"Warning: Could not create tables for demo: {e}")

        tenant = self.sys_db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        start_time = datetime.now()
        tenant.demo_mode_start = start_time
        self.sys_db.commit()

        # POPULATE DATA
        crm_db = self._get_crm_session(tenant_id)
        try:
            # 0. Find a Target Representative (First user in tenant)
            # This ensures the demo data is visible to someone in the tenant
            target_rep = self.sys_db.query(models.User).filter(models.User.tenant_id == tenant_id).first()
            rp_id = target_rep.id if target_rep else (user_id if user_id else 1)

            from ..furniture_data import BRANDS, SUPPLIER, PRODUCTS, CLIENTS

            # 1. Brands
            db_brands = []
            for name in BRANDS:
                # Check if exists
                existing = crm_db.query(models_tenant.Brand).filter(models_tenant.Brand.name == name).first()
                if not existing:
                    b = models_tenant.Brand(name=name)
                    crm_db.add(b)
                    db_brands.append(b)
                else:
                    db_brands.append(existing)
            crm_db.commit()

            # Refresh brands to get IDs
            for b in db_brands:
                crm_db.refresh(b)
            
            # 2. Suppliers
            db_supplier = crm_db.query(models_tenant.Supplier).filter(models_tenant.Supplier.name == SUPPLIER["name"]).first()
            if not db_supplier:
                db_supplier = models_tenant.Supplier(name=SUPPLIER["name"], email=SUPPLIER["email"])
                crm_db.add(db_supplier)
                crm_db.commit()
                crm_db.refresh(db_supplier)

            # 3. Products
            db_products = []
            for prod_data in PRODUCTS:
                existing = crm_db.query(models_tenant.Product).filter(models_tenant.Product.sku == prod_data["sku"]).first()
                if not existing:
                    p = models_tenant.Product(
                        name=prod_data["name"],
                        sku=prod_data["sku"],
                        price=prod_data["price"],
                        brand_id=random.choice(db_brands).id,
                        supplier_id=db_supplier.id
                    )
                    crm_db.add(p)
                    db_products.append(p)
                else:
                    db_products.append(existing)
            crm_db.commit()
            
            # Refresh products
            for p in db_products:
                crm_db.refresh(p)

            # 4. Clients
            db_clients = []
            for client_data in CLIENTS:
                existing = crm_db.query(models_tenant.Client).filter(models_tenant.Client.cnpj == client_data["cnpj"]).first()
                if not existing:
                    c = models_tenant.Client(
                        name=client_data["name"],
                        fantasy_name=client_data["fantasy_name"],
                        cnpj=client_data["cnpj"],
                        status="active",
                        representative_id=rp_id,
                        address="Rua Exemplo, 100",
                        city=client_data["city"],
                        state=client_data["state"],
                        zip_code="00000-000",
                        email=client_data.get("email") # Handle optional email
                    )
                    crm_db.add(c)
                    db_clients.append(c)
                else:
                    db_clients.append(existing)
            crm_db.commit()
            
            # Refresh clients
            for c in db_clients:
                crm_db.refresh(c)
            
            # 5. Orders (Create if Products and Clients exist)
            if db_products and db_clients:
                # Create a few random orders using these realistic entities
                for i in range(5):
                    client = random.choice(db_clients)
                    
                    # Create Order
                    o = models_tenant.Order(
                        client_id=client.id,
                        representative_id=rp_id,
                        status="draft",
                        total_value=0, # Will calc below
                        notes="Demonstração gerada automaticamente"
                    )
                    crm_db.add(o)
                    crm_db.commit()
                    crm_db.refresh(o)
                    
                    # Add items
                    total = 0
                    num_items = random.randint(1, 3)
                    for _ in range(num_items):
                        prod = random.choice(db_products)
                        qty = random.randint(1, 3)
                        item_total = prod.price * qty
                        
                        item = models_tenant.OrderItem(
                            order_id=o.id,
                            product_id=prod.id,
                            quantity=qty,
                            unit_price=prod.price,
                            net_unit_price=prod.price,
                            total=item_total
                        )
                        crm_db.add(item)
                        total += item_total
                    
                    o.total_value = total
                    crm_db.commit()

            # 6. Visit Routes (1 sample route)
            today_str = datetime.now().strftime("%Y-%m-%d")
            stops_data = []
            for client in db_clients[:5]:
                stops_data.append({
                    "client_id": client.id, 
                    "status": "pending",
                    "order": len(stops_data) + 1
                })
            
            route_name = f"Rota Demonstração - {today_str}"
            existing_route = crm_db.query(models_tenant.VisitRoute).filter(models_tenant.VisitRoute.name == route_name).first()
            if not existing_route:
                route = models_tenant.VisitRoute(
                    name=route_name,
                    date=today_str,
                    stops=stops_data,
                    user_id=rp_id
                )
                crm_db.add(route)
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
            
            # 3. Routes (Delete demo routes)
            crm_db.execute(text("DELETE FROM visit_routes WHERE name LIKE 'Rota Demonstração%'"))

            # 4. Contacts (Delete contacts of Demo Clients - if created)
            crm_db.execute(text("""
                DELETE FROM contacts
                WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Demo Client%')
            """))

            # 5. Clients (Delete by name pattern)
            crm_db.execute(text("DELETE FROM clients WHERE name LIKE 'Demo Client%'"))
            
            # 6. Products (Delete by name pattern - careful of FKs in OrderItems, already deleted)
            crm_db.execute(text("DELETE FROM products WHERE name LIKE 'Demo Product%'"))
            
            # 7. Brands & Suppliers (Delete by specific names)
            demo_brands = ["Apex Innovations", "Nebula Corp", "Quantum Gear", "Synapse Sol", "Echo Dynamics"]
            crm_db.execute(text("DELETE FROM brands WHERE name = ANY(:brands)"), {"brands": demo_brands})
            crm_db.execute(text("DELETE FROM suppliers WHERE name = 'Global Demo Supply'"))
            
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
    db: Session = Depends(session.get_db),
    _ = Depends(check_sysadmin)
):
    service = DemoService(db)
    user_id = int(request.state.user_id) if request.state.user_id else None
    return service.start_demo(tenant_id, user_id)

@router.post("/{tenant_id}/stop")
def stop_demo_mode(
    tenant_id: int, 
    db: Session = Depends(session.get_db),
    _ = Depends(check_sysadmin)
):
    service = DemoService(db)
    return service.stop_demo(tenant_id)
