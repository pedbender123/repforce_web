from fastapi import APIRouter, HTTPException, Depends, Request, Body, BackgroundTasks
from sqlalchemy.orm import Session
from app.shared import database
from app.engine.metadata import models as models_meta, data_models
from app.system import models as models_system
from app.engine.services.workflow_service import WorkflowService
from app.engine.services.trail_executor import TrailExecutor
from app.engine.formulas import FormulaEngine
from typing import Dict, Any, Optional
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
    # Virtual hooks usually run as system, but can we accept user_id in payload? 
    # For now, assumes system (no user context).
    return _execute_logic(action, payload, db, background_tasks, user_id=None)

@router.post("/actions/{action_id}/execute")
def execute_ui_action(
    action_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(default={}),
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    user_id = getattr(request.state, "user_id", None) # Extract User ID from middleware state

    action = db.query(models_meta.MetaAction).filter(
        models_meta.MetaAction.id == action_id,
        models_meta.MetaAction.tenant_id == tenant_id
    ).first()
    
    if not action:
        raise HTTPException(status_code=404, detail="Acao nao encontrada.")
        
    logger.info(f"[Action] UI Trigger: {action.name} by User {user_id}")
    return _execute_logic(action, payload, db, background_tasks, user_id=user_id)

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

def _execute_logic(action, payload, db, background_tasks, user_id: Optional[str] = None):
    tenant_id = action.tenant_id
    config = action.config or {}
    
    # --- BUILD USER CONTEXT ---
    user_context = {}
    if user_id:
        try:
            user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.id == user_id).first()
            if user:
                user_context['id'] = str(user.id)
                user_context['email'] = user.recovery_email # Use recovery_email as email
                user_context['username'] = user.username # Login/Username
                user_context['name'] = user.full_name # Full Name for USER()
                
                # Fetch Cargo
                membership = db.query(models_system.Membership).filter(
                    models_system.Membership.user_id == user.id,
                    models_system.Membership.tenant_id == tenant_id
                ).first()
                if membership:
                    if membership.cargo:
                        user_context['cargo'] = membership.cargo.name
                    else:
                         user_context['cargo'] = membership.role # Fallback
        except Exception as e:
            logger.warning(f"Failed to load user context for action: {e}")

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
            
            # --- FORMULA ENGINE (Create Snapshot) ---
            formula_engine = FormulaEngine(db, str(tenant_id))
            
            # Find fields with formulas
            fields_with_formulas = db.query(models_meta.MetaField).filter(
                models_meta.MetaField.entity_id == entity.id,
                models_meta.MetaField.formula != None,
                models_meta.MetaField.is_virtual == False
            ).all()
            
            for field in fields_with_formulas:
                try:
                    # No CREATE, data_to_save é o contexto inicial.
                    val = formula_engine.evaluate(
                        field.formula, 
                        data_to_save, 
                        user_context=user_context,
                        current_entity_id=str(entity.id)
                    )
                    data_to_save[field.name] = val
                    logger.info(f"Formula Calculated [CREATE]: {field.name} = {val}")
                except Exception as e:
                    logger.error(f"Failed to calculate formula for {field.name}: {e}")

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
                user_id=user_id
            )
            return {"status": "success", "action": "CREATE_ITEM", "record_id": str(record.id)}

        elif action.action_type == 'EDIT_ITEM':
            entity_slug = config.get('entity_slug')
            record_id = payload.get('id') or config.get('record_id')
            if not entity_slug or not record_id: raise ValueError("Target Entity or Record ID missing")
            
            # Lookup Record
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
            
            # --- FORMULA ENGINE (Update Snapshot) ---
            old_data = record.data.copy()
            new_data_input = {**old_data, **payload} # Merge input over current
            
            # Re-calculate formulas
            formula_engine = FormulaEngine(db, str(tenant_id))
            calculated_data = new_data_input.copy()
            
            # Find fields with formulas
            fields_with_formulas = db.query(models_meta.MetaField).filter(
                models_meta.MetaField.entity_id == entity.id,
                models_meta.MetaField.formula != None,
                models_meta.MetaField.is_virtual == False
            ).all()
            
            for field in fields_with_formulas:
                try:
                    val = formula_engine.evaluate(
                        field.formula, 
                        calculated_data,
                        user_context=user_context,
                        current_entity_id=str(entity.id)
                    )
                    calculated_data[field.name] = val
                    logger.info(f"Formula Calculated [EDIT]: {field.name} = {val}")
                except Exception as e:
                    logger.error(f"Failed to calculate formula for {field.name}: {e}")

            record.data = calculated_data
            db.commit()
            
            # Trigger Workflows
            background_tasks.add_task(
                WorkflowService.trigger_workflows,
                db=db,
                entity_slug=entity_slug,
                trigger_type="ON_UPDATE",
                payload_data=record.data,
                tenant_id=tenant_id,
                user_id=user_id,
                changes={"old": old_data, "new": calculated_data} # Use calculated data
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
                user_id=user_id
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

@router.post("/trails/run")
def execute_trail(
    request: Request,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(default={}),
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    user_id = getattr(request.state, "user_id", None)
    
    trail_id = payload.get("trail_id")
    context_data = payload.get("context", {})
    
    if not trail_id:
        raise HTTPException(status_code=400, detail="trail_id required")

    trail = db.query(models_meta.MetaTrail).filter(
        models_meta.MetaTrail.id == trail_id,
        models_meta.MetaTrail.tenant_id == tenant_id
    ).first()
    
    if not trail:
        raise HTTPException(status_code=404, detail="Trail not found")
        
    logger.info(f"[Trail] Running Manual Trigger: {trail.name} by User {user_id}")
    
    # Instantiate Executor
    executor = TrailExecutor(db, tenant_id, user_id=user_id)
    
    # Run Trail
    final_results = executor.execute_trail(str(trail.id), context_data)
    
    # Analyze Final Results for Client Instructions
    instruction = None
    message = "Trilha executada com sucesso."
    
    # Check for URL or instruction
    for node_res in final_results.values():
        if isinstance(node_res, dict):
            if node_res.get("url"):
                instruction = {
                    "type": "URL",
                    "config": {"url": node_res.get("url")}
                }
            if node_res.get("instruction"):
                 instruction = node_res.get("instruction")

    return {
        "status": "success", 
        "results": final_results,
        "instruction": instruction,
        "message": message
    }
