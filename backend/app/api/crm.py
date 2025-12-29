from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..db import session, models, models_tenant, schemas
from ..core.permissions import get_user_scope
from typing import List

router = APIRouter()

# --- CLIENTS ---

@router.get("/clients", response_model=List[schemas.Client])
def get_clients(
    request: Request,
    db: Session = Depends(session.get_crm_db)
):
    tenant_id = request.state.tenant_id
    user_id = request.state.user_id
    
    # 1. Pergunta ao Antigravity: "O que esse cara pode ver?"
    scope = get_user_scope(request)
    
    # 2. Query Base
    query = db.query(models_tenant.Client)
    
    # 3. Filtro Antigravity
    if scope == "OWN":
        # Mágica: Filtra apenas clientes onde o representante é o usuário atual
        query = query.filter(models_tenant.Client.representative_id == user_id)
        
    return query.all()

@router.get("/clients/{client_id}", response_model=schemas.Client)
def get_client_details(
    client_id: int,
    request: Request,
    db: Session = Depends(session.get_crm_db)
):
    tenant_id = request.state.tenant_id
    client = db.query(models_tenant.Client).options(joinedload(models_tenant.Client.contacts)).filter(
        models_tenant.Client.id == client_id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return client

@router.post("/products", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(session.get_crm_db)):
    db_product = models_tenant.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# --- CATALOG CONFIGURATION ---
@router.get("/brands", response_model=List[schemas.Brand])
def list_brands(db: Session = Depends(session.get_crm_db)):
    return db.query(models_tenant.Brand).all()

@router.post("/brands", response_model=schemas.Brand)
def create_brand(brand: schemas.BrandCreate, db: Session = Depends(session.get_crm_db)):
    db_brand = models_tenant.Brand(**brand.dict())
    db.add(db_brand)
    db.commit()
    db.refresh(db_brand)
    return db_brand

@router.get("/families", response_model=List[schemas.ProductFamily])
def list_families(db: Session = Depends(session.get_crm_db)):
    return db.query(models_tenant.ProductFamily).all()

@router.post("/families", response_model=schemas.ProductFamily)
def create_family(family: schemas.FamilyCreate, db: Session = Depends(session.get_crm_db)):
    db_item = models_tenant.ProductFamily(**family.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/types", response_model=List[schemas.ProductType])
def list_types(db: Session = Depends(session.get_crm_db)):
    return db.query(models_tenant.ProductType).all()

@router.post("/types", response_model=schemas.ProductType)
def create_type(item: schemas.TypeCreate, db: Session = Depends(session.get_crm_db)):
    db_item = models_tenant.ProductType(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# --- PRICING RULES ---
@router.get("/config/rules", response_model=List[schemas.DiscountRule])
def list_rules(db: Session = Depends(session.get_crm_db)):
    return db.query(models_tenant.DiscountRule).order_by(models_tenant.DiscountRule.priority.desc()).all()

@router.post("/config/rules", response_model=schemas.DiscountRule)
def create_rule(rule: schemas.DiscountRuleCreate, db: Session = Depends(session.get_crm_db)):
    try:
        db_rule = models_tenant.DiscountRule(**rule.dict())
        db.add(db_rule)
        db.commit()
        db.refresh(db_rule)
        return db_rule
    except Exception as e:
        print(f"ERROR creating pricing rule: {e}", flush=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.delete("/config/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(session.get_crm_db)):
    rule = db.query(models_tenant.DiscountRule).filter(models_tenant.DiscountRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"ok": True}

@router.post("/clients", response_model=schemas.Client)
def create_client(
    client_in: schemas.ClientCreate,
    request: Request,
    db: Session = Depends(session.get_crm_db)
):
    tenant_id = request.state.tenant_id
    
    # Processa address_data se existir
    addr_data = client_in.address_data or {}
    
    db_client = models_tenant.Client(
        name=client_in.name,
        fantasy_name=client_in.fantasy_name,
        trade_name=client_in.trade_name,
        cnpj=client_in.cnpj,
        email=client_in.email,
        phone=client_in.phone,
        representative_id=client_in.representative_id or request.state.user_id,
        custom_attributes=client_in.custom_attributes,
        # tenant_id desnecessário (schema isolado)
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
    db: Session = Depends(session.get_crm_db)
):
    tenant_id = request.state.tenant_id
    # Verifica se cliente existe e pertence ao tenant
    client = db.query(models_tenant.Client).filter(models_tenant.Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    db_contact = models_tenant.Contact(
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
    db: Session = Depends(session.get_crm_db)
):
    contact = db.query(models_tenant.Contact).filter(models_tenant.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    
    # Validação simples de tenant via cliente
    if contact.client.tenant_id != request.state.tenant_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    db.delete(contact)
    db.commit()
    return {"ok": True}