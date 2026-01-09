from fastapi import APIRouter, HTTPException, Depends, Request, Body, BackgroundTasks
from sqlalchemy.orm import Session
from app.shared import database
from app.engine.metadata import models as models_meta, data_models
from app.engine.services.workflow_service import WorkflowService
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/actions/virtual/{hook_key}")
def execute_virtual_action(
    hook_key: str,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(default={}),
    db: Session = Depends(database.get_db)
):
    action = db.query(models_meta.MetaAction).filter(
        models_meta.MetaAction.trigger_source == 'VIRTUAL_HOOK',
        models_meta.MetaAction.trigger_context == hook_key
    ).first()
    
    if not action:
        raise HTTPException(status_code=404, detail="Hook Key invalida ou acao nao encontrada.")
    
    logger.info(f"[Action] Virtual Trigger: {action.name}")
    return _execute_logic(action, payload, db, background_tasks)

@router.post("/actions/{action_id}/execute")
def execute_ui_action(
    action_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(default={}),
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    action = db.query(models_meta.MetaAction).filter(
        models_meta.MetaAction.id == action_id,
        models_meta.MetaAction.tenant_id == tenant_id
    ).first()
    
    if not action:
        raise HTTPException(status_code=404, detail="Acao nao encontrada.")
        
    logger.info(f"[Action] UI Trigger: {action.name}")
    return _execute_logic(action, payload, db, background_tasks)

@router.post("/actions/proxy")
async def proxy_webhook(
    payload: Dict[str, Any] = Body(...),
):
    """
    Proxies a webhook call to avoid CORS issues on frontend.
    Payload: { "url": "...", "data": ... }
    """
    import httpx
    url = payload.get("url")
    data = payload.get("data")
    if not url:
        raise HTTPException(status_code=400, detail="URL obrigatoria")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=data, timeout=10.0)
            return {"status": resp.status_code, "response": resp.text}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

def _execute_logic(action, payload, db, background_tasks):
    tenant_id = action.tenant_id
    config = action.config or {}
    
    try:
        # 2. Execute Logic based on Type
        if action.action_type == 'CREATE_ITEM':
            entity_slug = config.get('entity_slug')
            if not entity_slug: raise ValueError("Config 'entity_slug' missing")
            
            # Lookup Entity
            entity = db.query(models_meta.MetaEntity).filter(
                models_meta.MetaEntity.slug == entity_slug,
                models_meta.MetaEntity.tenant_id == tenant_id
            ).first()
            if not entity: raise ValueError(f"Entity {entity_slug} not found")
            
            # Data from payload (merge with config defaults if any?)
            data_to_save = {**config.get('defaults', {}), **payload}
            
            record = data_models.EntityRecord(
                tenant_id=tenant_id,
                entity_id=entity.id,
                data=data_to_save
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            
            # Trigger Workflows
            background_tasks.add_task(
                WorkflowService.trigger_workflows,
                db=db,
                entity_slug=entity_slug,
                trigger_type="ON_CREATE",
                payload_data=record.data,
                tenant_id=tenant_id,
                user_id=None # System Action
            )
            return {"status": "success", "action": "CREATE_ITEM", "record_id": str(record.id)}

        elif action.action_type == 'EDIT_ITEM':
            entity_slug = config.get('entity_slug')
            record_id = payload.get('id') or config.get('record_id')
            if not entity_slug or not record_id: raise ValueError("Target Entity or Record ID missing")
            
            # Lookup Record (Raw SQL check might be faster but ORM is safer for tenant)
            # Need Entity ID first
            entity = db.query(models_meta.MetaEntity).filter(
                models_meta.MetaEntity.slug == entity_slug,
                models_meta.MetaEntity.tenant_id == tenant_id
            ).first()
            if not entity: raise ValueError(f"Entity {entity_slug} not found")

            record = db.query(data_models.EntityRecord).filter(
                data_models.EntityRecord.id == record_id,
                data_models.EntityRecord.tenant_id == tenant_id
            ).first()
            if not record: raise HTTPException(status_code=404, detail="Record not found")
            
            # Update
            old_data = record.data.copy()
            new_data = {**old_data, **payload} # Merge
            record.data = new_data
            db.commit()
            
            # Trigger Workflows
            background_tasks.add_task(
                WorkflowService.trigger_workflows,
                db=db,
                entity_slug=entity_slug,
                trigger_type="ON_UPDATE",
                payload_data=record.data,
                tenant_id=tenant_id,
                user_id=None,
                changes={"old": old_data, "new": payload}
            )
            return {"status": "success", "action": "EDIT_ITEM", "record_id": str(record.id)}

        elif action.action_type == 'DELETE_ITEM':
            entity_slug = config.get('entity_slug')
            record_id = payload.get('id') or config.get('record_id')
            if not entity_slug or not record_id: raise ValueError("Target Entity or Record ID missing")
            
            record = db.query(data_models.EntityRecord).filter(
                data_models.EntityRecord.id == record_id,
                data_models.EntityRecord.tenant_id == tenant_id
            ).first()
            if not record: raise HTTPException(status_code=404, detail="Record not found")
            
            deleted_data = record.data.copy()
            db.delete(record)
            db.commit()
            
            background_tasks.add_task(
                WorkflowService.trigger_workflows,
                db=db,
                entity_slug=entity_slug,
                trigger_type="ON_DELETE",
                payload_data=deleted_data,
                tenant_id=tenant_id,
                user_id=None
            )
            return {"status": "success", "action": "DELETE_ITEM"}

        elif action.action_type == 'EMAIL':
            # Placeholder for Email Service
            to_email = config.get('to_email')
            return {"status": "success", "action": "EMAIL", "message": f"Email queued for {to_email} (Simulated)"}

        elif action.action_type == 'PYTHON_SCRIPT':
            # Internal internal automation logic (Replaces n8n simple hooks)
            script_name = config.get('script_name')
            if not script_name:
                 return {"status": "error", "message": "No script_name configured"}
            
            # Use Shared Service
            from app.engine.services.internal_scripts import execute_script_by_name
            
            # Execute
            result = execute_script_by_name(script_name, payload)
            return {"status": "success", "action": "PYTHON_SCRIPT", "result": result}

        elif action.action_type == 'AI_CLASSIFY':
            # No-Code AI Integration
            from app.services.ai_service import AIService
            
            # 1. Extract Input
            input_source = config.get("input_source", "payload") # 'payload' or 'column'
            input_field = config.get("input_field", "description") 
            
            content_to_classify = payload.get(input_field)
            if not content_to_classify:
                 # Try nested if payload is complex, but keep simple for V1.0
                 return {"status": "skipped", "reason": f"Input field '{input_field}' empty"}

            # 2. Config
            valid_tags = config.get("tags", ["Geral"])
            sys_prompt = config.get("system_prompt")
            
            # 3. Inference
            result = AIService.classify_text(content_to_classify, valid_tags, sys_prompt)
            
            # 4. Output Handling
            output_target = config.get("output_target", "return") # 'return' or 'db_column'
            
            if output_target == 'db_column' and result.get("status") == "success":
                 target_entity = config.get("target_entity") # Slug
                 target_record_id = payload.get("id")
                 target_column = config.get("target_column")
                 
                 if target_entity and target_record_id and target_column:
                      # Update Record (quick logic reuse)
                      try:
                          from app.engine.metadata import models as models_meta
                          from app.engine.metadata import data_models
                          
                          # We need to find the record again? Or assume tenant context correct.
                          # Warning: This is "Action" context, db is System Session usually?
                          # If execute_ui_action, db is System. 
                          # We rely on 'data_models' accepting this session.
                          
                          ent = db.query(models_meta.MetaEntity).filter(
                              models_meta.MetaEntity.slug == target_entity, 
                              models_meta.MetaEntity.tenant_id == tenant_id
                          ).first()

                          if ent:
                              rec = db.query(data_models.EntityRecord).filter(
                                  data_models.EntityRecord.id == target_record_id
                              ).first()
                              if rec:
                                  curr_data = rec.data.copy()
                                  curr_data[target_column] = result.get("tag")
                                  rec.data = curr_data
                                  db.commit()
                      except Exception as ex:
                          logger.error(f"[AI Action] DB Update failed: {ex}")
            
            return {"status": "success", "action": "AI_CLASSIFY", "result": result}
            
        else:
            return {"status": "ignored", "message": f"Action type {action.action_type} not supported for internal logic"}

    except Exception as e:
        db.rollback()
        logger.error(f"[Action] Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
