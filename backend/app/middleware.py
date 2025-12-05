from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from .core.security import decode_access_token
from .db.database import SessionLocal, text # Importa SessionLocal
from .db import models

PUBLIC_ROUTES = ["/auth/token", "/auth/sysadmin/token", "/docs", "/openapi.json"]
STATIC_PATH = "/uploads/"

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        
        if any(request.url.path.endswith(route) for route in PUBLIC_ROUTES) or \
           request.url.path.startswith(STATIC_PATH):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Token ausente."})

        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer": raise ValueError
        except ValueError:
            return JSONResponse(status_code=401, content={"detail": "Token malformado."})

        payload = decode_access_token(token)
        if payload is None:
            return JSONResponse(status_code=401, content={"detail": "Token inválido."})

        # --- LÓGICA DE SCHEMA ---
        tenant_slug = payload.get("tenant_slug")
        profile = payload.get("profile")

        request.state.user_id = payload.get("sub")
        request.state.profile = profile
        request.state.username = payload.get("username")
        
        # Se for SysAdmin, ele opera no schema 'public' (Core)
        if profile == 'sysadmin':
            request.state.tenant_schema = 'public'
        
        # Se for Usuário de Empresa, opera no schema dela
        elif tenant_slug:
            # Convenção: nome do schema é "tenant_" + slug (ex: tenant_nike)
            # Sanitização básica para evitar SQL Injection (slugs devem ser alfanuméricos)
            if not tenant_slug.isalnum():
                 return JSONResponse(status_code=400, content={"detail": "Slug inválido."})
            
            schema_name = f"tenant_{tenant_slug}"
            request.state.tenant_schema = schema_name
        else:
             return JSONResponse(status_code=403, content={"detail": "Sem contexto de Tenant."})

        response = await call_next(request)
        return response