from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None # 'username' aqui é o 'sub' (user.id)

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    profile: str
    tenant_id: int

    class Config:
        orm_mode = True # No Pydantic v1. Use from_attributes = True no v2

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
    pass # Pode adicionar mais campos se necessário

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

# --- Tenant Schemas (Para o SysAdmin) ---
class Tenant(BaseModel):
    id: int
    name: str
    class Config:
        orm_mode = True

# --- NOVO SCHEMA QUE FALTAVA ---
class SetupRequest(UserCreate):
    tenant_name: str