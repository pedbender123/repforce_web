from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from .core.security import decode_access_token
from .db.database import GlobalSessionLocal
from .db import models

PUBLIC_ROUTES = [
    "/auth/token",
    "/auth/sysadmin/token",
    "/docs",
    "/openapi.json"
]
STATIC_PATH = "/uploads/"

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        
        if any(request.url.path.endswith(route) for route in PUBLIC_ROUTES) or \
           request.url.path.startswith(STATIC_PATH):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Token não fornecido."})

        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer": raise ValueError
        except ValueError:
            return JSONResponse(status_code=401, content={"detail": "Formato de token inválido."})

        payload = decode_access_token(token)
        if payload is None:
            return JSONResponse(status_code=401, content={"detail": "Token inválido ou expirado."})

        # --- LÓGICA DE MULTI-TENANCY ---
        tenant_slug = payload.get("tenant_slug")
        profile = payload.get("profile")

        request.state.user_id = payload.get("sub")
        request.state.profile = profile
        request.state.username = payload.get("username")
        
        # Se for SysAdmin, não precisa conectar em banco de tenant
        if profile == 'sysadmin':
            request.state.tenant_db_url = None
        
        # Se for usuário de Tenant, precisamos buscar a Connection String
        elif tenant_slug:
            # Conecta no Global RAPIDAMENTE apenas para buscar a string do tenant
            # Nota: Em produção, usaríamos Redis para cachear essa string e evitar hit no DB Global
            global_db = GlobalSessionLocal()
            try:
                tenant = global_db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
                if not tenant:
                    return JSONResponse(status_code=404, content={"detail": "Tenant não encontrado ou desativado."})
                
                # INJETA A URL PARA O GET_DB USAR DEPOIS
                request.state.tenant_db_url = tenant.db_connection_string
            finally:
                global_db.close()
        else:
             return JSONResponse(status_code=403, content={"detail": "Token sem identificação de Tenant."})

        response = await call_next(request)
        return response