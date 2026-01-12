from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text # Import text for raw SQL
from app.shared import database, security
from app.system import models as models_system
from app.engine import models_tenant
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")

from app.system.services.schema_manager import SchemaManager # Import SchemaManager

def get_current_superuser(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
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
    admin_email: str
    admin_password: str

@router.get("")
def list_companies(db: Session = Depends(database.get_db), user=Depends(get_current_superuser)):
    tenants = db.query(models_system.Tenant).all()
    return tenants

@router.post("")
def create_company(
    payload: CompanyCreate,
    db: Session = Depends(database.get_db), 
    user=Depends(get_current_superuser)
):
    # 1. Validation
    if db.query(models_system.Tenant).filter(models_system.Tenant.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")

    # 2. Part A: Global Setup (Tenant Record + Admin User + Membership)
    new_tenant = None
    try:
        # A. Create Tenant
        new_tenant = models_system.Tenant(
            name=payload.name, 
            slug=payload.slug, 
            status="setup_pending" 
        )
        db.add(new_tenant)
        db.flush() # Get ID
        
        # B. Check/Create Admin User
        admin_user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == payload.admin_email).first()
        if not admin_user:
            hashed_pw = security.get_password_hash(payload.admin_password)
            admin_user = models_system.GlobalUser(
                username=payload.admin_email,
                recovery_email=payload.admin_email,
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
        
        # IMPORTANT: COMMIT AND REFRESH to free the global session before DDL
        db.commit()
        db.refresh(new_tenant)
        print(f"Global record for tenant {new_tenant.slug} created successfully.")
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create tenant record: {str(e)}")

    # 3. Part B: Database Schema Provisioning
    # We use a NEW connection for DDL to avoid pool/session conflicts
    schema_name = f"tenant_{new_tenant.slug.replace('-', '_')}"
    tenant_id = new_tenant.id
    
    try:
        print(f"Provisioning schema '{schema_name}'...")
        with database.engine.connect() as conn:
            # Atomic DDL block
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS \"{schema_name}\""))
            conn.commit()
            
            # --- SEEDING FROM TEMPLATE ---
            # Instead of static models, we load the dynamic template
            import json
            import os
            from app.engine.metadata import models as models_meta
            from app.system.services.schema_manager import SchemaManager

            template_path = os.path.join(os.path.dirname(__file__), "../../../engine/templates/crm_v1.json")
            if os.path.exists(template_path):
                print(f"Seeding CRM Template from {template_path}...")
                with open(template_path, 'r') as f:
                    template_data = json.load(f)
                
                # We need to use the 'db' session for Metadata (MetaEntity/MetaField)
                # and SchemaManager for physical tables.
                
                for entity_def in template_data.get("entities", []):
                    # 1. Create MetaEntity
                    new_entity = models_meta.MetaEntity(
                        tenant_id=tenant_id,
                        slug=entity_def["slug"],
                        display_name=entity_def["display_name"],
                        icon=entity_def.get("icon", "Database"),
                        is_system=False # User can delete if they want
                    )
                    db.add(new_entity)
                    db.commit()     # Commit to get ID
                    db.refresh(new_entity)
                    
                    # 2. Physical Table
                    SchemaManager.create_table(schema_name, new_entity.slug)
                    
                    # 3. Create Fields
                    for field_def in entity_def.get("fields", []):
                        new_field = models_meta.MetaField(
                            entity_id=new_entity.id,
                            name=field_def["name"],
                            label=field_def["label"],
                            field_type=field_def["type"],
                            is_required=field_def.get("is_required", False),
                            options=field_def.get("options", [])
                        )
                        db.add(new_field)
                        # Physical Column
                        SchemaManager.add_column(
                            schema_name, 
                            new_entity.slug, 
                            field_def["name"], 
                            field_def["type"], 
                            field_def.get("is_required", False)
                        )
                    
                    db.commit() # Commit fields
                    
                print("CRM Template Seeded Successfully.")
            else:
                print("Template file not found. Skipping seed.")

            # Create any remaining static tables if needed (e.g. specialized system tables not in metadata)
            # models_tenant.BaseCrm.metadata.create_all(bind=conn) # DISABLED in favor of dynamic
            
            # Finalize status
            with database.engine.connect() as conn_sys:
                conn_sys.execute(
                    text("UPDATE public.tenants SET status = 'active' WHERE id = :tid"),
                    {"tid": tenant_id}
                )
                conn_sys.commit()
            
    except Exception as e:
        print(f"Provisioning Error for {schema_name}: {e}")
        # Manual Rollback for global record
        try:
            db.delete(new_tenant)
            db.commit()
            print(f"Cleaned up tenant record {payload.slug} after provisioning failure.")
        except Exception as cleanup_err:
            print(f"Critical: Failed to cleanup global record: {cleanup_err}")
            
        raise HTTPException(status_code=500, detail=f"Created record but failed to provision schema: {str(e)}")

    # Final refresh of the object if we still have it in local db cache
    db.refresh(new_tenant)
    return new_tenant

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

@router.patch("/{company_id}")
def update_company(
    company_id: str,
    payload: CompanyUpdate,
    db: Session = Depends(database.get_db),
    user=Depends(get_current_superuser)
):
    tenant = db.query(models_system.Tenant).filter(models_system.Tenant.id == company_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if payload.name:
        tenant.name = payload.name
    if payload.status:
        tenant.status = payload.status
        
    db.commit()
    db.refresh(tenant)
    return tenant

@router.delete("/{company_id}")
def delete_company(
    company_id: str,
    db: Session = Depends(database.get_db),
    user=Depends(get_current_superuser)
):
    # 1. Fetch Tenant
    tenant = db.query(models_system.Tenant).filter(models_system.Tenant.id == company_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Company not found")

    # 2. Determine Schema Name
    safe_slug = tenant.slug.replace("-", "_")
    schema_name = f"tenant_{safe_slug}"

    try:
        # 3. Drop Schema (Destructive!)
        print(f"Dropping schema {schema_name} for tenant {tenant.slug}...")
        SchemaManager.drop_schema(schema_name)

        # 4. Delete Tenant Record
        # This should cascade delete MetaEntity, MetaPage, etc if FKs are correct.
        # Ideally, we should check if metadata is deleted.
        db.delete(tenant)
        db.commit()
        return {"message": f"Tenant {tenant.slug} completely removed."}

    except Exception as e:
        db.rollback()
        print(f"Error deleting tenant: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete tenant: {str(e)}")
