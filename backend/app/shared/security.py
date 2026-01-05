from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from fastapi import Header, HTTPException, status
from app.core.config import settings

# Configuração do contexto de criptografia (BCrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Algoritmo padrão para JWT
ALGORITHM = "HS256"

def verify_password(plain_password, hashed_password):
    """Verifica se a senha em texto plano corresponde ao hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Gera o hash da senha."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, remember_me: bool = False):
    """
    Cria um token JWT de acesso.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Se 'remember_me' for True, expira em 7 dias, senão em 12 horas
        minutes = 10080 if remember_me else 720
        expire = datetime.utcnow() + timedelta(minutes=minutes)
        
    to_encode.update({"exp": expire})
    
    # Garante que 'sub' seja string para compatibilidade
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """
    Decodifica um token JWT e retorna o payload.
    Retorna None se o token for inválido ou expirado.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_api_key(x_api_key: str = Header(None)):
    """
    Valida a chave de API via Header (para Webhooks e integrações).
    """
    # Em produção, isso deve vir de variáveis de ambiente
    # Ex: API_KEY_CREDENTIAL = settings.WEBHOOK_API_KEY
    API_KEY_CREDENTIAL = "sua-chave-secreta-webhook" 
    
    if x_api_key != API_KEY_CREDENTIAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Credenciais de API inválidas",
        )
    return x_api_key