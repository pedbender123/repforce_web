from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from typing import List
from .admin import check_admin_profile # Importa a dependência de verificação

router = APIRouter()

@router.post("/tenants", 
             response_model=schemas.Tenant, 
             status_code=201,
             dependencies=[Depends(check_admin_profile)]) # Protege o endpoint
def create_tenant(
    tenant: schemas.TenantCreate, # Modificado para usar o schema
    db: Session = Depends(database.get_db)
):
    """
    (SysAdmin) Cria uma nova Conta Mãe (Tenant).
    """
    # Verifica se o nome ou CNPJ já existe
    db_tenant_name = db.query(models.Tenant).filter(models.Tenant.name == tenant.name).first()
    if db_tenant_name:
        raise HTTPException(status_code=400, detail="Nome do Tenant já existe")
        
    if tenant.cnpj:
        db_tenant_cnpj = db.query(models.Tenant).filter(models.Tenant.cnpj == tenant.cnpj).first()
        if db_tenant_cnpj:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")

    new_tenant = models.Tenant(**tenant.dict())
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    return new_tenant

@router.get("/tenants", 
            response_model=List[schemas.Tenant],
            dependencies=[Depends(check_admin_profile)]) # Protege o endpoint
def get_tenants(db: Session = Depends(database.get_db)):
    """
    (SysAdmin) Lista todos os Tenants.
    """
    tenants = db.query(models.Tenant).all()
    return tenants