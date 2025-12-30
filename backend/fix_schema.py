import os
from sqlalchemy import create_engine, text
from app.db.session import BaseCrm
from app.db import models_tenant

DATABASE_URL = os.getenv("DATABASE_URL")

# Connect
engine = create_engine(DATABASE_URL)

def fix_schema():
    with engine.connect() as conn:
        # Get all tenant schemas
        result = conn.execute(text("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'"))
        schemas = [row[0] for row in result]
        
        print(f"Found {len(schemas)} tenant schemas: {schemas}")
        
        for schema in schemas:
            print(f"Fixing schema: {schema}")
            try:
                # 1. Drop old table
                conn.execute(text(f"DROP TABLE IF EXISTS \"{schema}\".custom_fields_config CASCADE"))
                print(f"Dropped custom_fields_config in {schema}")
                
                # 2. Recreate table using new model
                # We interpret the table creation SQL from the model
                # Ideally we use create_all with schema bound
                # But BaseCrm is not bound to a specific schema in metadata default
                
                # Hack: Set search_path and use create_all
                conn.execute(text(f"SET search_path TO \"{schema}\", public"))
                models_tenant.CustomFieldConfig.__table__.create(conn)
                print(f"Recreated custom_fields_config in {schema}")
                
            except Exception as e:
                print(f"Error processing {schema}: {e}")
            
            conn.commit()

if __name__ == "__main__":
    fix_schema()
