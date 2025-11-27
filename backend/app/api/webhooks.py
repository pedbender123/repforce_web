from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from ..db import database, models
from ..core import security

router = APIRouter()

@router.post("/n8n/order-update")
def update_order_status_from_n8n(
    api_key: str = Depends(security.get_api_key), # Valida header X-API-Key
    payload: dict = Body(...),
    db: Session = Depends(database.get_db)
):
    """
    Webhook para automação N8N.
    Body: { "order_id": 123, "new_status": "approved" }
    """
    order_id = payload.get("order_id")
    new_status = payload.get("new_status")
    
    if not order_id or not new_status:
        raise HTTPException(status_code=400, detail="Faltando order_id ou new_status")
        
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
        
    order.status = new_status
    db.commit()
    
    return {"message": "Status atualizado", "id": order_id, "status": new_status}