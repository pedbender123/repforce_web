import sys
import os
from sqlalchemy import create_engine, inspect, text

# Add backend to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.database import engine_crm, engine_sys, BaseCrm

# Import Models to ensure they are registered in BaseCrm.metadata
from app.db import models_crm, models_integration 

def fix_tenant_schemas():
    print("Starting Tenant Schema Verification...")

    # 1. Get Active Tenants
    with engine_sys.connect() as sys_conn:
        try:
            result = sys_conn.execute(text("SELECT id, name FROM tenants"))
            tenants = result.fetchall()
            print(f"Found {len(tenants)} tenants.")
        except Exception as e:
            print(f"Error fetching tenants: {e}")
            return

    # 2. Iterate and Create Tables
    # We use engine_crm.connect() but we need to bind the metadata create_all to this connection 
    # and ensuring search_path is set.
    
    # BaseCrm.metadata.create_all(bind=engine_crm) would create in default schema.
    # We need to do it per schema.
    
    for tenant_id, tenant_name in tenants:
        schema = f"tenant_{tenant_id}"
        print(f"Checking tenant {tenant_id} ({tenant_name}) schema '{schema}'...")

        try:
            with engine_crm.connect() as crm_conn:
                # 1. Ensure Schema Exists
                crm_conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
                crm_conn.commit()

                # 2. Set Search Path for this connection
                crm_conn.execute(text(f"SET search_path TO {schema}"))
                
                # 3. Create All Tables in this Schema
                # We can use metadata.create_all(bind=crm_conn) because crm_conn has search_path set.
                BaseCrm.metadata.create_all(bind=crm_conn)
                crm_conn.commit()
                print(f"  [SUCCESS] Schema verified/updated for '{schema}'.")
                
        except Exception as e:
            print(f"  [ERROR] Failed to process tenant {tenant_id}: {e}")

    print("Tenant Schema Verification Completed.")

if __name__ == "__main__":
    fix_tenant_schemas()
