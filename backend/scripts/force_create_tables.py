
import sys
import os
import argparse

# Add parent directory to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import engine_crm, SessionCrm
from app.db.models_crm import BaseCrm

def force_create_tables(tenant_ids):
    for tenant_id in tenant_ids:
        schema = f"tenant_{tenant_id}"
        print(f"--- Processing {schema} ---")
        
        with engine_crm.connect() as conn:
            # 1. Create Schema if not exists
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
            conn.execute(text(f"SET search_path TO {schema}"))
            conn.commit()
            print(f"Schema {schema} ensured and search_path set.")

        # 2. Bind engine to metadata and create all
        # We need to ensure the engine execution context sets the schema
        # But create_all doesn't easily accept search_path unless we use a connection.
        
        print("Creating tables...")
        try:
            # We use a trick: configure the session/connection to have the path, 
            # then pass that connection to create_all
            with engine_crm.connect() as conn:
                conn.execute(text(f"SET search_path TO {schema}"))
                conn.commit() # set path persistence? No, connection scope.
                
                # Re-exec failure? SET search_path must be in same transaction or connection session
                # But Base.metadata.create_all uses the engine/connection.
                
                # Best way: Pass the connection with the search path set
                BaseCrm.metadata.create_all(bind=conn)
                print(f"Successfully ran create_all for {schema}")
                
        except Exception as e:
            print(f"Error creating tables for {schema}: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Force create CRM tables for tenants")
    parser.add_argument("tenants", metavar="N", type=int, nargs="+", help="Tenant IDs to fix")
    args = parser.parse_args()
    
    force_create_tables(args.tenants)
