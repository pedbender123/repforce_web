from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.shared import database
from app.engine.metadata import models as models_meta, schemas as schemas_meta

router = APIRouter()

@router.get("/schema", response_model=List[schemas_meta.MetaEntityResponse])
def get_full_schema(request: Request, db: Session = Depends(database.get_db)):
    """
    Returns the complete schema (Entities + Fields + Views) for the current tenant.
    Used by the Frontend Engine Main Loader to build the dynamic UI.
    """
    tenant_id = request.state.tenant_id
    if not tenant_id:
         raise HTTPException(status_code=400, detail="Tenant context required")

    # Fetch all entities for this tenant
    # Relationships (fields, views) should be loaded automatically (lazy='select' default)
    # Consider optimizing with joinedload if performance issues arise
    entities = db.query(models_meta.MetaEntity).filter(models_meta.MetaEntity.tenant_id == tenant_id).all()
    
    return entities
