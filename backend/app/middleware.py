from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from .core.security import decode_access_token
from .core.config import settings
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

        # Verifica o header de autorização
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