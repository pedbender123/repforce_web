from fastapi import APIRouter, Depends, HTTPException
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
    Retorna a estrutura de menu (Áreas -> Páginas) configurada para o Tenant do usuário atual.
    """
    if not current_user.tenant_id:
        # Se for SysAdmin ou usuário sem tenant, retorna lista vazia ou erro
        # Aqui optamos por retornar vazio para não quebrar o front, 
        # mas o ideal é que SysAdmin tenha seu próprio menu fixo.
        return []

    # Busca Áreas do Tenant
    areas = db.query(models.TenantArea).filter(
        models.TenantArea.tenant_id == current_user.tenant_id
    ).order_by(models.TenantArea.order).all()

    result = []
    for area in areas:
        # Converter SQLAlchemy Model -> Pydantic Schema
        area_data = schemas.TenantArea.from_orm(area)
        
        # Processar as páginas dessa área
        pages_data = []
        for page in area.pages:
            p_data = schemas.TenantPage.from_orm(page)
            
            # Injeta a KEY do componente (ex: CLIENT_LIST) para o front saber o que renderizar
            p_data.component_key = page.component.key
            
            # Define o caminho (URL): Se tiver override usa ele, senão usa o default do componente
            p_data.path = page.path_override if page.path_override else page.component.default_path
            
            pages_data.append(p_data)
        
        area_data.pages = pages_data
        result.append(area_data)

    return result