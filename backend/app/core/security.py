from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt, JWTError
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
        # Se 'remember_me' for True, token dura 7 dias, senão 12 horas
        minutes = 10080 if remember_me else 720 
        expire = datetime.utcnow() + timedelta(minutes=minutes)
        
    to_encode.update({"exp": expire})
    
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- FUNÇÃO QUE FALTAVA ---
def decode_access_token(token: str):
    """
    Decodifica o token JWT e retorna o payload.
    Lança JWTError se o token for inválido ou expirado.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None