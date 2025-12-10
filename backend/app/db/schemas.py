from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date

# --- Auth & User ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    tenant_schema: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    tenant_id: Optional[int] = None
    profile: Optional[str] = None # 'admin' or 'representante'

class User(UserBase):
    id: int
    is_active: bool
    is_sysadmin: bool
    tenant_id: Optional[int] = None
    
    # Campo calculado para facilitar o frontend (removido do banco, agora inferido)
    profile: str = "user" 

    model_config = ConfigDict(from_attributes=True)

# --- Tenant Management ---
class TenantBase(BaseModel):
    name: str
    slug: str

class TenantCreate(TenantBase):
    sysadmin_email: EmailStr
    sysadmin_password: str
    tenant_type: str = "industry" # industry, agency, reseller

class Tenant(TenantBase):
    id: int
    schema_name: str
    status: str
    tenant_type: Optional[str] = "industry"

    model_config = ConfigDict(from_attributes=True)

# --- Navigation / Dynamic UI ---

class TenantPageBase(BaseModel):
    label: str
    path: str
    order: int = 0
    config_json: Dict[str, Any] = {} # A config do frontend vem aqui

class TenantPage(TenantPageBase):
    id: int
    component_key: Optional[str] = None # Calculado no backend a partir do relationship
    
    model_config = ConfigDict(from_attributes=True)

class TenantAreaBase(BaseModel):
    label: str
    icon: str
    order: int = 0

class TenantArea(TenantAreaBase):
    id: int
    pages: List[TenantPage] = []

    model_config = ConfigDict(from_attributes=True)

# --- Business Data ---
# ... (Mantenha os schemas de Client, Product, Order etc. iguais ao anterior)
class ClientBase(BaseModel):
    name: str
    trade_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    document: Optional[str] = None
    address_data: Optional[Dict] = None # Helper para receber JSON

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    status: str
    model_config = ConfigDict(from_attributes=True)

# (Simplifiquei para focar na mudança principal, mantenha os outros se necessário)