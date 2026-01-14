
import sys
import os
from sqlalchemy import text

# Add parent dir to path to import app modules
sys.path.append(os.getcwd())

from app.shared import database

def migrate():
    print("--- STARTING MIGRATION: ADD ui_state TO global_users ---")
    
    try:
        # Get raw connection to execute DDL
        with database.engine.connect() as conn:
            # Check if column exists first (idempotency)
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='global_users' AND column_name='ui_state'"
            ))
            
            if result.fetchone():
                print("Column 'ui_state' already exists. Skipping.")
            else:
                print("Adding column 'ui_state' (JSONB)...")
                conn.execute(text("ALTER TABLE public.global_users ADD COLUMN ui_state JSONB DEFAULT '{}'"))
                conn.commit()
                print("Migration successful for global_users.")

        # 2. Check meta_entities.layout_config
        with database.engine.connect() as conn:
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='meta_entities' AND column_name='layout_config'"
            ))
            
            if result.fetchone():
                print("Column 'meta_entities.layout_config' already exists. Skipping.")
            else:
                print("Adding column 'layout_config' (JSON) to 'meta_entities'...")
                conn.execute(text("ALTER TABLE public.meta_entities ADD COLUMN layout_config JSON DEFAULT '{}'"))
                conn.commit()
                print("Migration successful for meta_entities.")
                
    except Exception as e:
        print(f"Migration Failed: {e}")
    finally:
        print("--- MIGRATION FINISHED ---")

if __name__ == "__main__":
    migrate()
