
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db import session, models_tenant
from app.core.security_n8n import validate_n8n_request
from pydantic import BaseModel
from typing import Dict, Any, Optional

router = APIRouter()

class OrderInjection(BaseModel):
    external_id: str
    client_name: str
    items: Dict[str, Any] # JSON
    total: float

@router.post("/inject-order", dependencies=[Depends(validate_n8n_request)])
def inject_order(
    payload: OrderInjection,
    x_tenant_slug: Optional[str] = Header(None, alias="X-Tenant-Slug"),
    # Manually get DB because Depends(get_crm_db) relies on middleware running 
    # BEFORE this router. Middleware DOES run for all routes.
    # So if n8n sends X-Tenant-Slug, middleware sets request.state.tenant_slug
    # and get_crm_db works!
    db: Session = Depends(session.get_crm_db) 
):
    if not db:
       raise HTTPException(status_code=400, detail="Missing X-Tenant-Slug header or Invalid Tenant")

    # Business Logic (Simplified for MVP)
    # 1. Find or Create Client (by name, loosely)
    client = db.query(models_tenant.Client).filter(models_tenant.Client.name == payload.client_name).first()
    if not client:
        client = models_tenant.Client(name=payload.client_name)
        db.add(client)
        db.flush()
        
    # 2. Create Order
    new_order = models_tenant.Order(
        client_id=client.id,
        status="approved", # Auto-approved from n8n
        total_value=payload.total,
        data={"items": payload.items, "source": "n8n_automation"} # JSONB
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    return {"message": "Order Injected", "id": str(new_order.id)}
