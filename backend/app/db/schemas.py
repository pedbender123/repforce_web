from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any

# --- Tenant Schemas (Usado dentro do User Schema) ---
class TenantBase(BaseModel):
    name: str
    cnpj: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None
    commercial_info: Optional[str] = None
    status: Optional[str] = 'inactive'

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    id: int
    class Config:
        orm_mode = True

# --- User Schemas ---
class UserBase(BaseModel):
    username: str # Campo de login (Obrigatório)
    email: Optional[EmailStr] = None # Campo de contato (Opcional)
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    profile: Optional[str] = "representante"
    tenant_id: Optional[int] = None # SysAdmin pode precisar definir isso

class User(UserBase):
    id: int
    profile: str
    tenant_id: int
    tenant: Tenant # <-- Retorna os dados do Tenant junto

    class Config:
        orm_mode = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Client Schemas ---
class ClientBase(BaseModel):
    name: str
    cnpj: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class ClientCreate(ClientBase):
    representative_id: Optional[int] = None

class Client(ClientBase):
    id: int
    tenant_id: int
    representative_id: Optional[int] = None

    class Config:
        orm_mode = True

# --- Order Schemas ---
class OrderItem(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class OrderBase(BaseModel):
    client_id: int
    items: List[OrderItem]

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    status: str
    total_value: float
    tenant_id: int
    representative_id: int

    class Config:
        orm_mode = True

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    price: float
    cost: Optional[float] = None
    stock: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    tenant_id: int

    class Config:
        orm_mode = True

# --- Tenant Update Status Schema (para PUT) ---
class TenantUpdateStatus(BaseModel):
    status: str