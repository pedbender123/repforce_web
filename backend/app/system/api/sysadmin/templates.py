from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.shared import database, security
from app.system import models as models_system
from app.system.services.template_service import TemplateService
from fastapi.security import OAuth2PasswordBearer
import uuid

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")

def get_current_superuser(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    payload = security.decode_access_token(token)
    if not payload or not payload.get("is_superuser"):
         raise HTTPException(status_code=403, detail="Not a superuser")
    return payload

class TemplateCreateFromTenant(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str

class TemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    created_at: Optional[str] = None

    class Config:
        orm_mode = True

@router.get("", response_model=List[TemplateOut])
def list_templates(db: Session = Depends(database.get_db), user=Depends(get_current_superuser)):
    return db.query(models_system.TenantTemplate).all()

@router.post("/from_tenant")
def create_template_from_tenant(
    payload: TemplateCreateFromTenant,
    db: Session = Depends(database.get_db),
    user=Depends(get_current_superuser)
):
    try:
        template = TemplateService.create_snapshot(db, payload.tenant_id, payload.name, payload.description)
        return {"id": template.id, "message": "Template created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
