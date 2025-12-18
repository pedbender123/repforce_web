from fastapi import APIRouter, Depends, Request, HTTPException, status, File, UploadFile, Form, Body, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from pydantic import EmailStr
from ..db import database, models, schemas
from ..core import security
from typing import List, Optional
import shutil
import os
import subprocess

UPLOAD_DIRECTORY = "/app/uploads/tenants"
STATIC_URL_PATH = "/uploads/tenants"

router = APIRouter()

def check_sysadmin_profile(request: Request):
    if request.state.role_name != 'sysadmin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a SysAdmins."
        )
    return True

def provision_tenant_schema(tenant_id: int):
    """
    Creates the tenant schema in the CRM database and runs Alembic migrations.
    """
    schema_name = f"tenant_{tenant_id}"
    try:
        # 1. Create Schema
        # Use engine_crm from database module
        with database.engine_crm.connect() as conn:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
            conn.commit()
        
        # 2. Run Migrations
        # Running alembic as a subprocess to ensure isolation and proper env loading
        # Assumption: Backend is the working directory
        cwd = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        cmd = [
            "alembic", "-c", "alembic_crm.ini",
            "-x", f"tenant_schema={schema_name}",
            "upgrade", "head"
        ]
        
        # In a real deployed environment, env vars are required for settings.
        # We assume they are present in the process environment.
        process = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
        
        if process.returncode != 0:
            print(f"Error provisioning tenant {tenant_id}: {process.stderr}")
            # Optional: Update tenant status to 'error' via a new DB session
            return

        print(f"Successfully provisioned schema {schema_name}")
        
    except Exception as e:
        print(f"Exception provisioning tenant {tenant_id}: {str(e)}")

# --- TENANTS ---

@router.post("/tenants", 
             response_model=schemas.Tenant, 
             status_code=201,
             dependencies=[Depends(check_sysadmin_profile)])
def create_tenant(
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    name: str = Form(...),
    cnpj: Optional[str] = Form(None),
    # Email e Phone removidos do Form pois não existem no model Tenant
    # Se quiser salvá-los, adicione ao model em models.py e aqui novamente
    status: Optional[str] = Form('active'), 
    tenant_type: Optional[str] = Form('industry'),
    commercial_info: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None)
):
    # Validações de duplicidade
    if db.query(models.Tenant).filter(models.Tenant.name == name).first():
        raise HTTPException(status_code=400, detail="Nome do Tenant já existe")
    if cnpj and db.query(models.Tenant).filter(models.Tenant.cnpj == cnpj).first():
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")

    # Upload Logo
    logo_url_to_save = None
    if logo:
        os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIRECTORY, logo.filename)
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(logo.file, buffer)
            logo_url_to_save = f"{STATIC_URL_PATH}/{logo.filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")
        finally:
            logo.file.close()

    # 1. Cria o Tenant (Status inicial provisioning ou active? O user pediu "Provisionando...")
    # Vamos setar como 'provisioning' se fosse async real, mas user pediu 'Processo lento/Async'
    # Manteremos 'active' por compatibilidade ou mudaremos? 
    # O user pediu "Frontend tela de provisionando.. polling". Então status deve refletir.
    initial_status = "provisioning"

    new_tenant = models.Tenant(
        name=name,
        cnpj=cnpj,
        status=initial_status,
        tenant_type=tenant_type,
        commercial_info=commercial_info,
        logo_url=logo_url_to_save
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    # 2. Criação Automática do Cargo "Admin" (Imediato)
    admin_role = models.Role(name="Admin", description="Administrador do Tenant", tenant_id=new_tenant.id)
    db.add(admin_role)
    db.commit()

    # 3. Provisionamento do Schema (Background)
    background_tasks.add_task(provision_tenant_schema, new_tenant.id)

    return new_tenant

@router.get("/tenants", 
            response_model=List[schemas.Tenant],
            dependencies=[Depends(check_sysadmin_profile)])
def get_tenants(db: Session = Depends(database.get_db)):
    return db.query(models.Tenant).order_by(models.Tenant.id).all()

class TenantUpdateStatus(schemas.TenantBase):
    status: str

@router.put("/tenants/{tenant_id}", 
            response_model=schemas.Tenant,
            dependencies=[Depends(check_sysadmin_profile)])
def update_tenant_status(
    tenant_id: int,
    tenant_update: TenantUpdateStatus,
    db: Session = Depends(database.get_db)
):
    db_tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not db_tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    db_tenant.status = tenant_update.status
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

# --- USERS (Gestão Global) ---

@router.post("/users", 
             response_model=schemas.User, 
             status_code=201, 
             dependencies=[Depends(check_sysadmin_profile)])
def create_sysadmin_user_entry(
    user: schemas.UserCreate,
    db: Session = Depends(database.get_db)
):
    """
    Cria usuários no sistema.
    """
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username já cadastrado")

    tenant_id = user.tenant_id
    role_id = None

    # Lógica de Tenant e Cargo
    if user.profile == 'sysadmin':
        sys_tenant = db.query(models.Tenant).filter(models.Tenant.name == "Systems").first()
        if not sys_tenant:
             raise HTTPException(status_code=500, detail="Tenant Systems não encontrado")
        tenant_id = sys_tenant.id
        role = db.query(models.Role).filter(models.Role.name == "Super Admin", models.Role.tenant_id == tenant_id).first()
        if role:
            role_id = role.id
            
    elif user.profile == 'admin':
        if not tenant_id:
            raise HTTPException(status_code=400, detail="Tenant ID obrigatório para Admin")
        
        # 1. Busca ou Cria o Cargo Admin
        admin_role = db.query(models.Role).filter(models.Role.name == "Admin", models.Role.tenant_id == tenant_id).first()
        if not admin_role:
            admin_role = models.Role(name="Admin", tenant_id=tenant_id)
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
        
        role_id = admin_role.id

        # 2. (IMPORTANTE) Atualiza o cargo Admin para ter acesso a TODAS as áreas do tenant
        # Isso garante que o admin criado possa ver algo ao logar
        tenant_areas = db.query(models.Area).filter(models.Area.tenant_id == tenant_id).all()
        # Limpa e reassocia para garantir
        admin_role.areas = tenant_areas
        db.commit()
    
        db.commit()
    
    # 3. Validação de Cargo (Role) Obrigatória
    # O sistema exige que todo usuário (exceto talvez em bootstrap) tenha um cargo vinculado.
    final_role_id = role_id or user.role_id
    
    if not final_role_id:
        raise HTTPException(
            status_code=400, 
            detail="É obrigatório vincular um Cargo (Role) ao criar o usuário."
        )

    hashed_password = security.get_password_hash(user.password)

    db_new_user = models.User(
        username=user.username,
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        profile=user.profile,
        tenant_id=tenant_id,
        role_id=final_role_id
    )
    
    db.add(db_new_user)
    db.commit()
    db.refresh(db_new_user)
    return db_new_user

@router.get("/all-users", 
            response_model=List[schemas.User], 
            dependencies=[Depends(check_sysadmin_profile)])
def get_all_users_in_system(db: Session = Depends(database.get_db)):
    users = db.query(models.User).options(joinedload(models.User.tenant), joinedload(models.User.role_obj)).order_by(models.User.id).all()
    return users

# --- AREAS ---

@router.get("/areas", response_model=List[schemas.Area], dependencies=[Depends(check_sysadmin_profile)])
def get_all_areas(db: Session = Depends(database.get_db), tenant_id: Optional[int] = None):
    query = db.query(models.Area)
    if tenant_id:
        query = query.filter(models.Area.tenant_id == tenant_id)
    return query.all()

@router.post("/areas", response_model=schemas.Area, status_code=201, dependencies=[Depends(check_sysadmin_profile)])
def create_area(
    area_in: schemas.AreaCreate,
    db: Session = Depends(database.get_db)
):
    db_area = models.Area(
        name=area_in.name,
        icon=area_in.icon,
        pages_json=[p.dict() for p in area_in.pages_json],
        tenant_id=area_in.tenant_id
    )
    db.add(db_area)
    db.commit()
    db.refresh(db_area)

    roles_to_add = set(area_in.allowed_role_ids)
    
    admin_role = db.query(models.Role).filter(models.Role.name == "Admin", models.Role.tenant_id == area_in.tenant_id).first()
    if admin_role:
        roles_to_add.add(admin_role.id)
    
    if roles_to_add:
        roles = db.query(models.Role).filter(models.Role.id.in_(roles_to_add)).all()
        for role in roles:
            role.areas.append(db_area)
        db.commit()

    return db_area

@router.get("/roles", response_model=List[schemas.Role], dependencies=[Depends(check_sysadmin_profile)])
def get_roles_by_tenant(tenant_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Role).filter(models.Role.tenant_id == tenant_id).all()