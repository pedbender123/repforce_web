from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from typing import List
import json # Para lidar com o campo 'items'

router = APIRouter()

@router.post("/orders", response_model=schemas.Order, status_code=201)
def create_order(
    order: schemas.OrderCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Cria um novo pedido (WF III.1 - Demo Simplificada).
    """
    tenant_id = request.state.tenant_id
    representative_id = request.state.user_id # O usuário logado é o representante

    # Lógica simplificada para calcular o total
    # Em um cenário real, você buscaria os preços dos produtos no DB
    # para evitar adulteração
    total_value = sum(item.quantity * item.unit_price for item in order.items)
    
    # Converte Pydantic models para dicts para salvar no JSONB
    items_as_dicts = [item.dict() for item in order.items]

    db_order = models.Order(
        client_id=order.client_id,
        items=items_as_dicts, # Salva como JSON
        total_value=total_value,
        status="PENDING",
        tenant_id=tenant_id,
        representative_id=representative_id
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Fase 1 (Dezembro): Chamar n8n_client.trigger_order_validation(...) aqui
    
    return db_order

@router.get("/orders", response_model=List[schemas.Order])
def get_orders(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Lista pedidos.
    - Admin vê todos do tenant.
    - Representante vê apenas os seus.
    """
    tenant_id = request.state.tenant_id
    profile = request.state.profile
    user_id = request.state.user_id

    query = db.query(models.Order).filter(models.Order.tenant_id == tenant_id)
    
    if profile == 'representante':
        query = query.filter(models.Order.representative_id == user_id)
        
    orders = query.all()
    return orders