from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta
from ..db import session, models_crm

router = APIRouter()

@router.get("/kpis", response_model=Dict[str, Any])
def get_dashboard_kpis(
    time_range: str = "30d",
    db: Session = Depends(session.get_crm_db),
    request: Request = None
):
    """
    Retorna métricas principais para o dashboard do representante.
    Filter: time_range (7d, 30d, 90d, all)
    Context: Scoped to logged user (Sales Rep)
    """
    user_id = request.state.user_id
    
    # Define Data Inicial
    now = datetime.now()
    if time_range == "7d":
        start_date = now - timedelta(days=7)
    elif time_range == "90d":
        start_date = now - timedelta(days=90)
    else: # 30d default
        start_date = now - timedelta(days=30)
 
    # Base Query (User Scope + Time Range + Status != Canceled)
    query = db.query(models_crm.Order).filter(
        models_crm.Order.representative_id == user_id,
        models_crm.Order.created_at >= start_date,
        models_crm.Order.status != "canceled"
    )
    
    # 1. Total Vendido & Contagem
    totals = query.with_entities(
        func.sum(models_crm.Order.total_value).label("total"),
        func.count(models_crm.Order.id).label("count")
    ).first()
    
    total_sales = totals.total or 0.0
    order_count = totals.count or 0
    avg_ticket = (total_sales / order_count) if order_count > 0 else 0.0
    
    # 2. Clientes Ativos (com pedido no periodo)
    active_clients = query.with_entities(func.count(func.distinct(models_crm.Order.client_id))).scalar() or 0
    
    return {
        "total_sales": total_sales,
        "order_count": order_count,
        "avg_ticket": avg_ticket,
        "active_clients": active_clients,
        "period": time_range
    }

@router.get("/sales-history", response_model=List[Dict[str, Any]])
def get_sales_history(
    days: int = 30,
    db: Session = Depends(session.get_crm_db),
    request: Request = None
):
    user_id = request.state.user_id
    start_date = datetime.now() - timedelta(days=days)
    
    # Group by Date (Postgres date_trunc)
    results = db.query(
        func.to_char(models_crm.Order.created_at, 'YYYY-MM-DD').label('date'),
        func.sum(models_crm.Order.total_value).label('total')
    ).filter(
        models_crm.Order.representative_id == user_id,
        models_crm.Order.created_at >= start_date,
        models_crm.Order.status != "canceled"
    ).group_by('date').order_by('date').all()
    
    return [{"date": r.date, "total": r.total} for r in results]

@router.get("/top-products", response_model=List[Dict[str, Any]])
def get_top_products(
    limit: int = 5,
    db: Session = Depends(session.get_crm_db),
    request: Request = None
):
    user_id = request.state.user_id # Opcional: Filtrar apenas vendas deste user? 
    # Geralmente top products pode ser global ou do user. Vamos fazer do user.
    
    results = db.query(
        models_crm.OrderItem.product_id,
        func.sum(models_crm.OrderItem.quantity).label('qty'),
        func.sum(models_crm.OrderItem.total).label('total')
    ).join(models_crm.Order).filter(
        models_crm.Order.representative_id == user_id,
        models_crm.Order.status != "canceled"
    ).group_by(models_crm.OrderItem.product_id)\
    .order_by(func.sum(models_crm.OrderItem.total).desc())\
    .limit(limit).all()
    
    # Enriquecer com nomes (N+1 simples ou join explicito)
    # Join explicito é melhor mas para MVP vou fazer fetch simples
    data = []
    for r in results:
        prod = db.query(models_crm.Product).get(r.product_id)
        if prod:
            data.append({
                "name": prod.name,
                "quantity": r.qty,
                "total": r.total
            })
            
    return data
