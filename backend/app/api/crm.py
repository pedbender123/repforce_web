from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..db import database, models, schemas
from ..core.permissions import get_user_scope
from typing import List

router = APIRouter()

# --- CLIENTS ---

@router.get("/clients", response_model=List[schemas.Client])
def get_clients(
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    user_id = request.state.user_id
    
    # 1. Pergunta ao Antigravity: "O que esse cara pode ver?"
    scope = get_user_scope(request)
    
    # 2. Query Base
    query = db.query(models.Client).filter(models.Client.tenant_id == tenant_id)
    
    # 3. Filtro Antigravity
    if scope == "OWN":
        # Mágica: Filtra apenas clientes onde o representante é o usuário atual
        query = query.filter(models.Client.representative_id == user_id)
        
    return query.all()

@router.get("/clients/{client_id}", response_model=schemas.Client)
def get_client_details(
    client_id: int,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    client = db.query(models.Client).options(joinedload(models.Client.contacts)).filter(
        models.Client.id == client_id,
        models.Client.tenant_id == tenant_id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return client

@router.post("/clients", response_model=schemas.Client)
def create_client(
    client_in: schemas.ClientCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    # Processa address_data se existir
    addr_data = client_in.address_data or {}
    
    db_client = models.Client(
        name=client_in.name,
        trade_name=client_in.trade_name,
        cnpj=client_in.cnpj,
        tenant_id=tenant_id,
        # Mapeando address_data para campos planos
        city=addr_data.get('cidade'),
        state=addr_data.get('uf'),
        zip_code=addr_data.get('cep'),
        address=f"{addr_data.get('rua', '')}, {addr_data.get('numero', '')} - {addr_data.get('bairro', '')}"
    )
    
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

# --- CONTACTS ---

@router.post("/clients/{client_id}/contacts", response_model=schemas.Contact)
def create_contact(
    client_id: int,
    contact_in: schemas.ContactCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    # Verifica se cliente existe e pertence ao tenant
    client = db.query(models.Client).filter(models.Client.id == client_id, models.Client.tenant_id == tenant_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    db_contact = models.Contact(
        **contact_in.dict(),
        client_id=client_id
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@router.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: int,
    request: Request,
    db: Session = Depends(database.get_db)
):
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    
    # Validação simples de tenant via cliente
    if contact.client.tenant_id != request.state.tenant_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    db.delete(contact)
    db.commit()
    return {"ok": True}