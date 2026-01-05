from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.shared import database
from app.engine.metadata import models as metadata_models
from pydantic import BaseModel, UUID4

router = APIRouter()

# --- SCHEMAS ---
class MetaFieldSchema(BaseModel):
    name: str
    label: str
    type: metadata_models.FieldType
    is_required: bool = False
    options: Dict[str, Any] = {}

class MetaEntityCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    entity_type: metadata_models.MetaEntityType = metadata_models.MetaEntityType.CUSTOM
    fields: List[MetaFieldSchema] = []

# --- ENDPOINTS ---

@router.get("/entities")
def list_entities(db: Session = Depends(database.get_crm_db)):
    return db.query(metadata_models.MetaEntity).all()

@router.post("/entities")
def create_entity(payload: MetaEntityCreate, db: Session = Depends(database.get_crm_db)):
    # Check if exists
    if db.query(metadata_models.MetaEntity).filter(metadata_models.MetaEntity.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Entity already exists")
    
    entity = metadata_models.MetaEntity(
        name=payload.name,
        display_name=payload.display_name,
        description=payload.description,
        entity_type=payload.entity_type
    )
    db.add(entity)
    db.flush()
    
    for f in payload.fields:
        field = metadata_models.MetaField(
            entity_id=entity.id,
            name=f.name,
            label=f.label,
            type=f.type,
            is_required=f.is_required,
            options=f.options
        )
        db.add(field)
    
    # Create a default list view
    default_view = metadata_models.MetaView(
        entity_id=entity.id,
        name=f"Lista de {payload.display_name}",
        type=metadata_models.ViewType.LIST,
        is_default=True,
        config={"columns": [f.name for f in payload.fields]}
    )
    db.add(default_view)
    
    db.commit()
    db.refresh(entity)
    return entity

@router.get("/views/{entity_name}")
def get_entity_views(entity_name: str, db: Session = Depends(database.get_crm_db)):
    entity = db.query(metadata_models.MetaEntity).filter(metadata_models.MetaEntity.name == entity_name).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity.views

@router.get("/schemas/{entity_name}")
def get_entity_schema(entity_name: str, db: Session = Depends(database.get_crm_db)):
    entity = db.query(metadata_models.MetaEntity).filter(metadata_models.MetaEntity.name == entity_name).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity metadata not found")
    
    return {
        "entity": {
            "name": entity.name,
            "display_name": entity.display_name,
            "type": entity.entity_type
        },
        "fields": [
            {
                "name": f.name,
                "label": f.label,
                "type": f.type,
                "is_required": f.is_required,
                "options": f.options
            } for f in entity.fields
        ],
        "views": [
            {
                "id": str(v.id),
                "name": v.name,
                "type": v.type,
                "config": v.config,
                "is_default": v.is_default
            } for v in entity.views
        ]
    }
