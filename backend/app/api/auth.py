from fastapi import APIRouter, Depends, HTTPException, status, Request # <-- 'Request' FOI ADICIONADO AQUI
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security

router = APIRouter()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """
    Endpoint de login (WF I.1). Recebe email (username) e senha.
    """
    # 1. Valida o usuário
    user = get_user_by_email(db, email=form_data.username)
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 2. Cria o token JWT com os dados necessários
    token_data = {
        "sub": str(user.id), # 'sub' (subject) é o ID do usuário
        "profile": user.profile,
        "tenant_id": user.tenant_id
    }
    access_token = security.create_access_token(data=token_data)
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.User)
def read_users_me(request: Request, db: Session = Depends(database.get_db)):
    """
    Retorna os dados do usuário logado (usando o token injetado pelo middleware).
    """
    # O middleware já validou o token e injetou os dados no 'request.state'
    user_id = request.state.user_id
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return user