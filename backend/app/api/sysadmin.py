from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from typing import List

router = APIRouter()

# NOTA: Esta API deve ser protegida por um token de Super Admin
# A lógica de verificação (ex: API Key) foi omitida por simplicidade.

@router.post("/tenants", response_model=schemas.Tenant, status_code=201)
def create_tenant(
    tenant_name: str, # Simplificado, idealmente um schema
    db: Session = Depends(database.get_db)
):
    """
    (SysAdmin) Cria uma nova Conta Mãe (Tenant).
    """
    # Verifica se o nome já existe
    db_tenant = db.query(models.Tenant).filter(models.Tenant.name == tenant_name).first()
    if db_tenant:
        raise HTTPException(status_code=400, detail="Nome do Tenant já existe")
        
    new_tenant = models.Tenant(name=tenant_name)
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    return new_tenant

@router.get("/tenants", response_model=List[schemas.Tenant])
def get_tenants(db: Session = Depends(database.get_db)):
    """
    (SysAdmin) Lista todos os Tenants.
    """
    tenants = db.query(models.Tenant).all()
    return tenants