from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from ..db import database, models, schemas
from typing import List

router = APIRouter()

# OBSERVE: Não filtramos mais por tenant_id nas queries, pois o schema garante o isolamento.

@router.get("/clients", response_model=List[schemas.Client])
def get_clients(
    request: Request,
    db: Session = Depends(database.get_db), # Conecta no schema do tenant
    skip: int = 0,
    limit: int = 100,
    search: str = ""
):
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
    db: Session = Depends(database.get_db)
):
    client_data = client.dict()
    if client.address_data:
        client_data['address_data'] = client.address_data.dict()

    # O representative_id é apenas um inteiro para nós agora (referência ao user do Core)
    db_client = models.Client(**client_data, representative_id=request.state.user_id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.get("/clients/{client_id}", response_model=schemas.Client)
def get_client_detail(client_id: int, db: Session = Depends(database.get_db)):
    db_client = db.query(models.Client).options(joinedload(models.Client.contacts)).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return db_client

# ... (Mantenha o resto das rotas de update/delete/contacts seguindo a mesma lógica: usando get_db e sem filtrar tenant_id)
@router.put("/clients/{client_id}", response_model=schemas.Client)
def update_client(client_id: int, client_update: schemas.ClientCreate, db: Session = Depends(database.get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
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

@router.post("/clients/{client_id}/contacts", response_model=schemas.Contact)
def create_contact(client_id: int, contact: schemas.ContactCreate, db: Session = Depends(database.get_db)):
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    db_contact = models.Contact(**contact.dict(), client_id=client_id)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(database.get_db)):
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    db.delete(contact)
    db.commit()
    return {"ok": True}