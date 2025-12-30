import sys
import os

# Add parent dir to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import session, models_tenant, models_system
from sqlalchemy import text

def fix_tenants():
    print("--- Tenant Schema Fixer V2 ---")
    
    # 1. Get all active tenants
    db_sys = session.SessionSys()
    try:
        tenants = db_sys.query(models_system.Tenant).all()
        print(f"Found {len(tenants)} tenants.")
        
        if not tenants:
            print("No tenants found in system. Creating 'Demo Tenant' for verification...")
            import uuid
            demo_t = models_system.Tenant(
                name="Demo Tenant",
                slug="demo-tenant",
                plan="enterprise",
                status="active"
            )
            # Add owner user if needed, but for now just tenant for schema
            db_sys.add(demo_t)
            db_sys.commit()
            db_sys.refresh(demo_t)
            tenants = [demo_t]
            print(f"Created Tenant: {demo_t.id} / demo-tenant")
            
        for t in tenants:
            schema = f"tenant_{t.slug.replace('-', '_')}" if t.slug else f"tenant_{t.id}"
            print(f"Checking {t.name} ({schema})...")
            
            with session.engine.connect() as conn:
                # Ensure Schema Exists
                conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS \"{schema}\""))
                conn.commit()
                
                # Set Path
                conn.execute(text(f"SET search_path TO \"{schema}\""))
                
                # Create All Tables (Idempotent - checks existence)
                models_tenant.BaseCrm.metadata.create_all(bind=conn)
                conn.commit()
                print(f"[OK] {t.name} synced.")
                
    except Exception as e:
        print(f"FATAL: {e}")
    finally:
        db_sys.close()

if __name__ == "__main__":
    fix_tenants()
