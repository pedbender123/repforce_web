from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security

router = APIRouter()

# 1. Login SysAdmin (Usa get_global_db)
@router.post("/sysadmin/token", response_model=schemas.Token)
def sysadmin_login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(database.get_global_db) # Conecta no Global
):
    user = db.query(models.SysUser).filter(models.SysUser.username == username).first()
    
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais de SysAdmin inválidas")
    
    # Token de SysAdmin não tem tenant_slug
    access_token = security.create_access_token(
        data={"sub": str(user.id), "profile": "sysadmin", "username": user.username}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# 2. Login Tenant (Usuário da Empresa)
@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    tenant_slug: str = Form(...), # NOVO CAMPO OBRIGATÓRIO
    username: str = Form(...),
    password: str = Form(...),
    remember_me: bool = Form(False),
):
    """
    Login Multi-Tenant:
    1. Busca a connection string do tenant no DB Global.
    2. Conecta no DB do Tenant.
    3. Valida o usuário.
    """
    
    # Passo 1: Busca Tenant no Global
    global_db = database.GlobalSessionLocal()
    tenant = global_db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    global_db.close()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
        
    if tenant.status != 'active':
        raise HTTPException(status_code=403, detail="Empresa inativa.")

    # Passo 2: Conecta no Tenant
    try:
        tenant_engine = database.tenant_manager.get_tenant_engine(tenant.db_connection_string)
        TenantSession = sessionmaker(bind=tenant_engine)
        tenant_db = TenantSession()
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Erro de conexão com banco do Tenant.")

    # Passo 3: Valida Usuário no banco do Tenant
    try:
        user = tenant_db.query(models.User).filter(models.User.username == username).first()
        
        if not user or not security.verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Usuário ou senha incorretos.")
            
        # Gera Token com o SLUG para o Middleware saber onde conectar nas próximas requests
        token_data = {
            "sub": str(user.id),
            "profile": user.profile,
            "username": user.username,
            "tenant_slug": tenant_slug # O Pulo do Gato
        }
        
        access_token = security.create_access_token(data=token_data, remember_me=remember_me)
        return {"access_token": access_token, "token_type": "bearer"}
        
    finally:
        tenant_db.close()