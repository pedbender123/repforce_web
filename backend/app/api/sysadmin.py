from fastapi import APIRouter, Depends, Request, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
from pydantic import EmailStr
from ..db import database, models, schemas
from ..core import security
from typing import List, Optional
import shutil
import os

# --- NOVO: Configuração de Upload ---
# Define o diretório de upload DENTRO do container
UPLOAD_DIRECTORY = "/app/uploads/tenants"
# Define a URL base que o frontend usará para buscar a imagem
STATIC_URL_PATH = "/uploads/tenants"
# -----------------------------------

router = APIRouter()

# Dependência para verificar se o usuário é SysAdmin
def check_sysadmin_profile(request: Request):
    if request.state.profile != 'sysadmin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a SysAdmins."
        )
    return True

# --- Gestão de Tenants (SysAdmin) ---

@router.post("/tenants", 
             response_model=schemas.Tenant, 
             status_code=201,
             dependencies=[Depends(check_sysadmin_profile)])
def create_tenant(
    db: Session = Depends(database.get_db),
    # --- MUDANÇA: Recebe dados como Formulário ---
    name: str = Form(...),
    cnpj: Optional[str] = Form(None),
    email: Optional[EmailStr] = Form(None),
    phone: Optional[str] = Form(None),
    status: Optional[str] = Form('inactive'),
    commercial_info: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None)
    # --- FIM DA MUDANÇA ---
):
    """
    (SysAdmin) Cria uma nova Conta Mãe (Tenant).
    """
    db_tenant_name = db.query(models.Tenant).filter(models.Tenant.name == name).first()
    if db_tenant_name:
        raise HTTPException(status_code=400, detail="Nome do Tenant já existe")
        
    if cnpj:
        db_tenant_cnpj = db.query(models.Tenant).filter(models.Tenant.cnpj == cnpj).first()
        if db_tenant_cnpj:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")

    # --- NOVO: Lógica de Upload ---
    logo_url_to_save = None
    if logo:
        # Garante que o diretório de upload exista
        os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
        
        # Gera um caminho de arquivo seguro (idealmente usando UUID ou um hash)
        # Por simplicidade, vamos usar o nome do arquivo.
        # ATENÇÃO: Nomes de arquivo duplicados podem sobrescrever uploads.
        file_path = os.path.join(UPLOAD_DIRECTORY, logo.filename)
        
        try:
            # Salva o arquivo no disco
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(logo.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao salvar o arquivo: {str(e)}")
        finally:
            logo.file.close()
        
        # Define a URL que será salva no banco
        logo_url_to_save = f"{STATIC_URL_PATH}/{logo.filename}"
    # --- FIM DA LÓGICA DE UPLOAD ---

    # --- MUDANÇA: Cria o modelo com os dados do Form ---
    new_tenant = models.Tenant(
        name=name,
        cnpj=cnpj,
        email=email,
        phone=phone,
        status=status,
        commercial_info=commercial_info,
        logo_url=logo_url_to_save # Salva o caminho do arquivo
    )
    # --- FIM DA MUDANÇA ---

    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    return new_tenant

@router.get("/tenants", 
            response_model=List[schemas.Tenant],
            dependencies=[Depends(check_sysadmin_profile)])
def get_tenants(db: Session = Depends(database.get_db)):
    """
    (SysAdmin) Lista todos os Tenants.
    """
    tenants = db.query(models.Tenant).order_by(models.Tenant.id).all()
    return tenants

# --- NOVO ENDPOINT: Atualizar Status do Tenant ---
class TenantUpdateStatus(schemas.TenantBase):
    """Schema usado apenas para receber o status para edição"""
    status: str

@router.put("/tenants/{tenant_id}", 
            response_model=schemas.Tenant,
            dependencies=[Depends(check_sysadmin_profile)])
def update_tenant_status(
    tenant_id: int,
    tenant_update: TenantUpdateStatus,
    db: Session = Depends(database.get_db)
):
    """
    (SysAdmin) Atualiza o status de um Tenant.
    """
    db_tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    
    if not db_tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    # Atualiza apenas o campo status
    db_tenant.status = tenant_update.status
    db.commit()
    db.refresh(db_tenant)
    return db_tenant
# --- FIM NOVO ENDPOINT ---


# --- Gestão de Usuários (SysAdmin) ---

@router.post("/users", 
             response_model=schemas.User, 
             status_code=201, 
             dependencies=[Depends(check_sysadmin_profile)])
def create_sysadmin_user(
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    (SysAdmin) Cria um novo usuário (SysAdmin, Admin ou Rep).
    O frontend deve passar o tenant_id e o profile correto.
    """
    
    tenant_id = user.tenant_id
    if not tenant_id:
        # Se tenant_id não for fornecido pelo frontend, 
        # forçamos a busca pelo "Systems" (fallback seguro)
        systems_tenant = db.query(models.Tenant).filter(models.Tenant.name == "Systems").first()
        if not systems_tenant:
            raise HTTPException(status_code=500, detail="Tenant 'Systems' não encontrado.")
        tenant_id = systems_tenant.id
    
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username já cadastrado")

    hashed_password = security.get_password_hash(user.password)
    
    # Confia no profile enviado pelo frontend, mas garante que não seja nulo.
    profile = user.profile if user.profile else 'representante'

    db_new_user = models.User(
        username=user.username,
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        profile=profile,
        tenant_id=tenant_id
    )
    
    db.add(db_new_user)
    db.commit()
    db.refresh(db_new_user)
    return db_new_user

@router.get("/users", 
            response_model=List[schemas.User], 
            dependencies=[Depends(check_sysadmin_profile)])
def get_systems_users(
    db: Session = Depends(database.get_db)
):
    """
    (SysAdmin) Lista usuários apenas do Tenant 'Systems' E com perfil 'sysadmin'.
    """
    # 1. Encontra o Tenant "Systems"
    systems_tenant = db.query(models.Tenant).filter(models.Tenant.name == "Systems").first()
    if not systems_tenant:
        return [] 
    
    # 2. Busca usuários apenas desse Tenant E filtra por perfil 'sysadmin'
    users = db.query(models.User).options(joinedload(models.User.tenant)).filter(
        models.User.tenant_id == systems_tenant.id,
        models.User.profile == 'sysadmin' # <-- NOVO FILTRO
    ).order_by(models.User.id).all()
    
    return users

@router.get("/all-users", 
            response_model=List[schemas.User], 
            dependencies=[Depends(check_sysadmin_profile)])
def get_all_users_in_system(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    (SysAdmin) Lista TODOS os usuários de TODOS os tenants.
    """
    # Usamos joinedload para carregar o relacionamento 'tenant' 
    # e evitar N+1 queries.
    users = db.query(models.User).options(joinedload(models.User.tenant)).order_by(models.User.id).all()
    return users