import sys
import os
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from app.shared.database import engine, Base, SessionSys
from app.engine.core.schema_manager import SchemaManager
from app.system.models import models as models_system

def test_db_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("Database connection successful:", result.scalar())
    except Exception as e:
        print("Database connection failed:", e)
        return False
    return True

def list_tenants():
    db = SessionSys()
    try:
        tenants = db.query(models_system.Tenant).all()
        print(f"Found {len(tenants)} tenants.")
        for t in tenants:
            print(f" - {t.name} (Slug: {t.slug}, Schema: tenant_{t.slug.replace('-', '_')})")
        return tenants
    except Exception as e:
        print("Failed to list tenants:", e)
        return []
    finally:
        db.close()

def try_create_table(tenant_slug):
    schema_name = f"tenant_{tenant_slug.replace('-', '_')}"
    table_slug = "debug_table_123"
    print(f"Attempting to create table in schema '{schema_name}'...")
    
    try:
        SchemaManager.create_table(schema_name, table_slug)
        print("Table creation successful!")
    except Exception as e:
        print(f"Table creation failed: {e}")

if __name__ == "__main__":
    if test_db_connection():
        tenants = list_tenants()
        if tenants:
            # Use the first tenant found
            try_create_table(tenants[0].slug)
        else:
            print("No tenants found to test.")
