from sqlalchemy.orm import Session
import sys
import os

# Add parent dir to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import database, models
from app.core import security

def bootstrap():
    db = database.SessionSys()
    try:
        print("Starting Bootstrap...")

        # 1. Create Systems Tenant
        sys_tenant = db.query(models.Tenant).filter(models.Tenant.name == "Systems").first()
        if not sys_tenant:
            sys_tenant = models.Tenant(
                name="Systems",
                cnpj="00000000000000",
                status="active",
                tenant_type="system"
            )
            db.add(sys_tenant)
            db.commit()
            db.refresh(sys_tenant)
            print(f"Created Systems Tenant: ID {sys_tenant.id}")
        else:
            print("Systems Tenant already exists")

        # 2. Create Super Admin Role
        sa_role = db.query(models.Role).filter(models.Role.name == "Super Admin", models.Role.tenant_id == sys_tenant.id).first()
        if not sa_role:
            sa_role = models.Role(
                name="Super Admin",
                description="Super Administrator",
                access_level="global",
                tenant_id=sys_tenant.id
            )
            db.add(sa_role)
            db.commit()
            db.refresh(sa_role)
            print("Created Super Admin Role")

        # 3. Create SysAdmin User
        sys_user = db.query(models.User).filter(models.User.username == "sysadmin").first()
        if not sys_user:
            sys_user = models.User(
                username="sysadmin",
                email="sysadmin@repforce.com",
                name="System Administrator",
                hashed_password=security.get_password_hash("sysadmin"),
                tenant_id=sys_tenant.id,
                role_id=sa_role.id,
                is_active=True
            )
            db.add(sys_user)
            db.commit()
            print("Created User: sysadmin (password: sysadmin)")
        
        # 4. Create Demo Tenant
        demo_tenant = db.query(models.Tenant).filter(models.Tenant.name == "Demo Corp").first()
        if not demo_tenant:
            demo_tenant = models.Tenant(
                name="Demo Corp",
                cnpj="12345678000199",
                status="active",
                tenant_type="industry"
            )
            db.add(demo_tenant)
            db.commit()
            db.refresh(demo_tenant)
            print(f"Created Demo Tenant: ID {demo_tenant.id}")
            
            # Need to provision schema?
            # The API does it via BackgroundTask. Here we might skip or call it if possible.
            # For reported "500" errors, manually creating tables via alembic is safer if possible, 
            # but usually the API flow is best.
            # We'll leave it "active" but unprovisioned schema-wise, relying on the user to click "Start Demo" 
            # OR we can let the user create a tenant via UI.
            
            # Creating Admin Role for Demo
            admin_role = models.Role(
                name="Admin",
                description="Demo Admin",
                tenant_id=demo_tenant.id
            )
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            
            # Create User
            demo_user = models.User(
                username="admin_demo",
                email="admin@demo.com",
                name="Demo Admin",
                hashed_password=security.get_password_hash("123456"),
                tenant_id=demo_tenant.id,
                role_id=admin_role.id
            )
            db.add(demo_user)
            db.commit()
            print("Created User: admin_demo (password: 123456) - Note: Schema might need provisioning via UI")

        print("Bootstrap Complete.")

    except Exception as e:
        print(f"Bootstrap Failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    bootstrap()
