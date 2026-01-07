from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.orm import Session
from app.shared import database
from app.engine.metadata import models as meta_models
from app.engine.metadata import data_models
from typing import List, Dict, Any, Optional
from uuid import UUID
import json
from sqlalchemy import cast, String, or_
from fastapi import BackgroundTasks
from app.engine.services.workflow_service import WorkflowService

router = APIRouter()

@router.post("/object/{entity_slug}")
def create_record(
    entity_slug: str,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...),
    request: Request = None,
    db: Session = Depends(database.get_db)
):
    """
    Universal Create Endpoint.
    1. Looks up MetaEntity by slug.
    2. Validates payload keys against MetaFields (Basic validation).
    3. Inserts into EntityRecord (JSONB).
    """
    tenant_id = request.state.tenant_id
    
    # 1. Lookup Entity
    entity = db.query(meta_models.MetaEntity).filter(
        meta_models.MetaEntity.slug == entity_slug,
        meta_models.MetaEntity.tenant_id == tenant_id
    ).first()
    
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity '{entity_slug}' not found.")

    # 2. Basic Validation (TODO: Move to a Validator Service)
    # Check if required fields are present
    # for field in entity.fields:
    #     if field.is_required and field.name not in payload:
    #         raise HTTPException(status_code=400, detail=f"Missing required field: {field.name}")

    # 3. Save
    record = data_models.EntityRecord(
        tenant_id=tenant_id,
        entity_id=entity.id,
        data=payload
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    # Trigger Workflows (Async)
    background_tasks.add_task(
        WorkflowService.trigger_workflows,
        db=db,
        entity_slug=entity_slug,
        trigger_type="ON_CREATE",
        payload_data=record.data,
        tenant_id=tenant_id,
        user_id=request.state.user_id if hasattr(request.state, 'user_id') else None
    )
    
    return {
        "id": str(record.id),
        "data": record.data,
        "created_at": record.created_at
    }

@router.get("/object/{entity_slug}")
def list_records(
    entity_slug: str,
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Universal List Endpoint.
    Returns all records for this entity slug.
    TODO: Add filtering/pagination.
    """
    tenant_id = request.state.tenant_id
    
    # 1. Lookup Entity
    entity = db.query(meta_models.MetaEntity).filter(
        meta_models.MetaEntity.slug == entity_slug,
        meta_models.MetaEntity.tenant_id == tenant_id
    ).first()
    
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity '{entity_slug}' not found.")

    # 2. Fetch Records
    # 2. Build Query
    query = db.query(data_models.EntityRecord).filter(
        data_models.EntityRecord.entity_id == entity.id,
        data_models.EntityRecord.tenant_id == tenant_id
    )
    
    # Apply Filters from Query Params
    reserved = ['limit', 'offset', 'sort_by', 'sort_dir', 'q']
    
    # Global Search (q) - MVP: Search in entire JSON payload as text
    q = request.query_params.get('q')
    if q:
        search_term = f"%{q}%"
        query = query.filter(cast(data_models.EntityRecord.data, String).ilike(search_term))

    # Strict JSON Filters
    for key, value in request.query_params.items():
        if key not in reserved and value:
             query = query.filter(data_models.EntityRecord.data[key].astext == value)
            
    # Apply Pagination (Basic)
    limit = int(request.query_params.get('limit', 100))
    offset = int(request.query_params.get('offset', 0))
    
    records = query.limit(limit).offset(offset).all()
    
    # Transform for frontend (flatten id/created_at into data?)
    # Or return wrapped objects. Let's return flat objects for easier UI binding.
    results = []
    for r in records:
        flat = r.data.copy()
        flat['id'] = str(r.id)
        flat['created_at'] = r.created_at
        results.append(flat)
        
    return results
    return results

@router.put("/object/{entity_slug}/{record_id}")
def update_record(
    entity_slug: str,
    record_id: str,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...),
    request: Request = None,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    # 1. Lookup Entity
    entity = db.query(meta_models.MetaEntity).filter(
        meta_models.MetaEntity.slug == entity_slug,
        meta_models.MetaEntity.tenant_id == tenant_id
    ).first()
    
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity '{entity_slug}' not found.")

    # 2. Lookup Record
    record = db.query(data_models.EntityRecord).filter(
        data_models.EntityRecord.id == record_id,
        data_models.EntityRecord.tenant_id == tenant_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")

    # 3. Update Data (Merge or Replace? Usually merge)
    old_data = record.data.copy()
    new_data = {**old_data, **payload}
    record.data = new_data
    
    db.commit()
    db.refresh(record)

    # Trigger Workflows
    background_tasks.add_task(
        WorkflowService.trigger_workflows,
        db=db,
        entity_slug=entity_slug,
        trigger_type="ON_UPDATE",
        payload_data=record.data,
        tenant_id=tenant_id,
        user_id=request.state.user_id if hasattr(request.state, 'user_id') else None,
        changes={"old": old_data, "new": payload}
    )

    return {"id": str(record.id), "data": record.data, "status": "updated"}

@router.delete("/object/{entity_slug}/{record_id}")
def delete_record(
    entity_slug: str,
    record_id: str,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    # 1. Lookup Entity
    entity = db.query(meta_models.MetaEntity).filter(
        meta_models.MetaEntity.slug == entity_slug,
        meta_models.MetaEntity.tenant_id == tenant_id
    ).first()
    
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity '{entity_slug}' not found.")

    # 2. Lookup Record
    record = db.query(data_models.EntityRecord).filter(
        data_models.EntityRecord.id == record_id,
        data_models.EntityRecord.tenant_id == tenant_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")

    deleted_data = record.data.copy()
    deleted_id = str(record.id)

    db.delete(record)
    db.commit()

    # Trigger Workflows
    background_tasks.add_task(
        WorkflowService.trigger_workflows,
        db=db,
        entity_slug=entity_slug,
        trigger_type="ON_DELETE",
        payload_data=deleted_data,
        tenant_id=tenant_id,
        user_id=request.state.user_id if hasattr(request.state, 'user_id') else None
    )

    return {"status": "deleted", "id": deleted_id}
