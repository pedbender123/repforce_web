from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db import database, models, schemas
from app.core import security, config

router = APIRouter()

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # Lógica simplificada: username deve ser único no sistema inteiro
    # Em produção real, o login deve pedir o tenant_slug explicitamente no form_data
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    tenant_slug = user.tenant.slug if user.tenant else None
    
    access_token = security.create_access_token(
        data={
            "sub": user.username,
            "sub_id": user.id,
            "profile": "sysadmin" if user.is_sysadmin else "user",
            "tenant_slug": tenant_slug
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/sysadmin/token")
def login_sysadmin(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # Endpoint exclusivo sysadmin
    return login(form_data, db)