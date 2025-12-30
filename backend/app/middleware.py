from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from .core.security import decode_access_token
from .db.session import SessionSys
from .db import models_system
import os

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

        # 1. API Key Auth (Service/N8N)
        api_key = request.headers.get("X-API-Key")
        if api_key:
            db = SessionSys()
            try:
                key_record = db.query(models_system.ApiKey).filter(
                    models_system.ApiKey.key == api_key,
                    models_system.ApiKey.is_active == True
                ).first()
                
                if key_record:
                    # Resolve Slug
                    tenant = db.query(models_system.Tenant).filter(models_system.Tenant.id == key_record.tenant_id).first()
                    if not tenant:
                         return JSONResponse(status_code=404, content={"detail": "Tenant not found for this API Key"})
                    
                    # Inject State
                    request.state.tenant_slug = tenant.slug
                    request.state.user_id = 0 # System
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
                    user_id = int(payload.get("sub"))
                    request.state.user_id = user_id
                    
                    # SysAdmin Global Flag (SysAdmin / Superuser)
                    print(f"DEBUG MIDDLEWARE: Payload={payload}", flush=True)
                    if payload.get("is_superuser") or payload.get("is_sysadmin"):
                         print("DEBUG MIDDLEWARE: User is SysAdmin", flush=True)
                         request.state.is_sysadmin = True
                         request.state.role_name = "sysadmin"
            except Exception as e:
                print(f"JWT Error: {e}")

        # 3. Tenant Context Validation
        # Check if X-Tenant-Slug header is present
        slug = request.headers.get("X-Tenant-Slug")
        if slug:
            db = SessionSys()
            try:
                tenant = db.query(models_system.Tenant).filter(models_system.Tenant.slug == slug).first()
                if not tenant:
                    return JSONResponse(status_code=404, content={"detail": "Tenant Not Found"})
                
                # Verify Membership
                # SysAdmin bypass?
                is_sysadmin = payload.get("is_sysadmin", False)
                if is_sysadmin:
                    request.state.role_name = "sysadmin" # Explicitly set for check_sysadmin dependency
                    pass # Allow
                else:
                    membership = db.query(models_system.Membership).filter(
                        models_system.Membership.user_id == user_id,
                        models_system.Membership.tenant_id == tenant.id
                    ).first()
                    
                    if not membership:
                        # DEBUG: Return payload in error to diagnose
                        return JSONResponse(status_code=403, content={
                            "detail": f"Access to this tenant denied. ID={user_id}, SysAdmin={payload.get('is_sysadmin')}, Payload={payload}"
                        })
                
                request.state.tenant_slug = slug
                request.state.tenant_id = tenant.id
                
            finally:
                db.close()
        
        return await call_next(request)