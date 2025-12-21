from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from .core.security import decode_access_token
from .core.config import settings
from .db.database import SessionLocal
from .db import models
from sqlalchemy import text
import jwt

# Rotas públicas (sem o prefixo /api/)
PUBLIC_ROUTES = [
    "/auth/token", 
    "/auth/sysadmin/token", # <-- ROTA DE LOGIN SYSADMIN
    "/docs", 
    "/openapi.json"
]

# --- NOVO: Caminho estático para uploads ---
# Esta rota também não precisa de autenticação
STATIC_PATH = "/uploads/"

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        
        # --- MUDANÇA: Ignora rotas públicas E rotas de upload ---
        if any(request.url.path.endswith(route) for route in PUBLIC_ROUTES) or \
           request.url.path.startswith(STATIC_PATH):
            response = await call_next(request)
            return response
        # --- FIM DA MUDANÇA ---

        # 1. Check API Key (Service Account / n8n)
        api_key = request.headers.get("X-API-Key")
        if api_key:
            try:
                # Open a sync session to check key (Middleware is async, but DB access here is quick)
                db = SessionLocal()
                try:
                    # Query system DB
                    key_record = db.query(models.ApiKey).filter(
                        models.ApiKey.key == api_key,
                        models.ApiKey.is_active == True
                    ).first()

                    if key_record:
                        # Valid Key
                        request.state.tenant_id = key_record.tenant_id
                        request.state.user_id = 0 # Service Account ID
                        request.state.role_name = "ServiceAccount"
                        request.state.username = key_record.name 
                        request.state.profile = "sysadmin" # Give full access to CRM routes? Or needs specific?
                        # Note: 'profile' controls frontend nav, but backend relies on tenant_id + role access.
                        # For n8n (CRM manipulation), we treat it as an Admin of that tenant.
                        
                        # Continue without checking JWT
                        response = await call_next(request)
                        return response
                    else:
                         return JSONResponse(status_code=401, content={"detail": "API Key inválida."})
                finally:
                    db.close()
            except Exception as e:
                print(f"Error checking API Key: {e}")
                return JSONResponse(status_code=500, content={"detail": "Erro interno de autenticação."})

        # 2. Standard JWT Authentication (Human Users)
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token de autenticação não fornecido."}
            )

        # Extrai o token
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise ValueError
        except ValueError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Formato de autorização inválido. Use 'Bearer <token>'."}
            )

        # Decodifica o token e extrai o payload
        payload = decode_access_token(token)
        if payload is None:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token inválido ou expirado."}
            )

        # Injeta os dados do payload no estado da requisição
        request.state.user_id = payload.get("sub")
        request.state.tenant_id = payload.get("tenant_id")
        request.state.role_name = payload.get("role_name")
        request.state.username = payload.get("username")
        request.state.profile = payload.get("profile")

        if not request.state.user_id or not request.state.tenant_id:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token com dados incompletos."}
            )

        # Continua para o endpoint
        response = await call_next(request)
        return response