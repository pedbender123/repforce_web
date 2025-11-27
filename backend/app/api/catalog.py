from fastapi import APIRouter, Depends, Request, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
from ..db import database, models, schemas
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
    db: Session = Depends(database.get_db),
    search: str = ""
):
    tenant_id = request.state.tenant_id
    query = db.query(models.Product).options(joinedload(models.Product.supplier)).filter(models.Product.tenant_id == tenant_id)
    
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))
        
    return query.all()

@router.post("/products", response_model=schemas.Product, status_code=201)
def create_product(
    request: Request,
    db: Session = Depends(database.get_db),
    name: str = Form(...),
    price: float = Form(...),
    sku: Optional[str] = Form(None),
    cost_price: Optional[float] = Form(None),
    stock: Optional[int] = Form(0),
    supplier_id: Optional[int] = Form(None), # NOVO
    image: Optional[UploadFile] = File(None)
):
    if request.state.profile not in ['admin', 'sysadmin']:
        raise HTTPException(status_code=403, detail="Apenas admins podem criar produtos")

    tenant_id = request.state.tenant_id
    
    image_url = None
    if image:
        os.makedirs(UPLOAD_DIR_PRODUCTS, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR_PRODUCTS, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"{STATIC_URL_PRODUCTS}/{image.filename}"

    db_product = models.Product(
        name=name,
        price=price,
        sku=sku,
        cost_price=cost_price,
        stock=stock,
        image_url=image_url,
        supplier_id=supplier_id, # NOVO
        tenant_id=tenant_id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# --- FORNECEDORES (NOVO) ---

@router.get("/suppliers", response_model=List[schemas.Supplier])
def get_suppliers(
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    suppliers = db.query(models.Supplier).filter(models.Supplier.tenant_id == tenant_id).all()
    return suppliers

@router.post("/suppliers", response_model=schemas.Supplier, status_code=201)
def create_supplier(
    supplier: schemas.SupplierCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    if request.state.profile not in ['admin', 'sysadmin']:
        raise HTTPException(status_code=403, detail="Apenas admins podem criar fornecedores")

    tenant_id = request.state.tenant_id
    
    db_supplier = models.Supplier(**supplier.dict(), tenant_id=tenant_id)
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier