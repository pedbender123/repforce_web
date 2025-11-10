from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from typing import List

router = APIRouter()

@router.get("/clients", response_model=List[schemas.Client])
def get_clients(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Lista todos os clientes (filtrados pelo tenant_id do token).
    """
    tenant_id = request.state.tenant_id
    clients = db.query(models.Client).filter(models.Client.tenant_id == tenant_id).all()
    return clients

@router.post("/clients", response_model=schemas.Client, status_code=201)
def create_client(
    client: schemas.ClientCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Cria um novo cliente (associado ao tenant_id do token).
    """
    tenant_id = request.state.tenant_id
    
    db_client = models.Client(
        **client.dict(),
        tenant_id=tenant_id
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.get("/clients/{client_id}", response_model=schemas.Client)
def get_client(
    client_id: int,
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Busca um cliente específico (verificando o tenant_id).
    """
    tenant_id = request.state.tenant_id
    
    db_client = db.query(models.Client).filter(
        models.Client.id == client_id,
        models.Client.tenant_id == tenant_id
    ).first()
    
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado ou não pertence a este tenant")
        
    return db_client