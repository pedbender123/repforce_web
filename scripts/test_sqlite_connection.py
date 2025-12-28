import sys
import os
from sqlalchemy import text

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.database import get_global_engine, get_tenant_engine, Base, BaseCrm
from app.db import models_global, models_crm

def test_sqlite():
    print("--- Testing Manager DB ---")
    engine_sys = get_global_engine()
    # Create Tables
    models_global.Base.metadata.create_all(bind=engine_sys)
    print("Manager DB tables created.")
    
    # Test Insert
    with engine_sys.connect() as conn:
        conn.execute(text("INSERT OR IGNORE INTO tenants (name, slug) VALUES ('Test Tenant', 'test_t1')"))
        conn.commit()
        result = conn.execute(text("SELECT * FROM tenants")).fetchall()
        print(f"Tenants found: {result}")

    print("\n--- Testing Tenant DB (Dynamic) ---")
    slug = "test_t1"
    engine_tenant = get_tenant_engine(slug)
    
    # Create CRM Tables in this specific file
    models_crm.BaseCrm.metadata.create_all(bind=engine_tenant)
    print(f"Tenant DB ({slug}.db) tables created.")
    
    # Test Insert
    with engine_tenant.connect() as conn:
        # Check if table exists (Client)
        conn.execute(text("INSERT INTO clients (name, fantasy_name, cnpj) VALUES ('Client A', 'Fant A', '123')"))
        conn.commit()
        result = conn.execute(text("SELECT * FROM clients")).fetchall()
        print(f"Clients in {slug}: {result}")

if __name__ == "__main__":
    # Ensure data dir exists
    os.makedirs("backend/app/data/tenants", exist_ok=True)
    try:
        test_sqlite()
        print("\nSUCCESS: SQLite architecture verified.")
    except Exception as e:
        print(f"\nFAILURE: {e}")
        import traceback
        traceback.print_exc()
