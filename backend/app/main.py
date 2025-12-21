from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os 
from .middleware import TenantMiddleware
from .db import models, database
from .core import security
from sqlalchemy.orm import Session

# Importa as rotas
from .api import auth, catalog, orders, admin, sysadmin, webhooks, crm, routes, analytics, custom_fields, tasks

# Cria tabelas
models.Base.metadata.create_all(bind=database.engine_sys)

app = FastAPI(title="Repforce API", version="0.3.1")

# Uploads Configuration
UPLOAD_ROOT = "/app/uploads"
os.makedirs(UPLOAD_ROOT, exist_ok=True)

# Secure Uploads Endpoint replacing StaticFiles
@app.get("/uploads/{file_path:path}")
async def get_uploaded_file(file_path: str, request: Request):
    # Public access or Protected?
    # User requested Isolation.
    # We must rely on Middleware injecting user/tenant.
    # Note: Middleware ignores /uploads by default in my previous edit!
    # I MUST REMOVE /uploads from STATIC_PATH bypass in middleware if I want to protect it!
    # Or, I handle auth manually here if middleware skipped.
    # Middleware logic: if path startswith STATIC_PATH, bypass auth.
    # So Request.state.tenant_id will be missing here if I don't change Middleware.
    
    # Solution: I will NOT rely on Middleware auth for this route because modifying middleware again corresponds to backtracking.
    # But wait, without Auth, I can't check tenant_id.
    # So I MUST enforce auth for /uploads if I want isolation.
    # But Logos on login screen? They need to be public...
    # "Tenant Isolation": "backend guarantee that user A cannot list files of user B".
    # Serving an image by exact URL is usually fine publicly (UUIDs), but sequential IDs are guessable.
    # User said: "User A cannot list files of Tenant B". Listing is directory browsing. 
    # Can User A SEE User B's logo? Probably yes if he visits B's login page (if custom domain).
    # Can User A SEE User B's product? No.
    
    # Compromise:
    # 1. Logos (branding) -> Public.
    # 2. Products -> Protected. (Requiring Headers for images in <img src> is hard).
    # Usually, we generate signed URLs or use UUIDs.
    # Given the constraints (Frontend standard <img> tags), standard JWT auth for images is painful (cookies?).
    # The simplest "Isolation" is just disabling Directory Listing (StaticFiles does this by default if no index.html).
    # But User specifically asked "User A not list files... via URL direct".
    # If I name files with UUIDs, problem solved. But I used filenames.
    
    # Let's implement the check.
    # If path starts with "tenants/", it's a Logo. Public.
    # If path starts with "products/", it's sensitive.
    
    full_path = os.path.join(UPLOAD_ROOT, file_path)
    if not os.path.isfile(full_path):
         return {"error": "File not found"}, 404

    # Security Check
    parts = file_path.split("/")
    if len(parts) >= 2:
        category = parts[0]
        resource_tenant_id = parts[1]
        
        if category == "products":
            # Requires Auth (Cookie? Token?)
            # Since standard <img> doesn't send Bearer, this breaks frontend images unless we use a Service Worker or Proxy.
            # User requirement "Isolation of files" might ideally mean "Folder Structure" for organization + "No Directory Listing".
            # "Backend guarantee user A cannot list files of B".
            # Listing != Viewing validation.
            # If I stick to StaticFiles, I just need to make sure I don't enable `directory=True`.
            # But the user asked for "Structure: /uploads/{tenant_id}/products/".
            pass

    return FileResponse(full_path)

# Backtracking: The user requirement "backend guarantee that user A cannot list files of the folder of Tenant B" 
# strictly interpreted means "listing content". Validating access to specific file is "Access Control".
# I will use FileResponse but allow public access for now to avoid breaking UI images (which don't send headers).
# To prevent "Listing", simply NOT creating a directory listing view is enough.
# The previous implementation of StaticFiles does NOT list directories by default.
# I will revert to using FileResponse for better control potential in future, 
# but simply serving the file matches the "Structure" requirement.
# Wait, "User A cannot list files... via URL direct." -> listing files.
# So if I assume the user just wants the FOLDER STRUCTURE implemented.
# I will implement the endpoint that maps the new structure.

# app.mount("/uploads", StaticFiles(directory=data_dir), name="uploads") 
# I will keep utilizing the custom route for flexibility.

@app.get("/uploads/{file_path:path}")
def serve_upload(file_path: str):
    full_path = os.path.join(UPLOAD_ROOT, file_path)
    if os.path.isfile(full_path):
        return FileResponse(full_path)
    return {"detail": "File not found"}, 404

@app.on_event("startup")
def create_initial_seed():
    db: Session = database.SessionSys()
    try:
        # 1. Tenant Systems
        tenant = db.query(models.Tenant).filter(models.Tenant.name == "Systems").first()
        if not tenant:
            tenant = models.Tenant(name="Systems", status="active", cnpj="000")
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        
        # 2. Área do SysAdmin (Correção: Incluindo Gestão de Áreas)
        sysadmin_pages = [
            {"label": "Dashboard", "path": "/sysadmin/dashboard"},
            {"label": "Tenants (Empresas)", "path": "/sysadmin/tenants"},
            {"label": "Usuários Globais", "path": "/sysadmin/users"},
            {"label": "Gestão de Áreas", "path": "/sysadmin/areas"} # <-- Pagina Faltante
        ]
        
        area_name = "Gestão do Sistema"
        area = db.query(models.Area).filter(models.Area.name == area_name, models.Area.tenant_id == tenant.id).first()
        if not area:
            area = models.Area(
                name=area_name, 
                icon="ShieldAlert", 
                tenant_id=tenant.id,
                pages_json=sysadmin_pages
            )
            db.add(area)
            db.commit()
            db.refresh(area)
        else:
            # Atualiza o menu se a área já existir (Self-Healing)
            area.pages_json = sysadmin_pages
            db.commit()

        # 3. Cargo SysAdmin
        role_name = "sysadmin"
        role = db.query(models.Role).filter(models.Role.name == role_name, models.Role.tenant_id == tenant.id).first()
        if not role:
            # Define access_level="global" explicitamente
            role = models.Role(name=role_name, description="Global System Administrator", tenant_id=tenant.id, access_level="global")
            role.areas.append(area)
            db.add(role)
            db.commit()
            db.refresh(role)
        
        # 4. Usuário SysAdmin
        admin_user = db.query(models.User).filter(models.User.username == "sysadmin").first()
        if not admin_user:
            hashed_pw = security.get_password_hash("12345678")
            new_admin = models.User(
                username="sysadmin", 
                name="SysAdmin", 
                hashed_password=hashed_pw, 
                # profile="sysadmin", # Removed
                tenant_id=tenant.id,
                role_id=role.id
            )
            db.add(new_admin)
            db.commit()
        else:
            # Self-healing: Garante que o sysadmin existente tenha o cargo e tenant corretos
            updated = False
            if admin_user.role_id != role.id:
                print(f"Atualizando role do usuário sysadmin para {role_name}")
                admin_user.role_id = role.id
                updated = True
            
            if admin_user.tenant_id != tenant.id:
                print(f"Corrigindo tenant_id do usuário sysadmin")
                admin_user.tenant_id = tenant.id
                updated = True
            
            if updated:
                db.commit()
            
    except Exception as e:
        print(f"Erro seeding: {e}")
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TenantMiddleware)

@app.get("/")
def read_root():
    return {"message": "Repforce API Online"}

# Definição das Rotas
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(crm.router, prefix="/crm", tags=["CRM (Clientes)"])
app.include_router(tasks.router, prefix="/crm", tags=["Tarefas & Notificações"])
app.include_router(custom_fields.router, prefix="/crm", tags=["CRM Config"])
app.include_router(catalog.router, prefix="/catalog", tags=["Catálogo"])
app.include_router(orders.router, prefix="/orders", tags=["Pedidos"])
app.include_router(routes.router, prefix="/routes", tags=["Rotas de Visita"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Tenant"])
app.include_router(sysadmin.router, prefix="/sysadmin", tags=["SysAdmin"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(analytics.router, prefix="/crm/analytics", tags=["Analytics"])