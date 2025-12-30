
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db import session, models_tenant
from pydantic import BaseModel
from typing import List

router = APIRouter()

class WebhookSchema(BaseModel):
    event_type: str
    target_url: str
    active: bool = True

@router.get("/", response_model=List[WebhookSchema])
def list_webhooks(db: Session = Depends(session.get_crm_db)):
    if not db: raise HTTPException(status_code=400, detail="Tenant context missing")
    return db.query(models_tenant.WebhookSubscription).all()

@router.post("/", response_model=WebhookSchema)
def subscribe_webhook(
    payload: WebhookSchema,
    db: Session = Depends(session.get_crm_db)
):
    if not db: raise HTTPException(status_code=400, detail="Tenant context missing")
    
    # Upsert logic
    sub = db.query(models_tenant.WebhookSubscription).filter(models_tenant.WebhookSubscription.event_type == payload.event_type).first()
    if not sub:
        sub = models_tenant.WebhookSubscription(
            event_type=payload.event_type,
            target_url=payload.target_url,
            active=payload.active
        )
        db.add(sub)
    else:
        sub.target_url = payload.target_url
        sub.active = payload.active
    
    db.commit()
    db.refresh(sub)
    return sub

@router.delete("/{event_type}")
def unsubscribe_webhook(
    event_type: str,
    db: Session = Depends(session.get_crm_db)
):
    if not db: raise HTTPException(status_code=400, detail="Tenant context missing")
    
    sub = db.query(models_tenant.WebhookSubscription).filter(models_tenant.WebhookSubscription.event_type == event_type).first()
    if sub:
        db.delete(sub)
        db.commit()
    return {"message": "Unsubscribed"}