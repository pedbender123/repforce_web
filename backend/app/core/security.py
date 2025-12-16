from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, remember_me: bool = False):
    to_encode = data.copy()
    
    # Lógica de expiração robusta
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Se 'remember_me' for True, token dura 7 dias, senão 12 horas (padrão de trabalho)
        minutes = 10080 if remember_me else 720 # 7 dias ou 12h
        expire = datetime.utcnow() + timedelta(minutes=minutes)
        
    # Garante que 'exp' é um timestamp numérico (padrão JWT)
    to_encode.update({"exp": expire})
    
    # Garante que 'sub' é string
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt