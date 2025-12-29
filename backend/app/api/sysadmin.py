from fastapi import APIRouter, Depends, Request, HTTPException, status, File, UploadFile, Form, Body, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from pydantic import EmailStr
from ..db import session, models_system, schemas
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

def provision_tenant_schema(tenant_id: int, tenant_name: str, tenant_cnpj: str, tenant_type: str):
    """
    Creates the tenant schema in the CRM database, runs migrations, and seeds initial data.
    """
    schema_name = f"tenant_{tenant_id}"
    try:
        # 1. Create Schema
        # Use engine_crm from database module
        with session.engine_crm.connect() as conn:
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

        # 3. Seed Initial Data (Supplier for Industry)
        if tenant_type == 'industry':
            try:
                with session.engine_crm.connect() as conn:
                    # Set search path to tenant schema
                    conn.execute(text(f"SET search_path TO {schema_name}"))
                    
                    # Insert Supplier
                    insert_query = text("""
                        INSERT INTO suppliers (name, cnpj, email, phone) 
                        VALUES (:name, :cnpj, :email, :phone)
                    """)
                    conn.execute(insert_query, {
                        "name": tenant_name,
                        "cnpj": tenant_cnpj,
                        "email": None, # Could pass this if available
                        "phone": None
                    })
                    conn.commit()
                    print(f"Seeded initial supplier for tenant {tenant_id}")
            except Exception as seed_error:
                 print(f"Error seeding supplier for tenant {tenant_id}: {seed_error}")
        
    except Exception as e:
        print(f"Exception provisioning tenant {tenant_id}: {str(e)}")

# --- TENANTS ---

@router.post("/tenants", 
             response_model=schemas.Tenant, 
             status_code=201,
             dependencies=[Depends(check_sysadmin_profile)])
def create_tenant(
    background_tasks: BackgroundTasks,
    db: Session = Depends(session.get_db),
    name: str = Form(...),
    cnpj: Optional[str] = Form(None),
    # Email e Phone removidos do Form pois não existem no model Tenant
    # Se quiser salvá-los, adicione ao model em models.py e aqui novamente
    status: Optional[str] = Form('active'), 
    tenant_type: Optional[str] = Form('industry'),
    commercial_info: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None)
):
    # 1. Cria o Tenant (Status inicial provisioning)
    initial_status = "provisioning"
    new_tenant = models_system.Tenant(
        name=name,
        cnpj=cnpj,
        status=initial_status,
        tenant_type=tenant_type,
        commercial_info=commercial_info,
        logo_url=None # Will update after ID generation
    )
    
    try:
        db.add(new_tenant)
        db.commit()
        db.refresh(new_tenant)
        
        # 2. Upload Logo (Agora com ID)
        if logo:
            # Isolamento por Tenant: /app/uploads/tenants/{id}/
            tenant_upload_dir = os.path.join(UPLOAD_DIRECTORY, str(new_tenant.id))
            os.makedirs(tenant_upload_dir, exist_ok=True)
            
            file_path = os.path.join(tenant_upload_dir, logo.filename)
            try:
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(logo.file, buffer)
                
                # Update DB with URL
                # URL pública: /uploads/tenants/{id}/{filename}
                # Mapeado no main.py (Necessário ajustar mount point lá se quiser acesso público ou rota protegida)
                new_tenant.logo_url = f"{STATIC_URL_PATH}/{new_tenant.id}/{logo.filename}"
                db.commit()
            except Exception as e:
                print(f"Erro ao salvar logo: {e}")
                # Não falha o provisionamento por causa do logo, apenas loga.

        # 3. Criação Automática do Cargo "Admin" (Imediato)
        admin_role = models_system.Role(name="Admin", description="Administrador do Tenant", tenant_id=new_tenant.id)
        db.add(admin_role)
        db.commit()

        # 4. Provisionamento do Schema (Background)
        background_tasks.add_task(provision_tenant_schema, new_tenant.id, new_tenant.name, new_tenant.cnpj, new_tenant.tenant_type)

        return new_tenant

    except Exception as e:
        # Rollback: Remove o tenant se falhar na criação síncrona
        db.rollback()
        if new_tenant.id:
            try:
                db.delete(new_tenant)
                db.commit()
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Erro ao criar Tenant: {str(e)}")

@router.get("/tenants", 
            response_model=List[schemas.Tenant],
            dependencies=[Depends(check_sysadmin_profile)])
def get_tenants(db: Session = Depends(session.get_db)):
    return db.query(models_system.Tenant).order_by(models_system.Tenant.id).all()

@router.put("/tenants/{tenant_id}", 
            response_model=schemas.Tenant,
            dependencies=[Depends(check_sysadmin_profile)])
def update_tenant(
    tenant_id: int,
    tenant_update: schemas.TenantUpdate,
    db: Session = Depends(session.get_db)
):
    db_tenant = db.query(models_system.Tenant).filter(models_system.Tenant.id == tenant_id).first()
    if not db_tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    update_data = tenant_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tenant, key, value)
    
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

@router.delete("/tenants/{tenant_id}", 
               status_code=204,
               dependencies=[Depends(check_sysadmin_profile)])
def delete_tenant(
    tenant_id: int,
    db: Session = Depends(session.get_db)
):
    db_tenant = db.query(models_system.Tenant).filter(models_system.Tenant.id == tenant_id).first()
    if not db_tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    if db_tenant.name == "Systems":
        raise HTTPException(status_code=400, detail="Não é permitido remover o tenant do sistema.")

    db.delete(db_tenant)
    db.commit()
    return None

# --- USERS (Gestão Global) ---

@router.post("/users", 
             response_model=schemas.User, 
             status_code=201, 
             dependencies=[Depends(check_sysadmin_profile)])
def create_sysadmin_user_entry(
    user: schemas.UserCreate,
    db: Session = Depends(session.get_db)
):
    """
    Cria usuários no sistema.
    """
    if db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username já cadastrado")

    tenant_id = user.tenant_id
    role_id = None

    # Lógica de Tenant e Cargo
    if user.profile == 'sysadmin':
        sys_tenant = db.query(models_system.Tenant).filter(models_system.Tenant.name == "Systems").first()
        if not sys_tenant:
             raise HTTPException(status_code=500, detail="Tenant Systems não encontrado")
        tenant_id = sys_tenant.id
        role = db.query(models_system.Role).filter(models_system.Role.name == "Super Admin", models_system.Role.tenant_id == tenant_id).first()
        if role:
            role_id = role.id
            
    elif user.profile == 'admin':
        if not tenant_id:
            raise HTTPException(status_code=400, detail="Tenant ID obrigatório para Admin")
        
        # 1. Busca ou Cria o Cargo Admin
        admin_role = db.query(models_system.Role).filter(models_system.Role.name == "Admin", models_system.Role.tenant_id == tenant_id).first()
        if not admin_role:
            admin_role = models_system.Role(name="Admin", tenant_id=tenant_id)
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
        
        role_id = admin_role.id

        # 2. (REMOVIDO) Não atualiza mais o cargo Admin automaticamente com todas as áreas.
        # O Admin deve começar sem áreas, conforme solicitado.
        # tenant_areas = db.query(models_system.Area).filter(models_system.Area.tenant_id == tenant_id).all()
        # admin_role.areas = tenant_areas
        pass
    
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

    db_new_user = models_system.GlobalUser(
        username=user.username,
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        # profile=user.profile, # Removed from model
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
def get_all_users_in_system(db: Session = Depends(session.get_db)):
    users = db.query(models_system.GlobalUser).options(joinedload(models_system.GlobalUser.tenant), joinedload(models_system.GlobalUser.role_obj)).order_by(models_system.GlobalUser.id).all()
    return users

# --- AREAS ---

@router.get("/areas", response_model=List[schemas.Area], dependencies=[Depends(check_sysadmin_profile)])
def get_all_areas(db: Session = Depends(session.get_db), tenant_id: Optional[int] = None):
    query = db.query(models_system.Area)
    if tenant_id:
        query = query.filter(models_system.Area.tenant_id == tenant_id)
    return query.all()

@router.post("/areas", response_model=schemas.Area, status_code=201, dependencies=[Depends(check_sysadmin_profile)])
def create_area(
    area_in: schemas.AreaCreate,
    db: Session = Depends(session.get_db)
):
    db_area = models_system.Area(
        name=area_in.name,
        icon=area_in.icon,
        pages_json=[p.dict() for p in area_in.pages_json],
        tenant_id=area_in.tenant_id
    )
    db.add(db_area)
    db.commit()
    db.refresh(db_area)

    roles_to_add = set(area_in.allowed_role_ids)
    
    # (REMOVIDO) Não adiciona mais a nova área ao cargo Admin automaticamente.
    # admin_role = db.query(models_system.Role).filter(models_system.Role.name == "Admin", models_system.Role.tenant_id == area_in.tenant_id).first()
    # if admin_role:
    #     roles_to_add.add(admin_role.id)
    
    if roles_to_add:
        roles = db.query(models_system.Role).filter(models_system.Role.id.in_(roles_to_add)).all()
        for role in roles:
            role.areas.append(db_area)
        db.commit()

    return db_area

@router.get("/roles", response_model=List[schemas.Role], dependencies=[Depends(check_sysadmin_profile)])
def get_roles_by_tenant(tenant_id: int, db: Session = Depends(session.get_db)):
    return db.query(models_system.Role).filter(models_system.Role.tenant_id == tenant_id).all()

@router.post("/fix-tasks-tables")
def run_fix_tasks_tables_endpoint(
    request: Request,
    db: Session = Depends(session.get_db)
):
    # check_sysadmin_profile(request) # Optional: disable check for easier debugging if token issue, but better keep it.
    
    cwd = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    script_path = os.path.join(cwd, "scripts", "fix_tasks_table.py")
    
    try:
        process = subprocess.run(["python", script_path], cwd=cwd, capture_output=True, text=True)
        return {
            "message": "Fix script executed", 
            "stdout": process.stdout, 
            "stderr": process.stderr, 
            "returncode": process.returncode
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))