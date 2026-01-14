import sys
import os
from sqlalchemy import text

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.shared import database
from app.system import models

def check_user(username_to_check):
    db_gen = database.get_db()
    db = next(db_gen)
    
    print(f"--- Checking user: {username_to_check} ---")
    user = db.query(models.GlobalUser).filter(models.GlobalUser.username == username_to_check).first()
    
    if user:
        print(f"User found: ID={user.id}, Username={user.username}, Active={user.is_active}, Superuser={user.is_superuser}")
        # Check memberships
        print(f"Memberships: {len(user.memberships)}")
        for m in user.memberships:
            print(f" - Tenant: {m.tenant.name} ({m.tenant.slug}), Role: {m.role}")
    else:
        print("User NOT found.")
        # List all users to see what's there
        print("\nAll users in DB:")
        all_users = db.query(models.GlobalUser).all()
        for u in all_users:
            print(f"- {u.username} ({u.email})")

if __name__ == "__main__":
    email = "pedro.p.bender.randon@gmail.com"
    check_user(email)
