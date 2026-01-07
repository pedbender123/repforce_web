from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.shared.security import decode_access_token
from app.shared.database import SessionSys
from app.system import models as models_system
import os

PUBLIC_ROUTES = [
    "/auth/login",
    "/auth/token",
    "/auth/sysadmin/token",
    "/docs",
    "/openapi.json"
]

STATIC_PATH = "/uploads/"

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Initialize state to avoid AttributeError
        request.state.tenant_id = None
        request.state.tenant_slug = None
        request.state.role_name = None

        if any(request.url.path.endswith(route) for route in PUBLIC_ROUTES) or \
           request.url.path.startswith(STATIC_PATH):
            return await call_next(request)

        # 1. API Key Auth (Service/N8N)
        api_key = request.headers.get("X-API-Key")
        if api_key:
            db = SessionSys()
            try:
                # Ensure we are in public schema for global keys
                key_record = db.query(models_system.ApiKey).filter(
                    models_system.ApiKey.key == api_key,
                    models_system.ApiKey.is_active == True
                ).first()
                
                if key_record:
                    tenant = db.query(models_system.Tenant).filter(models_system.Tenant.id == key_record.tenant_id).first()
                    if not tenant:
                         return JSONResponse(status_code=404, content={"detail": "Tenant not found for this API Key"})
                    
                    request.state.tenant_slug = tenant.slug
                    request.state.tenant_id = tenant.id
                    request.state.user_id = 0 # System/Service
                    request.state.is_sysadmin = True
                    return await call_next(request)
                else:
                    return JSONResponse(status_code=401, content={"detail": "Invalid API Key"})
            finally:
                db.close()

        # 2. JWT Auth
        auth_header = request.headers.get("Authorization")
        payload = {}
        user_id = None
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = decode_access_token(token)
                if payload:
                    user_id = payload.get("sub")
                    request.state.user_id = user_id
                    request.state.is_sysadmin = bool(payload.get("is_superuser") or payload.get("is_sysadmin"))
                    if request.state.is_sysadmin:
                        request.state.role_name = "sysadmin"
            except Exception as e:
                print(f"JWT Error: {e}")

        # 3. Tenant Context Identification
        slug = request.headers.get("X-Tenant-Slug")
        
        # If no slug header but authenticated user, try to auto-resolve their only tenant
        if not slug and user_id and not getattr(request.state, "is_sysadmin", False):
            db = SessionSys()
            try:
                # Get the only membership
                membership = db.query(models_system.Membership).filter(
                    models_system.Membership.user_id == user_id
                ).first()
                if membership:
                    slug = membership.tenant.slug
            finally:
                db.close()

        if slug:
            db = SessionSys()
            try:
                tenant = db.query(models_system.Tenant).filter(models_system.Tenant.slug == slug).first()
                if not tenant:
                    return JSONResponse(status_code=404, content={"detail": f"Tenant '{slug}' Not Found"})
                
                # Check Membership if not sysadmin
                if not getattr(request.state, "is_sysadmin", False):
                    membership = db.query(models_system.Membership).filter(
                        models_system.Membership.user_id == user_id,
                        models_system.Membership.tenant_id == tenant.id
                    ).first()
                    
                    if not membership:
                        return JSONResponse(status_code=403, content={"detail": "Access to this tenant denied."})
                    request.state.role_name = membership.role

                request.state.tenant_slug = slug
                request.state.tenant_id = tenant.id
                # Fix: Inject Schema Name for SchemaManager (Builder Context)
                request.state.tenant_schema = f"tenant_{slug.replace('-', '_')}"
                
            finally:
                db.close()
        
        return await call_next(request)