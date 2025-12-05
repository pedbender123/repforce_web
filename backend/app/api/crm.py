from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from ..db import database, models, schemas
from typing import List

router = APIRouter()

# Note que usamos 'get_tenant_db' aqui
@router.get("/clients", response_model=List[schemas.Client])
def get_clients(
    request: Request,
    db: Session = Depends(database.get_tenant_db), # <--- Conexão Dinâmica Isolada
    skip: int = 0,
    limit: int = 100,
    search: str = ""
):
    # NÃO precisamos mais filtrar por tenant_id, pois o DB é exclusivo!
    query = db.query(models.Client)
    
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (models.Client.name.ilike(search_fmt)) | 
            (models.Client.trade_name.ilike(search_fmt))
        )
        
    clients = query.offset(skip).limit(limit).all()
    return clients

@router.post("/clients", response_model=schemas.Client, status_code=201)
def create_client(
    client: schemas.ClientCreate,
    request: Request,
    db: Session = Depends(database.get_tenant_db)
):
    # Recupera o ID do usuário (Representante) do token (Core)
    # Mas salva apenas o ID (Integer) no banco do Tenant
    representative_id = request.state.user_id 
    
    client_data = client.dict()
    if client.address_data:
        client_data['address_data'] = client.address_data.dict()

    # representative_id é salvo apenas como número, sem FK relation SQL
    db_client = models.Client(**client_data, representative_id=representative_id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client