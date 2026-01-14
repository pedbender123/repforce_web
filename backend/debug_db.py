
import sys
import os

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from app.shared import database
from app.system import models
from sqlalchemy import text

def debug_db():
    print("--- DEBUGGING DATABASE STATE ---")
    
    try:
        db = database.SessionSys()
        print("Database Connection: SUCCESS")
    except Exception as e:
        print(f"Database Connection: FAILED ({e})")
        return

    try:
        # Check Users
        users = db.query(models.GlobalUser).all()
        print(f"\n[Global Users Found: {len(users)}]")
        for u in users:
            print(f" - ID: {u.id} | User: {u.username} | Email: {u.recovery_email} | Active: {u.is_active} | Superuser: {u.is_superuser}")

        # Check Tenants
        tenants = db.query(models.Tenant).all()
        print(f"\n[Tenants Found: {len(tenants)}]")
        for t in tenants:
            print(f" - ID: {t.id} | Name: {t.name} | Slug: {t.slug} | Status: {t.status}")

    except Exception as e:
        print(f"Error querying data: {e}")
    finally:
        db.close()
        print("\n--- END DEBUG ---")

if __name__ == "__main__":
    debug_db()
