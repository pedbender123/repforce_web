from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from typing import List

router = APIRouter()

@router.get("/products", response_model=List[schemas.Product])
def get_products(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Lista todos os produtos (filtrados pelo tenant_id do token).
    """
    tenant_id = request.state.tenant_id
    products = db.query(models.Product).filter(models.Product.tenant_id == tenant_id).all()
    return products

@router.get("/products/{product_id}", response_model=schemas.Product)
def get_product(
    product_id: int,
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Busca um produto específico (verificando o tenant_id).
    """
    tenant_id = request.state.tenant_id
    
    db_product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.tenant_id == tenant_id
    ).first()
    
    if db_product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado ou não pertence a este tenant")
        
    return db_product