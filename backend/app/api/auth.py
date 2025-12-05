from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security

router = APIRouter()

# 1. Login SysAdmin
@router.post("/sysadmin/token", response_model=schemas.Token)
def sysadmin_login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(database.get_db) # Usa get_db padrão (public)
):
    # SysAdmin geralmente está no schema public, tenant_id null ou 1
    user = db.query(models.User).filter(
        models.User.username == username, 
        models.User.profile == 'sysadmin'
    ).first()
    
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais de SysAdmin inválidas")
    
    access_token = security.create_access_token(
        data={"sub": str(user.id), "profile": "sysadmin", "username": user.username}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# 2. Login Tenant (Usuário da Empresa)
@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    tenant_slug: str = Form(...), 
    username: str = Form(...),
    password: str = Form(...),
    remember_me: bool = Form(False),
    db: Session = Depends(database.get_db) # Usa get_db padrão (public)
):
    # Busca Tenant no Public
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
        
    if tenant.status != 'active':
        raise HTTPException(status_code=403, detail="Empresa inativa.")

    # Busca Usuário no Public (vinculado ao tenant)
    user = db.query(models.User).filter(
        models.User.username == username,
        models.User.tenant_id == tenant.id
    ).first()
        
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos.")
            
    # Gera Token com o SLUG para o Middleware saber qual schema usar nas próximas requests
    token_data = {
        "sub": str(user.id),
        "profile": user.profile,
        "username": user.username,
        "tenant_slug": tenant.slug 
    }
        
    access_token = security.create_access_token(data=token_data, remember_me=remember_me)
    return {"access_token": access_token, "token_type": "bearer"}