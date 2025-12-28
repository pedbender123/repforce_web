from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import database, models_global, models_crm

router = APIRouter()

@router.post("/tenants")
def create_tenant(
    name: str, 
    slug: str, 
    plan_type: str = "trial",
    db: Session = Depends(database.get_db) # Connects to Manager DB (Public Schema)
):
    # 1. Validation
    if db.query(models_global.Tenant).filter(models_global.Tenant.slug == slug).first():
        raise HTTPException(status_code=400, detail="Tenant slug already exists")
    
    # 2. Create Record (Public Schema)
    new_tenant = models_global.Tenant(name=name, slug=slug, plan_type=plan_type)
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    
    # 3. Provision Database Schema
    # Pattern: tenant_{id}
    schema_name = f"tenant_{new_tenant.id}"
    
    try:
        # We need a connection that can execute DDL (CREATE SCHEMA)
        # Using the engine from database module directly or the session connection
        # Important: CREATE SCHEMA usually needs to be outside a transaction block if using some drivers, 
        # but with psycopg2 + sqlalchemy it's usually fine if autocommit or explicit commit.
        
        # Using engine directly for DDL to ensure clean state
        with database.engine.connect() as conn:
            # A. Create Schema
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS \"{schema_name}\""))
            conn.commit()
            
            # B. Initialize Tables in Schema
            # We must set search_path so create_all knows where to put tables
            conn.execute(text(f"SET search_path TO \"{schema_name}\", public"))
            conn.commit()
            
            # Create Tables
            models_crm.BaseCrm.metadata.create_all(bind=conn)
            conn.commit()
            
            print(f"Schema {schema_name} provisioned successfully.")
            
    except Exception as e:
        print(f"Provisioning Error: {e}")
        # Rollback Tenant Creation
        db.delete(new_tenant)
        db.commit()
        # Clean up schema if half-baked? 
        # Ideally yes, but complex. For now, just fail.
        raise HTTPException(status_code=500, detail=f"Failed to provision schema: {str(e)}")
        
    return {"message": "Tenant created successfully", "tenant": {"id": new_tenant.id, "slug": new_tenant.slug}}
