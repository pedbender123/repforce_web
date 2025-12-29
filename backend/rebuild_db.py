
import os
import sys
from sqlalchemy import create_engine, text
from app.db.session import get_database_url, Base
from app.db import models_system
from app.core import security

def rebuild_database():
    print("--- REBUILDING DATABASE (POSTGRESQL) ---")
    url = get_database_url()
    print(f"Connecting to: {url}")
    
    engine = create_engine(url)
    
    try:
        # 1. Reset Public Schema
        with engine.connect() as conn:
            print("Resetting 'public' schema...")
            conn.execute(text("DROP SCHEMA public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()
            print("Schema 'public' reset.")
            
        # 2. Create Global Tables
        print("Creating Global Tables...")
        models_system.Base.metadata.create_all(bind=engine)
        print("Global Tables Created.")
        
        # 3. Seed SysAdmin
        with engine.connect() as conn:
            # Check if user exists (redundant after drop, but safe)
            res = conn.execute(text("SELECT id FROM public.global_users WHERE username = 'sysadmin'"))
            if not res.fetchone():
                hashed = security.get_password_hash("12345678")
                conn.execute(text("""
                    INSERT INTO public.global_users (username, email, hashed_password, full_name, is_sysadmin, is_active, created_at)
                    VALUES (:u, :e, :h, :f, :s, :a, NOW())
                """), {
                    "u": "sysadmin", 
                    "e": "sysadmin@repforce.com", 
                    "h": hashed, 
                    "f": "System Administrator",
                    "s": True,
                    "a": True
                })
                conn.commit()
                print("SysAdmin seeded: sysadmin / 12345678")

        print("--- DATABASE REBUILD COMPLETE ---")

    except Exception as e:
        print(f"FATAL ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    rebuild_database()
