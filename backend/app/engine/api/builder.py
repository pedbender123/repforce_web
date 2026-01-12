from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.shared import database
from app.engine.metadata import models as models_meta, schemas as schemas_meta
from app.system.services.schema_manager import SchemaManager
from typing import List, Optional
import re
from app.engine.formulas import FormulaEngine

router = APIRouter()

# --- Helpers ---
def validate_slug(slug: str):
    if not re.match(r'^[a-z0-9_]+$', slug):
        raise HTTPException(status_code=400, detail="Slug invalido. Use apenas letras minusculas, numeros e undercores.")

def get_tenant_schema(request: Request):
    schema = getattr(request.state, "tenant_schema", None)
    if not schema:
        raise HTTPException(status_code=400, detail="Contexto do Tenant obrigatorio.")
    return schema

# --- Endpoints: Entities ---

@router.get("/entities", response_model=List[schemas_meta.MetaEntityResponse])
def list_entities(request: Request, db: Session = Depends(database.get_db)):
    tenant_id = request.state.tenant_id
    entities = db.query(models_meta.MetaEntity).filter(models_meta.MetaEntity.tenant_id == tenant_id).all()
    return entities

@router.post("/entities", response_model=schemas_meta.MetaEntityResponse)
def create_entity(
    request: Request, 
    payload: schemas_meta.MetaEntityCreate, 
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    schema = get_tenant_schema(request)
    validate_slug(payload.slug)
    
    # Check Duplicate
    if db.query(models_meta.MetaEntity).filter(
        models_meta.MetaEntity.tenant_id == tenant_id, 
        models_meta.MetaEntity.slug == payload.slug
    ).first():
        raise HTTPException(status_code=400, detail="Tabela ja existe.")
        
    # 1. Create Metadata
    new_entity = models_meta.MetaEntity(
        tenant_id=tenant_id,
        slug=payload.slug,
        display_name=payload.display_name,
        icon=payload.icon,
        is_system=payload.is_system
    )
    db.add(new_entity)
    
    # 2. Sync DDL
    try:
        SchemaManager.create_table(schema, payload.slug)
        db.commit()
        db.refresh(new_entity)
        return new_entity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar tabela fisica: {str(e)}")

@router.patch("/entities/{entity_id}", response_model=schemas_meta.MetaEntityResponse)
def update_entity(
    request: Request,
    entity_id: str,
    payload: schemas_meta.MetaEntityUpdate,
    db: Session = Depends(database.get_db)
):
    schema = get_tenant_schema(request)
    entity = db.query(models_meta.MetaEntity).filter(models_meta.MetaEntity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Tabela nao encontrada.")
        
    # 1. Handle Rename
    if payload.slug and payload.slug != entity.slug:
        validate_slug(payload.slug)
        # Check duplicate
        if db.query(models_meta.MetaEntity).filter(
            models_meta.MetaEntity.tenant_id == entity.tenant_id, 
            models_meta.MetaEntity.slug == payload.slug
        ).first():
            raise HTTPException(status_code=400, detail="Slug ja existe.")
            
        try:
            SchemaManager.rename_table(schema, entity.slug, payload.slug)
            entity.slug = payload.slug
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao renomear tabela fisica: {str(e)}")

    # 2. Update other fields
    if payload.display_name:
        entity.display_name = payload.display_name
    if payload.icon:
        entity.icon = payload.icon
        
    db.commit()
    db.refresh(entity)
    return entity

@router.delete("/entities/{entity_id}")
def delete_entity(
    request: Request,
    entity_id: str,
    db: Session = Depends(database.get_db)
):
    schema = get_tenant_schema(request)
    entity = db.query(models_meta.MetaEntity).filter(models_meta.MetaEntity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Tabela nao encontrada.")
        
    if entity.is_system:
        raise HTTPException(status_code=400, detail="Nao e possivel deletar tabelas de sistema.")
        
    try:
        SchemaManager.drop_table(schema, entity.slug)
        db.delete(entity)
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao deletar tabela: {str(e)}")

# --- Endpoints: Fields ---

@router.get("/entities/{entity_id}/fields", response_model=List[schemas_meta.MetaFieldResponse])
def list_fields(entity_id: str, db: Session = Depends(database.get_db)):
    fields = db.query(models_meta.MetaField).filter(models_meta.MetaField.entity_id == entity_id).all()
    return fields

@router.post("/entities/{entity_id}/fields", response_model=schemas_meta.MetaFieldResponse)
def create_field(
    request: Request,
    entity_id: str,
    payload: schemas_meta.MetaFieldCreate,
    db: Session = Depends(database.get_db)
):
    schema = get_tenant_schema(request)
    validate_slug(payload.name)
    
    entity = db.query(models_meta.MetaEntity).filter(models_meta.MetaEntity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Tabela nao encontrada.")
        
    if db.query(models_meta.MetaField).filter(
        models_meta.MetaField.entity_id == entity.id,
        models_meta.MetaField.name == payload.name
    ).first():
        raise HTTPException(status_code=400, detail="Campo ja existe.")

    # 1. Create Metadata
    new_field = models_meta.MetaField(
        entity_id=entity.id,
        name=payload.name,
        label=payload.label,
        field_type=payload.field_type,
        is_required=payload.is_required,
        options=payload.options,
        formula=payload.formula,
        is_virtual=payload.is_virtual or False
    )
    db.add(new_field)
    
    # 2. Sync DDL (Only if NOT virtual)
    if not new_field.is_virtual:
        try:
            SchemaManager.add_column(schema, entity.slug, payload.name, payload.field_type, payload.is_required)
            db.commit()
            db.refresh(new_field)
            return new_field
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Erro ao criar coluna fisica: {str(e)}")
    else:
        # Virtual field only needs metadata
        db.commit()
        db.refresh(new_field)
        return new_field

@router.patch("/entities/{entity_id}/fields/{field_id}", response_model=schemas_meta.MetaFieldResponse)
def update_field(
    request: Request,
    entity_id: str,
    field_id: str,
    payload: schemas_meta.MetaFieldUpdate,
    db: Session = Depends(database.get_db)
):
    schema = get_tenant_schema(request)
    field = db.query(models_meta.MetaField).filter(
        models_meta.MetaField.id == field_id,
        models_meta.MetaField.entity_id == entity_id
    ).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Campo nao encontrado.")
    
    entity = db.query(models_meta.MetaEntity).filter(models_meta.MetaEntity.id == entity_id).first()
    
    # 1. Handle Rename (Only if NOT virtual - virtuals have no physical col to rename)
    # Actually, we can rename virtuals metadata freely. 
    if payload.name and payload.name != field.name:
        validate_slug(payload.name)
        # Check duplicate
        if db.query(models_meta.MetaField).filter(
            models_meta.MetaField.entity_id == entity_id,
            models_meta.MetaField.name == payload.name
        ).first():
            raise HTTPException(status_code=400, detail="Campo ja existe.")
            
        try:
            if not field.is_virtual:
                SchemaManager.rename_column(schema, entity.slug, field.name, payload.name)
            field.name = payload.name
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao renomear coluna fisica: {str(e)}")
            
    # 2. Update Label
    if payload.label:
        field.label = payload.label
    
    # 3. Update Formula
    if payload.formula is not None:
        field.formula = payload.formula
        
    db.commit()
    db.refresh(field)
    return field

@router.delete("/entities/{entity_id}/fields/{field_id}")
def delete_field(
    request: Request,
    entity_id: str,
    field_id: str,
    db: Session = Depends(database.get_db)
):
    schema = get_tenant_schema(request)
    field = db.query(models_meta.MetaField).filter(
        models_meta.MetaField.id == field_id,
        models_meta.MetaField.entity_id == entity_id
    ).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Campo nao encontrado.")
        
    entity = db.query(models_meta.MetaEntity).filter(models_meta.MetaEntity.id == entity_id).first()

    try:
        SchemaManager.drop_column(schema, entity.slug, field.name)
        db.delete(field)
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao deletar coluna: {str(e)}")

# --- Endpoints: Navigation ---

@router.get("/navigation", response_model=List[schemas_meta.MetaNavigationGroupResponse])
def get_navigation_tree(request: Request, db: Session = Depends(database.get_db)):
    tenant_id = request.state.tenant_id
    groups = db.query(models_meta.MetaNavigationGroup)\
        .filter(models_meta.MetaNavigationGroup.tenant_id == tenant_id)\
        .order_by(models_meta.MetaNavigationGroup.order)\
        .all()
    # Pages are loaded via relationship lazy='select' (or joinedload if optimized)
    # Assuming default relationship works for small depth
    return groups

@router.post("/navigation/groups", response_model=schemas_meta.MetaNavigationGroupResponse)
def create_nav_group(
    request: Request,
    payload: schemas_meta.MetaNavigationGroupCreate,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    new_group = models_meta.MetaNavigationGroup(
        tenant_id=tenant_id,
        name=payload.name,
        icon=payload.icon,
        order=payload.order
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@router.put("/navigation/groups/{group_id}", response_model=schemas_meta.MetaNavigationGroupResponse)
def update_nav_group(
    request: Request,
    group_id: str,
    payload: schemas_meta.MetaNavigationGroupUpdate,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    group = db.query(models_meta.MetaNavigationGroup).filter(
        models_meta.MetaNavigationGroup.id == group_id,
        models_meta.MetaNavigationGroup.tenant_id == tenant_id
    ).first()

    if not group:
        raise HTTPException(status_code=404, detail="Grupo nao encontrado.")

    if payload.name:
        group.name = payload.name
    if payload.icon:
        group.icon = payload.icon
    if payload.order is not None:
        group.order = payload.order
    
    db.commit()
    db.refresh(group)
    return group

@router.post("/navigation/groups/{group_id}/pages", response_model=schemas_meta.MetaPageResponse)
def create_nav_page(
    group_id: str,
    payload: schemas_meta.MetaPageCreate,
    db: Session = Depends(database.get_db)
):
    new_page = models_meta.MetaPage(
        group_id=group_id,
        name=payload.name,
        type=payload.type,
        entity_id=payload.entity_id,
        layout_config=payload.layout_config,
        order=payload.order
    )
    db.add(new_page)
    db.commit()
    db.refresh(new_page)
    return new_page

@router.put("/navigation/pages/{page_id}", response_model=schemas_meta.MetaPageResponse)
def update_nav_page(
    request: Request,
    page_id: str,
    payload: schemas_meta.MetaPageUpdate,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    page = db.query(models_meta.MetaPage)\
        .join(models_meta.MetaNavigationGroup)\
        .filter(
            models_meta.MetaPage.id == page_id,
            models_meta.MetaNavigationGroup.tenant_id == tenant_id
        ).first()

    if not page:
        raise HTTPException(status_code=404, detail="Pagina nao encontrada.")

    if payload.name:
        page.name = payload.name
    if payload.layout_config is not None:
        page.layout_config = payload.layout_config
    if payload.order is not None:
        page.order = payload.order

    db.commit()
    db.refresh(page)
    return page

@router.delete("/navigation/groups/{group_id}")
def delete_nav_group(
    request: Request,
    group_id: str,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    group = db.query(models_meta.MetaNavigationGroup).filter(
        models_meta.MetaNavigationGroup.id == group_id,
        models_meta.MetaNavigationGroup.tenant_id == tenant_id
    ).first()

    if not group:
        raise HTTPException(status_code=404, detail="Grupo nao encontrado.")

    db.delete(group)
    db.commit()
    return {"ok": True}

@router.delete("/navigation/pages/{page_id}")
def delete_nav_page(
    request: Request,
    page_id: str,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    page = db.query(models_meta.MetaPage)\
        .join(models_meta.MetaNavigationGroup)\
        .filter(
            models_meta.MetaPage.id == page_id,
            models_meta.MetaNavigationGroup.tenant_id == tenant_id
        ).first()

    if not page:
        raise HTTPException(status_code=404, detail="Pagina nao encontrada.")

    db.delete(page)
    db.commit()
    return {"ok": True}

@router.get("/pages", response_model=List[schemas_meta.MetaPageResponse])
def list_all_pages(request: Request, db: Session = Depends(database.get_db)):
    tenant_id = request.state.tenant_id
    # Pages are linked to Groups which are linked to Tenants
    pages = db.query(models_meta.MetaPage)\
        .join(models_meta.MetaNavigationGroup)\
        .filter(models_meta.MetaNavigationGroup.tenant_id == tenant_id)\
        .all()
    return pages

# --- Endpoints: Workflows ---

@router.get("/workflows", response_model=List[schemas_meta.MetaWorkflowResponse])
def list_workflows(request: Request, entity_id: Optional[str] = None, db: Session = Depends(database.get_db)):
    # If entity_id provided, filter. Else return all for tenant (implicit via entity join? No, workflow has entity_id)
    # We need to filter by tenant entities.
    tenant_id = request.state.tenant_id
    
    query = db.query(models_meta.MetaWorkflow).join(models_meta.MetaEntity).filter(models_meta.MetaEntity.tenant_id == tenant_id)
    
    if entity_id:
        query = query.filter(models_meta.MetaWorkflow.entity_id == entity_id)
        
    return query.all()

@router.post("/workflows", response_model=schemas_meta.MetaWorkflowResponse)
def create_workflow(
    payload: schemas_meta.MetaWorkflowCreate,
    db: Session = Depends(database.get_db)
):
    new_flow = models_meta.MetaWorkflow(
        entity_id=payload.entity_id,
        trigger_type=payload.trigger_type,
        name=payload.name,
        webhook_url=payload.webhook_url,
        is_active=payload.is_active
    )
    db.add(new_flow)
    db.commit()
    db.refresh(new_flow)
    return new_flow

@router.delete("/workflows/{workflow_id}")
def delete_workflow(
    request: Request,
    workflow_id: str,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    # Verify Workflow Ownership
    wf = db.query(models_meta.MetaWorkflow).join(models_meta.MetaEntity).filter(
        models_meta.MetaWorkflow.id == workflow_id,
        models_meta.MetaEntity.tenant_id == tenant_id
    ).first()
    
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow nao encontrado.")
        
    db.delete(wf)
    db.commit()
    return {"ok": True}

# --- Endpoints: Actions ---

@router.get("/actions", response_model=List[schemas_meta.MetaActionResponse])
def list_actions(
    request: Request, 
    trigger_source: Optional[str] = None,
    trigger_context: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    query = db.query(models_meta.MetaAction).filter(models_meta.MetaAction.tenant_id == tenant_id)
    
    if trigger_source:
        query = query.filter(models_meta.MetaAction.trigger_source == trigger_source)
    if trigger_context:
        query = query.filter(models_meta.MetaAction.trigger_context == trigger_context)
        
    return query.all()

@router.post("/actions", response_model=schemas_meta.MetaActionResponse)
def create_action(
    request: Request,
    payload: schemas_meta.MetaActionCreate,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    # 1. Create Action
    new_action = models_meta.MetaAction(
        tenant_id=tenant_id,
        trigger_source=payload.trigger_source,
        trigger_context=payload.trigger_context,
        name=payload.name,
        action_type=payload.action_type,
        config=payload.config
    )
    db.add(new_action)
    db.commit()
    db.refresh(new_action)
    return new_action

@router.delete("/actions/{action_id}")
def delete_action(
    request: Request,
    action_id: str,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    action = db.query(models_meta.MetaAction).filter(
        models_meta.MetaAction.id == action_id,
        models_meta.MetaAction.tenant_id == tenant_id
    ).first()
    
    if not action:
        raise HTTPException(status_code=404, detail="Acao nao encontrada.")
        
    db.delete(action)
    db.commit()
    return {"ok": True}
# --- Endpoints: Trails ---

@router.get("/trails", response_model=List[schemas_meta.MetaTrailResponse])
def list_trails(request: Request, db: Session = Depends(database.get_db)):
    tenant_id = request.state.tenant_id
    trails = db.query(models_meta.MetaTrail).filter(models_meta.MetaTrail.tenant_id == tenant_id).all()
    return trails

@router.post("/trails", response_model=schemas_meta.MetaTrailResponse)
def create_trail(
    request: Request,
    payload: schemas_meta.MetaTrailCreate,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    new_trail = models_meta.MetaTrail(
        tenant_id=tenant_id,
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active,
        trigger_type=payload.trigger_type,
        trigger_config=payload.trigger_config,
        nodes=payload.nodes or {}
    )
    db.add(new_trail)
    db.commit()
    db.refresh(new_trail)
    return new_trail

@router.get("/trails/{trail_id}", response_model=schemas_meta.MetaTrailResponse)
def get_trail(
    request: Request,
    trail_id: str,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    trail = db.query(models_meta.MetaTrail).filter(
        models_meta.MetaTrail.id == trail_id,
        models_meta.MetaTrail.tenant_id == tenant_id
    ).first()
    
    if not trail:
        raise HTTPException(status_code=404, detail="Trilha nao encontrada.")
    return trail

@router.put("/trails/{trail_id}", response_model=schemas_meta.MetaTrailResponse)
def update_trail(
    request: Request,
    trail_id: str,
    payload: schemas_meta.MetaTrailUpdate,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    trail = db.query(models_meta.MetaTrail).filter(
        models_meta.MetaTrail.id == trail_id,
        models_meta.MetaTrail.tenant_id == tenant_id
    ).first()
    
    if not trail:
        raise HTTPException(status_code=404, detail="Trilha nao encontrada.")
        
    if payload.name: trail.name = payload.name
    if payload.description is not None: trail.description = payload.description
    if payload.is_active is not None: trail.is_active = payload.is_active
    if payload.trigger_type: trail.trigger_type = payload.trigger_type
    if payload.trigger_config is not None: trail.trigger_config = payload.trigger_config
    if payload.nodes is not None: trail.nodes = payload.nodes
    
    db.commit()
    db.refresh(trail)
    return trail

@router.delete("/trails/{trail_id}")
def delete_trail(
    request: Request,
    trail_id: str,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    trail = db.query(models_meta.MetaTrail).filter(
        models_meta.MetaTrail.id == trail_id,
        models_meta.MetaTrail.tenant_id == tenant_id
    ).first()
    
    if not trail:
        raise HTTPException(status_code=404, detail="Trilha nao encontrada.")
        
    db.delete(trail)
    db.commit()
    return {"ok": True}
    
@router.post("/formulas/preview")
def preview_formula(
    request: Request,
    payload: dict, # {formula, entity_id, context_sample}
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    formula = payload.get("formula")
    entity_id = payload.get("entity_id")
    context = payload.get("context", {}) # Dados de exemplo
    
    if not formula:
        return {"result": None}
        
    try:
        engine = FormulaEngine(db, tenant_id)
        # Tenta pegar um contexto real se o sample estiver vazio
        if not context and entity_id:
            from sqlalchemy import text
            entity = db.query(models_meta.MetaEntity).filter(models_meta.MetaEntity.id == entity_id).first()
            if entity:
                row = db.execute(text(f"SELECT data FROM entity_records WHERE entity_id = :eid LIMIT 1"), {"eid": entity.id}).fetchone()
                if row:
                    context = row[0]

        result = engine.evaluate(formula, context, current_entity_id=entity_id)
        return {"result": str(result) if result is not None else None, "success": True}
    except Exception as e:
        return {"result": str(e), "success": False}

@router.get("/formulas/functions")
def list_available_functions():
    # Lista estática das funções suportadas no motor baseado no engine/formulas.py
    return [
        {"name": "IF", "syntax": "IF(cond, true, false)", "category": "Logic"},
        {"name": "IFS", "syntax": "IFS(cond1, val1, cond2, val2...)", "category": "Logic"},
        {"name": "AND", "syntax": "AND(e1, e2...)", "category": "Logic"},
        {"name": "OR", "syntax": "OR(e1, e2...)", "category": "Logic"},
        {"name": "NOT", "syntax": "NOT(val)", "category": "Logic"},
        {"name": "ISBLANK", "syntax": "ISBLANK(val)", "category": "Logic"},
        {"name": "ISNOTBLANK", "syntax": "ISNOTBLANK(val)", "category": "Logic"},
        {"name": "LOOKUP", "syntax": "LOOKUP(val, table, col, return)", "category": "Data"},
        {"name": "SELECT", "syntax": "SELECT(table, col, [filter])", "category": "Data"},
        {"name": "FILTER", "syntax": "FILTER(table, [filter])", "category": "Data"},
        {"name": "ANY", "syntax": "ANY(list)", "category": "List"},
        {"name": "IN", "syntax": "IN(val, list)", "category": "List"},
        {"name": "COUNT", "syntax": "COUNT(list)", "category": "Math"},
        {"name": "SUM", "syntax": "SUM(list)", "category": "Math"},
        {"name": "AVERAGE", "syntax": "AVERAGE(list)", "category": "Math"},
        {"name": "TODAY", "syntax": "TODAY()", "category": "Date"},
        {"name": "NOW", "syntax": "NOW()", "category": "Date"},
        {"name": "CONCATENATE", "syntax": "CONCATENATE(a, b...)", "category": "Text"},
        {"name": "LATLONG", "syntax": "LATLONG(address)", "category": "Geo"}
    ]
