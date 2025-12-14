from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from app.db.models import UserRole, OrderStatus

# --- TOKEN ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- TENANT ---
class TenantBase(BaseModel):
    name: str
    cnpj: str

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- USER ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.SALES_REP
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    tenant_id: Optional[int] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    tenant_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- PRODUCT ---
class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int = 0
    image_url: Optional[str] = None
    category: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    tenant_id: int

    class Config:
        from_attributes = True

# --- CLIENT (Simplificado - Apenas Cadastral) ---
class ClientBase(BaseModel):
    fantasy_name: str
    company_name: str
    cnpj_cpf: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    tenant_id: int

    class Config:
        from_attributes = True

# --- ORDER ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    unit_price: float
    total: float
    product_name: str = "" # Helper field for display

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    client_id: int
    items: List[OrderItemCreate]
    notes: Optional[str] = None

class Order(BaseModel):
    id: int
    external_id: Optional[str] = None
    created_at: datetime
    status: OrderStatus
    total_value: float
    notes: Optional[str] = None
    client_id: int
    sales_rep_id: int
    client: Optional[Client] = None
    items: List[OrderItem] = []

    class Config:
        from_attributes = True