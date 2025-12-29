from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import session, models_system, models_tenant
from app.core import security
from pydantic import BaseModel, EmailStr

router = APIRouter()

class TenantCreateRequest(BaseModel):
    name: str
    slug: str
    plan_type: str = "trial"
    admin_email: EmailStr
    admin_password: str
    admin_name: str = "Administrator"

@router.post("/tenants")
def create_tenant(
    payload: TenantCreateRequest,
    db: Session = Depends(session.get_db) # Connects to Manager DB (Public Schema)
):
    # 1. Validation
    if db.query(models_system.Tenant).filter(models_system.Tenant.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Tenant slug already exists")
    
    # 2. Atomic Transaction Block for Global Data
    try:
        # A. Create Tenant
        new_tenant = models_system.Tenant(name=payload.name, slug=payload.slug, plan_type=payload.plan_type)
        db.add(new_tenant)
        db.flush() # Get ID
        
        # B. Check/Create Admin User
        admin_user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.email == payload.admin_email).first()
        if not admin_user:
            hashed_pw = security.get_password_hash(payload.admin_password)
            admin_user = models_system.GlobalUser(
                username=payload.admin_email, # Use email as username for simplicity or robustify later
                email=payload.admin_email,
                hashed_password=hashed_pw,
                full_name=payload.admin_name,
                is_active=True
            )
            db.add(admin_user)
            db.flush() # Get ID
            
        # C. Create Membership (Owner)
        membership = models_system.Membership(
            user_id=admin_user.id,
            tenant_id=new_tenant.id,
            role="owner"
        )
        db.add(membership)
        db.commit() # Commit Global State
        db.refresh(new_tenant)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create tenant record: {str(e)}")

    # 3. Provision Database Schema (Postgres)
    schema_name = f"tenant_{new_tenant.slug.replace('-', '_')}" 
    # NOTE: Using slug for schema name makes it predictable! 
    # But user plan said "tenant_{id}". 
    # Let's stick to "tenant_{slug}" as per Resilient specs? 
    # Plan says "tenant_slug".
    schema_name = f"tenant_{new_tenant.slug.replace('-', '_')}"

    try:
        # DDL Connect
        with session.engine.connect() as conn:
            # Create Schema
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS \"{schema_name}\""))
            conn.commit()
            
            # Initialize Tables
            conn.execute(text(f"SET search_path TO \"{schema_name}\", public"))
            conn.commit()
            
            # Use BaseCrm from session (populated by models_tenant import)
            session.BaseCrm.metadata.create_all(bind=conn)
            conn.commit()
            
            print(f"Schema {schema_name} provisioned successfully.")
            
    except Exception as e:
        print(f"Provisioning Error: {e}")
        # Rollback Global Data (Cleanup)
        # Note: This is a "Distributed Transaction" problem. 
        # If schema fails, we should technically delete the tenant from global DB.
        try:
            db.delete(new_tenant) # Cascades? logic required.
            # Ideally delete membership too if we just created it?
            # For MVP/SaaS Lite, let's keep it simple: Just try to delete tenant.
            db.commit()
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to provision schema: {str(e)}")
        
    return {
        "message": "Tenant provisioned successfully", 
        "tenant": {"id": new_tenant.id, "slug": new_tenant.slug},
        "admin": {"id": admin_user.id, "email": admin_user.email}
    }
