from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.shared import database
from app.engine.metadata import models as models_meta, schemas as schemas_meta
from app.system.services.schema_manager import SchemaManager
from typing import List
import re

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
        options=payload.options
    )
    db.add(new_field)
    
    # 2. Sync DDL
    try:
        SchemaManager.add_column(schema, entity.slug, payload.name, payload.field_type, payload.is_required)
        db.commit()
        db.refresh(new_field)
        return new_field
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar coluna fisica: {str(e)}")

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
