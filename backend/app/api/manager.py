from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import database, models_global
import shutil
import os
import uuid

router = APIRouter()

@router.post("/tenants")
def create_tenant(
    name: str, 
    slug: str, 
    plan_type: str = "trial",
    db: Session = Depends(database.get_db) # Connects to Manager DB
):
    # 1. Validation
    if db.query(models_global.Tenant).filter(models_global.Tenant.slug == slug).first():
        raise HTTPException(status_code=400, detail="Tenant slug already exists")
    
    # 2. Create Record
    new_tenant = models_global.Tenant(name=name, slug=slug, plan_type=plan_type)
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    
    # 3. Provision Database
    # Source: template.db
    # Dest: tenants/{slug}.db
    
    template_path = os.path.join(database.DATA_DIR, "template.db")
    target_path = database.get_tenant_db_path(slug)
    
    if not os.path.exists(template_path):
        # Auto-create template if missing (Self-healing)
        print("Template DB missing. Creating...")
        from sqlalchemy import create_engine
        from app.db import models_crm
        
        url = f"sqlite:///{template_path}"
        engine = create_engine(url)
        models_crm.BaseCrm.metadata.create_all(bind=engine)
        print("Template DB created.")
        
    try:
        shutil.copy2(template_path, target_path)
    except Exception as e:
        db.delete(new_tenant)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to provision database: {str(e)}")
        
    return {"message": "Tenant created successfully", "tenant": {"id": new_tenant.id, "slug": new_tenant.slug}}
