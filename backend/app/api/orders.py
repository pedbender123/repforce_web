from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from typing import List

router = APIRouter()

@router.post("/orders", response_model=schemas.Order, status_code=201)
def create_order(
    order: schemas.OrderCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    representative_id = request.state.user_id

    # Busca produtos para garantir preço correto
    product_ids = [item.product_id for item in order.items]
    products = db.query(models.Product).filter(
        models.Product.id.in_(product_ids),
        models.Product.tenant_id == tenant_id
    ).all()
    
    product_map = {p.id: p for p in products}
    
    total_value = 0.0
    total_cost = 0.0
    final_items = []
    
    for item in order.items:
        if item.product_id not in product_map:
            raise HTTPException(status_code=400, detail=f"Produto ID {item.product_id} inválido")
        
        prod = product_map[item.product_id]
        
        unit_price = prod.price 
        subtotal = unit_price * item.quantity
        
        total_value += subtotal
        total_cost += (prod.cost_price or 0) * item.quantity
        
        final_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "subtotal": subtotal,
            "name": prod.name
        })

    margin_value = total_value - total_cost

    db_order = models.Order(
        client_id=order.client_id,
        items=final_items,
        total_value=total_value,
        margin_value=margin_value,
        status="draft",
        tenant_id=tenant_id,
        representative_id=representative_id
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    return db_order

@router.get("/orders", response_model=List[schemas.Order])
def get_orders(request: Request, db: Session = Depends(database.get_db)):
    tenant_id = request.state.tenant_id
    profile = request.state.profile
    user_id = request.state.user_id

    query = db.query(models.Order).filter(models.Order.tenant_id == tenant_id)
    
    if profile == 'representante':
        query = query.filter(models.Order.representative_id == user_id)
        
    return query.order_by(models.Order.created_at.desc()).all()