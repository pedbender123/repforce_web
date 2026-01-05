from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from sqlalchemy.orm import Session
from sqlalchemy import MetaData, Table, inspect, select, insert, update, delete, text
from app.shared import database
from app.engine.metadata import models as metadata_models
from app.engine.loader import TenantLoader
from typing import List, Dict, Any, Optional
import uuid

router = APIRouter()

# Helper to reflect table (only for SYSTEM entities)
def get_reflected_table(table_name: str, db: Session) -> Table:
    conn = db.connection()
    metadata = MetaData()
    try:
        table = Table(table_name, metadata, autoload_with=conn)
        return table
    except Exception:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found in database schema.")

# Helper to validate table access via MetaEntity
def validate_entity_metadata(entity_name: str, db: Session):
    entity_def = db.query(metadata_models.MetaEntity).filter(metadata_models.MetaEntity.name == entity_name).first()
    if not entity_def:
        raise HTTPException(status_code=404, detail=f"Entity definition for '{entity_name}' not found.")
    return entity_def

@router.get("/metadata/{entity_name}")
def get_metadata(
    entity_name: str,
    request: Request,
    db: Session = Depends(database.get_crm_db)
):
    if not getattr(request.state, 'user_id', None):
        raise HTTPException(status_code=401, detail="Unauthorized")

    entity_def = validate_entity_metadata(entity_name, db)
    
    # Check for plugin override (optional enhancement)
    plugin = TenantLoader.get_module(request.state.tenant_slug, "metadata_overrides")
    if plugin and hasattr(plugin, "override_metadata"):
        return plugin.override_metadata(entity_name, entity_def)

    fields = []
    for f in entity_def.fields:
        fields.append({
            "name": f.name,
            "label": f.label,
            "type": f.type.value,
            "is_required": f.is_required,
            "is_system": f.is_system,
            "options": f.options
        })
        
    views = []
    for v in entity_def.views:
        views.append({
            "id": str(v.id),
            "name": v.name,
            "type": v.type.value,
            "config": v.config,
            "is_default": v.is_default
        })
        
    return {
        "name": entity_def.name,
        "display_name": entity_def.display_name,
        "description": entity_def.description,
        "entity_type": entity_def.entity_type.value,
        "fields": fields,
        "views": views
    }

@router.get("/{entity_name}")
def list_records(
    entity_name: str,
    request: Request,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(database.get_crm_db)
):
    if not getattr(request.state, 'user_id', None):
        raise HTTPException(status_code=401, detail="Unauthorized")

    entity_def = validate_entity_metadata(entity_name, db)
    
    # Plugin Hook: before_list
    plugin = TenantLoader.get_module(request.state.tenant_slug, "hooks")
    if plugin and hasattr(plugin, "before_list"):
        plugin.before_list(entity_name, request)

    if entity_def.entity_type == metadata_models.MetaEntityType.SYSTEM:
        table = get_reflected_table(entity_name, db)
        stmt = select(table).limit(limit).offset(offset)
        result = db.execute(stmt)
        return [dict(row._mapping) for row in result]
    else:
        records = db.query(metadata_models.EntityRecord)\
            .filter(metadata_models.EntityRecord.entity_id == entity_def.id)\
            .limit(limit).offset(offset).all()
        
        return [{"id": str(r.id), **r.data} for r in records]

@router.post("/{entity_name}")
def create_record(
    entity_name: str,
    request: Request,
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(database.get_crm_db)
):
    if not getattr(request.state, 'user_id', None):
        raise HTTPException(status_code=401, detail="Unauthorized")

    entity_def = validate_entity_metadata(entity_name, db)
    
    # Plugin Hook: before_create (can modify data)
    plugin = TenantLoader.get_module(request.state.tenant_slug, "hooks")
    if plugin and hasattr(plugin, "before_create"):
        data = plugin.before_create(entity_name, data, request)

    if entity_def.entity_type == metadata_models.MetaEntityType.SYSTEM:
        table = get_reflected_table(entity_name, db)
        from sqlalchemy.dialects.postgresql import UUID as PG_UUID
        for column in table.primary_key.columns:
            if column.name not in data:
                if isinstance(column.type, (PG_UUID, uuid.UUID)):
                     data[column.name] = uuid.uuid4()
        try:
            stmt = insert(table).values(**data).returning(table)
            result = db.execute(stmt)
            db.commit()
            new_row = result.first()
            return dict(new_row._mapping)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))
    else:
        try:
            record = metadata_models.EntityRecord(
                entity_id=entity_def.id,
                data=data,
                created_by=request.state.user_id
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return {"id": str(record.id), **record.data}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/{entity_name}/{record_id}")
def get_record(
    entity_name: str,
    record_id: str,
    request: Request,
    db: Session = Depends(database.get_crm_db)
):
    if not getattr(request.state, 'user_id', None):
        raise HTTPException(status_code=401, detail="Unauthorized")

    entity_def = validate_entity_metadata(entity_name, db)
    
    if entity_def.entity_type == metadata_models.MetaEntityType.SYSTEM:
        table = get_reflected_table(entity_name, db)
        pk_col = list(table.primary_key.columns)[0]
        # Allow record_id to be UUID or string depending on column type
        stmt = select(table).where(pk_col == record_id)
        result = db.execute(stmt).first()
        if not result:
            raise HTTPException(status_code=404, detail="Record not found")
        return dict(result._mapping)
    else:
        record = db.query(metadata_models.EntityRecord)\
            .filter(metadata_models.EntityRecord.entity_id == entity_def.id, metadata_models.EntityRecord.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"id": str(record.id), **record.data}
