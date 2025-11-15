from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security

router = APIRouter()

def get_user_by_username(db: Session, username: str): # Mudou de email para username
    return db.query(models.User).filter(models.User.username == username).first()

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """
    Endpoint de login para 'admin' e 'representante'.
    Usa 'username' para autenticar.
    """
    user = get_user_by_username(db, username=form_data.username) # Usa username
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # --- SEPARAÇÃO DE LÓGICA ---
    # Este endpoint NÃO PODE logar 'sysadmin'
    if user.profile == 'sysadmin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Login de SysAdmin é em outra área",
        )
    
    token_data = {
        "sub": str(user.id), 
        "profile": user.profile,
        "tenant_id": user.tenant_id,
        "username": user.username # Adiciona o username
    }
    access_token = security.create_access_token(data=token_data)
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- NOVO ENDPOINT DE LOGIN DO SYSADMIN ---
@router.post("/sysadmin/token", response_model=schemas.Token)
def sysadmin_login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """
    Endpoint de login exclusivo para 'sysadmin'.
    Usa 'username' para autenticar.
    """
    user = get_user_by_username(db, username=form_data.username) # Usa username
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # --- SEPARAÇÃO DE LÓGICA ---
    # Este endpoint SÓ PODE logar 'sysadmin'
    if user.profile != 'sysadmin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Esta área é restrita.",
        )
    
    token_data = {
        "sub": str(user.id), 
        "profile": user.profile,
        "tenant_id": user.tenant_id,
        "username": user.username
    }
    access_token = security.create_access_token(data=token_data)
    
    return {"access_token": access_token, "token_type": "bearer"}
# --- FIM DO NOVO ENDPOINT ---


@router.get("/users/me", response_model=schemas.User)
def read_users_me(request: Request, db: Session = Depends(database.get_db)):
    """
    Retorna os dados do usuário logado (usando o token injetado pelo middleware).
    """
    user_id = request.state.user_id
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return user