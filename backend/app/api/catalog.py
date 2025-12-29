from fastapi import APIRouter, Depends, Request, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
from ..db import session, models, models_crm, schemas
from typing import List, Optional
import os
import shutil

router = APIRouter()

UPLOAD_DIR_PRODUCTS = "/app/uploads/products"
STATIC_URL_PRODUCTS = "/uploads/products"

# --- PRODUTOS ---

@router.get("/products", response_model=List[schemas.Product])
def get_products(
    request: Request,
    db: Session = Depends(session.get_crm_db),
    search: str = ""
):
    tenant_id = request.state.tenant_id
    query = db.query(models_crm.Product).options(joinedload(models_crm.Product.supplier))
    
    if search:
        query = query.filter(models_crm.Product.name.ilike(f"%{search}%"))
        
    return query.all()

@router.get("/products/{product_id}", response_model=schemas.Product)
def get_product_details(
    product_id: int,
    request: Request,
    db: Session = Depends(session.get_crm_db)
):
    product = db.query(models_crm.Product).options(
        joinedload(models_crm.Product.supplier),
        joinedload(models_crm.Product.brand),
        joinedload(models_crm.Product.family),
        joinedload(models_crm.Product.type)
    ).filter(models_crm.Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return product

@router.post("/products", response_model=schemas.Product, status_code=201)
def create_product(
    request: Request,
    db: Session = Depends(session.get_crm_db),
    name: str = Form(...),
    price: float = Form(...),
    sku: Optional[str] = Form(None),
    cost_price: Optional[float] = Form(None),
    stock: Optional[int] = Form(0),
    supplier_id: Optional[int] = Form(None),
    custom_attributes: Optional[str] = Form("{}"), # JSON String
    image: Optional[UploadFile] = File(None)
):
    if request.state.profile not in ['admin', 'sysadmin']:
        raise HTTPException(status_code=403, detail="Apenas admins podem criar produtos")

    tenant_id = request.state.tenant_id
    
    # 1. Parse e Validação de Custom Fields
    import json
    from datetime import datetime
    
    try:
        attributes_data = json.loads(custom_attributes)
    except json.JSONDecodeError:
        attributes_data = {}

    # Busca configurações para validação
    configs = db.query(models_crm.CustomFieldConfig).filter(
        models_crm.CustomFieldConfig.entity == "product"
    ).all()

    for config in configs:
        if config.required and config.key not in attributes_data:
             raise HTTPException(status_code=400, detail=f"Campo obrigatório faltando: {config.label}")
        
        if config.key in attributes_data:
            val = attributes_data[config.key]
            # Validação simples de tipos
            if config.type == "number" and val is not None:
                try:
                    float(val)
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Campo {config.label} deve ser numérico")
    
    # 2. Upload Isolado (/uploads/{tenant_id}/products/)
    image_url = None
    if image:
        tenant_prod_dir = os.path.join(UPLOAD_DIR_PRODUCTS, str(tenant_id))
        os.makedirs(tenant_prod_dir, exist_ok=True)
        
        file_path = os.path.join(tenant_prod_dir, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # URL Pública precisa incluir o tenant_id
        # Main.py deve montar /uploads no path base, então URLs ficam:
        # /uploads/products/1/sapato.jpg (Necessário ajustar main.py ou STATIC_URL)
        # Vamos assumir que STATIC_URL_PRODUCTS aponta para o base, e aqui adicionamos o resto
        # Se STATIC_URL_PRODUCTS = "/uploads/products", então:
        image_url = f"{STATIC_URL_PRODUCTS}/{tenant_id}/{image.filename}"

    db_product = models_crm.Product(
        name=name,
        price=price,
        sku=sku,
        cost_price=cost_price,
        stock=stock,
        image_url=image_url,
        supplier_id=supplier_id,
        custom_attributes=attributes_data
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/products/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    request: Request,
    db: Session = Depends(session.get_crm_db),
    name: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    sku: Optional[str] = Form(None),
    cost_price: Optional[float] = Form(None),
    stock: Optional[int] = Form(None),
    supplier_id: Optional[int] = Form(None),
    custom_attributes: Optional[str] = Form(None), # JSON String
    image: Optional[UploadFile] = File(None)
):
    if request.state.profile not in ['admin', 'sysadmin']:
        raise HTTPException(status_code=403, detail="Apenas admins podem editar produtos")

    product = db.query(models_crm.Product).filter(models_crm.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Update Fields
    if name: product.name = name
    if price is not None: product.price = price
    if sku: product.sku = sku
    if cost_price is not None: product.cost_price = cost_price
    if stock is not None: product.stock = stock
    if supplier_id: product.supplier_id = supplier_id
    
    if custom_attributes:
        import json
        try:
            product.custom_attributes = json.loads(custom_attributes)
        except:
            pass # Ignore invalid JSON
    
    # Image Upload
    if image:
        tenant_id = request.state.tenant_id
        tenant_prod_dir = os.path.join(UPLOAD_DIR_PRODUCTS, str(tenant_id))
        os.makedirs(tenant_prod_dir, exist_ok=True)
        file_path = os.path.join(tenant_prod_dir, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        product.image_url = f"{STATIC_URL_PRODUCTS}/{tenant_id}/{image.filename}"

    db.commit()
    db.refresh(product)
    return product

# --- FORNECEDORES (NOVO) ---

@router.get("/suppliers", response_model=List[schemas.Supplier])
def get_suppliers(
    request: Request,
    db: Session = Depends(session.get_db)
):
    tenant_id = request.state.tenant_id
    suppliers = db.query(models_crm.Supplier).all()
    return suppliers

@router.post("/suppliers", response_model=schemas.Supplier, status_code=201)
def create_supplier(
    supplier: schemas.SupplierCreate,
    request: Request,
    db: Session = Depends(session.get_db)
):
    if request.state.profile not in ['admin', 'sysadmin']:
        raise HTTPException(status_code=403, detail="Apenas admins podem criar fornecedores")

    tenant_id = request.state.tenant_id
    
    db_supplier = models_crm.Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier