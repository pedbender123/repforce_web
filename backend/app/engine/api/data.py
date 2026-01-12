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

def apply_snapshot_formulas(db: Session, tenant_id: str, entity_id: str, record_data: Dict[str, Any], user_context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates and persists formulas for non-virtual fields (Snapshots).
    Returns the updated data dictionary.
    """
    from app.engine.formulas import FormulaEngine
    
    # 1. Fetch Snapshot Fields (formula != None AND is_virtual = False)
    snapshot_fields = db.query(meta_models.MetaField).filter(
        meta_models.MetaField.entity_id == entity_id,
        meta_models.MetaField.is_virtual == False,
        meta_models.MetaField.formula != None
    ).all()
    
    if not snapshot_fields:
        return record_data
        
    engine = FormulaEngine(db, str(tenant_id))
    updated_data = record_data.copy()
    
    # Context must include ID if possible, but for CREATE it might not exist yet.
    # We pass updated_data as context so formulas can reference other fields.
    
    for field in snapshot_fields:
        try:
            val = engine.evaluate(field.formula, updated_data, user_context, current_entity_id=str(entity_id))
            updated_data[field.name] = val
        except Exception as e:
            updated_data[field.name] = None
            
    return updated_data

def get_user_context(request: Request, db: Session, tenant_id: str) -> Optional[Dict[str, Any]]:
    from app.system import models as models_system
    user_id = getattr(request.state, "user_id", None)
    if not user_id: return None
    
    user_context = {}
    try:
        user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.id == user_id).first()
        if user:
            user_context['id'] = str(user.id)
            user_context['name'] = user.full_name
            user_context['username'] = user.username
            user_context['email'] = user.username 

            membership = db.query(models_system.Membership).filter(
                models_system.Membership.user_id == user.id,
                models_system.Membership.tenant_id == tenant_id
            ).first()
            if membership:
                user_context['cargo'] = membership.cargo.name if membership.cargo else membership.role
    except Exception:
        pass
    return user_context

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

    # 3. Snapshot Formulas
    user_context = get_user_context(request, db, tenant_id)
    final_data = apply_snapshot_formulas(db, tenant_id, entity.id, payload, user_context)

    # 4. Save
    record = data_models.EntityRecord(
        tenant_id=tenant_id,
        entity_id=entity.id,
        data=final_data
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

    # 2. Build User Context (Hoisted for Filtering)
    user_context = {}
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        try:
            from app.system import models as models_system
            user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.id == user_id).first()
            if user:
                user_context['id'] = str(user.id)
                user_context['name'] = user.full_name
                user_context['email'] = user.username 
                user_context['username'] = user.username

                membership = db.query(models_system.Membership).filter(
                    models_system.Membership.user_id == user.id,
                    models_system.Membership.tenant_id == tenant_id
                ).first()
                if membership:
                    user_context['cargo'] = membership.cargo.name if membership.cargo else membership.role
        except Exception:
            pass

    # 3. Build Query
    query = db.query(data_models.EntityRecord).filter(
        data_models.EntityRecord.entity_id == entity.id,
        data_models.EntityRecord.tenant_id == tenant_id
    )
    
    # Apply Filters from Query Params
    reserved = ['limit', 'offset', 'sort_by', 'sort_dir', 'q']
    
    # Global Search (q)
    q = request.query_params.get('q')
    if q:
        search_term = f"%{q}%"
        query = query.filter(cast(data_models.EntityRecord.data, String).ilike(search_term))

    # Strict JSON Filters with Context Substitution
    for key, value in request.query_params.items():
        if key not in reserved and value:
             processed_value = value
             # Simple Context Substitution
             if isinstance(value, str) and "{me}" in value:
                 processed_value = value.replace("{me}", user_context.get('id', ''))
             
             query = query.filter(data_models.EntityRecord.data[key].astext == processed_value)
            
    # Apply Pagination (Basic)
    limit = int(request.query_params.get('limit', 100))
    offset = int(request.query_params.get('offset', 0))
    
    records = query.limit(limit).offset(offset).all()
    
    # Transform for frontend (flatten id/created_at into data?)
    # Or return wrapped objects. Let's return flat objects for easier UI binding.
    
    # --- VIRTUAL COLUMNS CALCULATION ---
    # 1. Identify Virtual Fields
    from app.engine.formulas import FormulaEngine
    
    virtual_fields = db.query(meta_models.MetaField).filter(
        meta_models.MetaField.entity_id == entity.id,
        meta_models.MetaField.is_virtual == True,
        meta_models.MetaField.formula != None
    ).all()

    formula_engine = FormulaEngine(db, str(tenant_id)) if virtual_fields else None

    results = []
    for r in records:
        flat = r.data.copy()
        flat['id'] = str(r.id)
        flat['created_at'] = r.created_at
        
        # 3. Calculate Virtuals
        if virtual_fields and formula_engine:
            # Context is the current row data + id
            row_context = flat.copy()
            for vf in virtual_fields:
                try:
                    val = formula_engine.evaluate(vf.formula, row_context, user_context, current_entity_id=str(entity.id))
                    flat[vf.name] = val
                except Exception:
                    flat[vf.name] = None # Error fallback

        results.append(flat)
        
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
    merged_data = {**old_data, **payload}
    
    # Snapshot Formulas
    user_context = get_user_context(request, db, tenant_id)
    final_data = apply_snapshot_formulas(db, tenant_id, entity.id, merged_data, user_context)
    
    record.data = final_data
    
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
