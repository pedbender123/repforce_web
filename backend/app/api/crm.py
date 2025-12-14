from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from ..db import database, models, schemas
from typing import List

router = APIRouter()

# --- Clientes ---

@router.get("/clients", response_model=List[schemas.Client])
def get_clients(
    request: Request,
    db: Session = Depends(database.get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = ""
):
    tenant_id = request.state.tenant_id
    query = db.query(models.Client).filter(models.Client.tenant_id == tenant_id)
    
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
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    client_data = client.dict()
    # Garante que address_data seja salvo como dict/JSON
    if client.address_data:
        client_data['address_data'] = client.address_data.dict()

    db_client = models.Client(**client_data, tenant_id=tenant_id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.get("/clients/{client_id}", response_model=schemas.Client)
def get_client_detail(
    client_id: int,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    # Eager load para trazer contatos
    db_client = db.query(models.Client).options(joinedload(models.Client.contacts)).filter(
        models.Client.id == client_id,
        models.Client.tenant_id == tenant_id
    ).first()
    
    if db_client is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
        
    return db_client

@router.put("/clients/{client_id}", response_model=schemas.Client)
def update_client(
    client_id: int,
    client_update: schemas.ClientCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    db_client = db.query(models.Client).filter(models.Client.id == client_id, models.Client.tenant_id == tenant_id).first()
    
    if not db_client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    update_data = client_update.dict(exclude_unset=True)
    if 'address_data' in update_data and update_data['address_data']:
         update_data['address_data'] = update_data['address_data']
         
    for key, value in update_data.items():
        setattr(db_client, key, value)

    db.commit()
    db.refresh(db_client)
    return db_client

# --- Contatos ---

@router.post("/clients/{client_id}/contacts", response_model=schemas.Contact)
def create_contact(
    client_id: int,
    contact: schemas.ContactCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    client = db.query(models.Client).filter(models.Client.id == client_id, models.Client.tenant_id == tenant_id).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    db_contact = models.Contact(**contact.dict(), client_id=client_id)
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
    tenant_id = request.state.tenant_id
    # Garante que só deleta contato do próprio tenant
    contact = db.query(models.Contact).join(models.Client).filter(
        models.Contact.id == contact_id,
        models.Client.tenant_id == tenant_id
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
        
    db.delete(contact)
    db.commit()
    return {"ok": True}