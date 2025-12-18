from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import models_crm, schemas, database

router = APIRouter()

@router.get("/config/fields/{entity}", response_model=List[schemas.CustomFieldConfig])
def list_custom_fields(
    entity: str,
    db: Session = Depends(database.get_crm_db)
):
    """
    Lista campos customizados para uma entidade (product, client, order).
    """
    fields = db.query(models_crm.CustomFieldConfig)\
               .filter(models_crm.CustomFieldConfig.entity == entity)\
               .order_by(models_crm.CustomFieldConfig.order_index)\
               .all()
    return fields

@router.post("/config/fields", response_model=schemas.CustomFieldConfig)
def create_custom_field(
    field: schemas.CustomFieldConfigCreate,
    db: Session = Depends(database.get_crm_db)
):
    """
    Cria um novo campo customizado.
    """
    # Verifica duplicidade de chave na mesma entidade
    existing = db.query(models_crm.CustomFieldConfig)\
                 .filter(models_crm.CustomFieldConfig.entity == field.entity)\
                 .filter(models_crm.CustomFieldConfig.key == field.key)\
                 .first()
    if existing:
        raise HTTPException(status_code=400, detail="Já existe um campo com esta chave para esta entidade.")
        
    db_field = models_crm.CustomFieldConfig(**field.dict())
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    return db_field

@router.delete("/config/fields/{field_id}")
def delete_custom_field(
    field_id: int,
    db: Session = Depends(database.get_crm_db)
):
    """
    Remove um campo customizado.
    Nota: Isso não remove os dados já salvos nos JSONs dos registros, apenas a definição.
    """
    field = db.query(models_crm.CustomFieldConfig).filter(models_crm.CustomFieldConfig.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Campo não encontrado")
        
    db.delete(field)
    db.commit()
    return {"ok": True}
