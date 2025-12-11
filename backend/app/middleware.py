from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from .core.security import settings, jwt

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Rotas Públicas
        if request.url.path in ["/auth/token", "/auth/sysadmin/token", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # 2. Ler JWT
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Token ausente"})
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except Exception:
            return JSONResponse(status_code=401, content={"detail": "Token inválido"})

        # 3. Configurar State
        profile = payload.get("profile")
        tenant_slug = payload.get("tenant_slug")
        
        request.state.user_id = payload.get("sub_id")
        request.state.profile = profile

        if profile == 'sysadmin':
            request.state.tenant_schema = 'public'
            request.state.tenant_slug = None
        elif tenant_slug:
            # Sanitização básica
            if not tenant_slug.replace("-","").isalnum():
                return JSONResponse(status_code=400, content={"detail": "Slug inválido"})
            request.state.tenant_schema = f"tenant_{tenant_slug}"
            request.state.tenant_slug = tenant_slug
        else:
            request.state.tenant_schema = 'public'

        return await call_next(request)