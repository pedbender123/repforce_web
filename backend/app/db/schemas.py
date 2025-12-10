from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any

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

class User(UserBase):
    id: int
    is_active: bool
    is_sysadmin: bool
    tenant_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

# --- Tenant Management ---
class TenantBase(BaseModel):
    name: str
    slug: str

class TenantCreate(TenantBase):
    sysadmin_email: EmailStr
    sysadmin_password: str

class Tenant(TenantBase):
    id: int
    schema_name: str
    status: str

    model_config = ConfigDict(from_attributes=True)

# --- Navigation / Dynamic UI ---

class SysComponentCreate(BaseModel):
    key: str
    name: str
    default_path: str

class SysComponent(SysComponentCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class TenantPageBase(BaseModel):
    component_id: int
    label: str
    path_override: Optional[str] = None
    order: int = 0

class TenantPage(TenantPageBase):
    id: int
    component_key: Optional[str] = None
    path: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class TenantAreaBase(BaseModel):
    label: str
    icon: str
    order: int = 0

class TenantAreaCreate(TenantAreaBase):
    tenant_id: int

class TenantArea(TenantAreaBase):
    id: int
    pages: List[TenantPage] = []

    model_config = ConfigDict(from_attributes=True)

# --- Business Data (Tenant Specific) ---

class ContactBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class Contact(ContactBase):
    id: int
    client_id: int
    model_config = ConfigDict(from_attributes=True)

class ClientBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    document: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    contacts: List[Contact] = []
    model_config = ConfigDict(from_attributes=True)

# Adicionado para corrigir erro do Catalog
class SupplierBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    document: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    sku: str
    price: int
    stock_quantity: int
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    client_id: int
    items: List[OrderItemBase]

class Order(BaseModel):
    id: int
    total_amount: int
    status: str
    client_id: int
    model_config = ConfigDict(from_attributes=True)