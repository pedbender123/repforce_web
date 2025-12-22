import sys
import os
from sqlalchemy import create_engine, text
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add path to import app config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from app.core.config import settings
except ImportError:
    # Fallback if app import fails (e.g. env vars missing)
    class Settings:
        DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@db:5432/repforce")
    settings = Settings()

def diagnose():
    db_url = settings.DATABASE_URL
    print(f"Connecting to: {db_url}")
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        print("\n--- SCHEMAS ---")
        schemas = conn.execute(text("SELECT schema_name FROM information_schema.schemata")).fetchall()
        print([r[0] for r in schemas])
        
        target_schema = "tenant_1"
        print(f"\n--- TABLES IN {target_schema} (via pg_tables) ---")
        tables_pg = conn.execute(text(f"SELECT tablename FROM pg_tables WHERE schemaname = '{target_schema}'")).fetchall()
        print([r[0] for r in tables_pg])

        print(f"\n--- TABLES IN {target_schema} (via information_schema) ---")
        tables_info = conn.execute(text(f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{target_schema}'")).fetchall()
        print([r[0] for r in tables_info])
        
        print(f"\n--- ATTEMPTING DIRECT SELECT FROM {target_schema}.tasks ---")
        try:
            count = conn.execute(text(f"SELECT count(*) FROM {target_schema}.tasks")).scalar()
            print(f"SUCCESS: Count = {count}")
        except Exception as e:
            print(f"FAILED: {e}")

        print(f"\n--- CHECKING SEARCH PATH BEHAVIOR ---")
        conn.execute(text(f"SET search_path TO {target_schema}"))
        conn.commit() # Important for psycopg2 mostly, or if autocommit is off
        
        sp = conn.execute(text("SHOW search_path")).scalar()
        print(f"Current search_path: {sp}")
        
        try:
            count_sp = conn.execute(text("SELECT count(*) FROM tasks")).scalar()
            print(f"SUCCESS (via search_path): Count = {count_sp}")
        except Exception as e:
            print(f"FAILED (via search_path): {e}")

if __name__ == "__main__":
    diagnose()
