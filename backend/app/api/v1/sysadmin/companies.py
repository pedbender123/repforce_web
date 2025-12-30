from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text # Import text for raw SQL
from app.db import session, models_system, models_tenant
from fastapi.security import OAuth2PasswordBearer
from app.core import security
from pydantic import BaseModel, EmailStr

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")

def get_current_superuser(token: str = Depends(oauth2_scheme), db: Session = Depends(session.get_db)):
    payload = security.decode_access_token(token)
    if not payload:
         raise HTTPException(status_code=401, detail="Invalid token")
    
    is_su = payload.get("is_superuser", False)
    if not is_su:
         raise HTTPException(status_code=403, detail="Not a superuser")
    return payload

class CompanyCreate(BaseModel):
    name: str
    slug: str
    admin_name: str
    admin_email: EmailStr
    admin_password: str

@router.get("")
def list_companies(db: Session = Depends(session.get_db), user=Depends(get_current_superuser)):
    tenants = db.query(models_system.Tenant).all()
    return tenants

@router.post("")
def create_company(
    payload: CompanyCreate,
    db: Session = Depends(session.get_db), 
    user=Depends(get_current_superuser)
):
    # 1. Validation
    if db.query(models_system.Tenant).filter(models_system.Tenant.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")

    # 2. Atomic Transaction Block for Global Data
    try:
        # A. Create Tenant
        new_tenant = models_system.Tenant(
            name=payload.name, 
            slug=payload.slug, 
            status="active" 
        )
        db.add(new_tenant)
        db.flush() # Get ID
        
        # B. Check/Create Admin User
        # FIX: GlobalUser uses 'username' for login email, not 'email' column
        admin_user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == payload.admin_email).first()
        if not admin_user:
            hashed_pw = security.get_password_hash(payload.admin_password)
            admin_user = models_system.GlobalUser(
                username=payload.admin_email, # User email as login
                recovery_email=payload.admin_email, # Optional recovery field
                password_hash=hashed_pw, 
                full_name=payload.admin_name,
                is_active=True
            )
            db.add(admin_user)
            db.flush()
            
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

    # 3. Provision Database Schema
    schema_name = f"tenant_{new_tenant.slug.replace('-', '_')}"
    
    try:
        # DDL Connect
        with session.engine.connect() as conn:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS \"{schema_name}\""))
            conn.commit()
            
            conn.execute(text(f"SET search_path TO \"{schema_name}\", public"))
            conn.commit()
            
            # Use BaseCrm from session (populated by models_tenant import)
            # Create all tables in the new schema
            models_tenant.Base.metadata.create_all(bind=conn)
            conn.commit()
            
    except Exception as e:
        # Cleanup if schema fails (optional but recommended)
        # For simplicity, we just log and raise
        print(f"Provisioning Error: {e}")
        raise HTTPException(status_code=500, detail=f"Created record but failed to provision schema: {str(e)}")

    return new_tenant
