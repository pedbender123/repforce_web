from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from .core.security import decode_access_token
from .core.config import settings
import jwt

# Rotas públicas (sem o prefixo /api/ e sem o endpoint de setup)
PUBLIC_ROUTES = [
    "/auth/token", 
    "/docs", 
    "/openapi.json"
]

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Pula a verificação para rotas públicas
        if any(request.url.path.startswith(route) for route in PUBLIC_ROUTES):
            response = await call_next(request)
            return response

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
        request.state.profile = payload.get("profile")

        if not request.state.user_id or not request.state.tenant_id or not request.state.profile:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token com dados incompletos."}
            )

        # Continua para o endpoint
        response = await call_next(request)
        return response