from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from .core.security import decode_access_token

PUBLIC_ROUTES = [
    "/api/auth/token", 
    "/api/auth/sysadmin/token", 
    "/docs", 
    "/openapi.json",
    "/redoc"
]
STATIC_PATH = "/uploads/"

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        
        # 1. Ignorar rotas públicas e estáticas
        if any(request.url.path.startswith(route) for route in PUBLIC_ROUTES) or \
           request.url.path.startswith(STATIC_PATH):
            return await call_next(request)

        # 2. Ler Header Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Credenciais não fornecidas."})

        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer": raise ValueError
        except ValueError:
            return JSONResponse(status_code=401, content={"detail": "Formato de token inválido."})

        # 3. Decodificar JWT
        payload = decode_access_token(token)
        if payload is None:
            return JSONResponse(status_code=401, content={"detail": "Token expirado ou inválido."})

        # 4. Extrair Contexto
        tenant_slug = payload.get("tenant_slug") # Pode ser None se for SysAdmin
        profile = payload.get("profile")

        request.state.user_id = payload.get("sub_id") # ID numérico do user
        request.state.username = payload.get("sub")
        request.state.profile = profile
        
        # 5. Definir o Schema do Banco
        if profile == 'sysadmin':
            # SysAdmin vive no Core (public)
            request.state.tenant_schema = 'public'
            request.state.tenant_slug = None
        
        elif tenant_slug:
            # Usuário de Tenant
            # Sanitização simples
            if not tenant_slug.replace("-","").isalnum():
                 return JSONResponse(status_code=400, content={"detail": "Tenant Slug inválido."})
            
            schema_name = f"tenant_{tenant_slug}"
            request.state.tenant_schema = schema_name
            request.state.tenant_slug = tenant_slug
        else:
             # Usuário autenticado mas sem contexto (ex: user novo sem tenant)
             # Default para public para evitar crash, mas com acesso restrito
             request.state.tenant_schema = 'public'

        response = await call_next(request)
        return response