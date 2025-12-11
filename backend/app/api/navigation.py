from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db import database, models, schemas

router = APIRouter()

@router.get("/menu", response_model=List[schemas.TenantArea])
def get_menu(request: database.Request, db: Session = Depends(database.get_db)):
    # Busca o tenant_id do usuário logado através do user_id no state
    user = db.query(models.User).filter(models.User.id == request.state.user_id).first()
    if not user:
        return []
    
    areas = db.query(models.TenantArea).filter(models.TenantArea.tenant_id == user.tenant_id).order_by(models.TenantArea.order).all()
    
    # Preencher o component_key
    result = []
    for area in areas:
        area_data = schemas.TenantArea.from_orm(area)
        for page, page_data in zip(area.pages, area_data.pages):
            if page.component:
                page_data.component_key = page.component.key
        result.append(area_data)
        
    return result