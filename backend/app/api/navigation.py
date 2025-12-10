from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db import models, schemas, database
from app.api import auth

router = APIRouter()

@router.get("/menu", response_model=List[schemas.TenantArea])
def get_my_menu(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Retorna o menu dinâmico baseado no Tenant do usuário.
    """
    if not current_user.tenant_id:
        return []

    # Busca Áreas do Tenant
    areas = db.query(models.TenantArea).filter(
        models.TenantArea.tenant_id == current_user.tenant_id
    ).order_by(models.TenantArea.order).all()

    result = []
    for area in areas:
        area_data = schemas.TenantArea.from_orm(area)
        
        pages_data = []
        for page in area.pages:
            p_data = schemas.TenantPage.from_orm(page)
            
            # Popula a chave do componente para o Frontend saber qual renderizar
            if page.component:
                p_data.component_key = page.component.key
            
            # O config_json já vai automaticamente pelo from_orm pois está no schema
            
            pages_data.append(p_data)
        
        area_data.pages = pages_data
        result.append(area_data)

    return result