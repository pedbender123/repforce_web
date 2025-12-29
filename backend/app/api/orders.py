from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from ..db import session, models_crm, schemas
from ..services.cart_service import CartService

router = APIRouter()

@router.post("/preview", response_model=schemas.CartSummary)
def preview_order(
    items: List[schemas.CartItemInput],
    db: Session = Depends(session.get_crm_db)
):
    """
    Simula o cálculo do carrinho (Preços, Descontos, Total) sem salvar.
    Usado pelo Frontend para exibir totais em tempo real.
    """
    service = CartService(db)
    summary = service.calculate_cart(items)
    return summary

@router.post("", response_model=schemas.Order, status_code=201)
def create_order(
    order: schemas.OrderCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(session.get_crm_db)
):
    # 1. Setup Context
    # tenant_id já está no schema path, user_id precisamos pegar do token
    representative_id = request.state.user_id
    
    # 2. Calcular Totais via CartService
    service = CartService(db)
    # Convert input schema to CartItemInput
    cart_inputs = [schemas.CartItemInput(product_id=i.product_id, quantity=i.quantity) for i in order.items]
    summary = service.calculate_cart(cart_inputs)
    
    if not summary.items:
         raise HTTPException(status_code=400, detail="Carrinho vazio")

    # 3. Criar Order Items (DB Models)
    db_items = []
    for item in summary.items:
        db_items.append(models_crm.OrderItem(
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,       # Snapshot preço cheio
            discount_value=item.discount_value, # Snapshot desconto
            net_unit_price=item.net_unit_price, # Snapshot preço liquido
            total=item.total,             # Total da linha
            rule_snapshot=item.rule_applied
        ))

    # 4. Criar Pedido
    db_order = models_crm.Order(
        client_id=order.client_id,
        items=db_items,
        total_value=summary.total_net, # Valor final cobrado
        margin_value=summary.margin_value,
        status="draft",
        # tenant_id removido (schema isolation)
        representative_id=representative_id,
        notes=order.notes,
        custom_attributes=order.custom_attributes
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # 5. Dispatch Webhook
    from ..services.webhook_service import WebhookService
    webhook_service = WebhookService(db)
    
    payload = {
        "id": db_order.id,
        "total": db_order.total_value,
        "client_id": db_order.client_id,
        "created_at": str(db_order.created_at)
    }
    
    # Executa em Background para não travar a req
    background_tasks.add_task(webhook_service.dispatch_event, "order.created", payload)
    
    return db_order

@router.get("", response_model=List[schemas.Order])
def list_orders(
    request: Request, 
    db: Session = Depends(session.get_crm_db)
):
    # TODO: Implementar paginação e filtros
    user_id = request.state.user_id
    # Por enquanto retorna tudo (Scope deve ser aplicado aqui se tiver regra de "Só vejo meus pedidos")
    
    return db.query(models_crm.Order).order_by(models_crm.Order.created_at.desc()).all()

@router.get("/{order_id}", response_model=schemas.Order)
def get_order_details(
    order_id: int,
    request: Request,
    db: Session = Depends(session.get_crm_db)
):
    order = db.query(models_crm.Order).options(
        joinedload(models_crm.Order.items).joinedload(models_crm.OrderItem.product),
        joinedload(models_crm.Order.client)
    ).filter(models_crm.Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return order

@router.put("/{order_id}", response_model=schemas.Order)
def update_order(
    order_id: int,
    request: Request,
    order_in: schemas.OrderUpdate,
    db: Session = Depends(session.get_crm_db)
):
    order = db.query(models_crm.Order).filter(models_crm.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
        
    if order_in.status:
        # TODO: Add state machine validation (e.g. can't go from draft to approved directly without checks)
        order.status = order_in.status
        
    if order_in.notes is not None:
        order.notes = order_in.notes
        
    db.commit()
    db.refresh(order)
    return order