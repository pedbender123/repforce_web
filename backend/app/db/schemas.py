from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime
from app.db.models import UserRole, OrderStatus

# --- TOKEN ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    profile: Optional[str] = None
    tenant_id: Optional[int] = None

# --- TENANT ---
class TenantBase(BaseModel):
    name: str
    cnpj: Optional[str] = None
    tenant_type: Optional[str] = 'industry'

class TenantCreate(TenantBase):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = 'inactive'
    commercial_info: Optional[str] = None

class Tenant(TenantBase):
    id: int
    status: Optional[str] = 'active'
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# --- USER ---
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    name: str
    profile: str = "sales_rep"
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    tenant_id: Optional[int] = None

class User(UserBase):
    id: int
    tenant_id: Optional[int] = None
    tenant: Optional[Tenant] = None 
    class Config:
        from_attributes = True

# --- CONTACT (NOVO) ---
class ContactBase(BaseModel):
    name: str
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_primary: bool = False

class ContactCreate(ContactBase):
    pass

class Contact(ContactBase):
    id: int
    client_id: int
    class Config:
        from_attributes = True

# --- SUPPLIER ---
class SupplierBase(BaseModel):
    name: str
    cnpj: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    tenant_id: int
    class Config:
        from_attributes = True

# --- PRODUCT ---
class ProductBase(BaseModel):
    sku: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: float
    cost_price: Optional[float] = None
    stock: int = 0
    image_url: Optional[str] = None
    category: Optional[str] = None
    supplier_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    tenant_id: int
    supplier: Optional[Supplier] = None
    class Config:
        from_attributes = True

# --- CLIENT ---
class ClientBase(BaseModel):
    name: str
    trade_name: Optional[str] = None
    cnpj: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = 'active'

class ClientCreate(ClientBase):
    address_data: Optional[dict] = None 

class Client(ClientBase):
    id: int
    tenant_id: int
    city: Optional[str] = None
    state: Optional[str] = None
    contacts: List[Contact] = [] # Inclui contatos
    class Config:
        from_attributes = True

# --- ROUTES (NOVO) ---
class RouteStop(BaseModel):
    client_id: int
    sequence: int

class VisitRouteCreate(BaseModel):
    name: str
    date: str
    stops: List[RouteStop]

class VisitRoute(BaseModel):
    id: int
    name: str
    date: str
    stops: Any
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
    name: Optional[str] = None 
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    client_id: int
    items: List[OrderItemCreate]
    notes: Optional[str] = None

class Order(BaseModel):
    id: int
    created_at: datetime
    status: str
    total_value: float
    notes: Optional[str] = None
    client_id: int
    client: Optional[Client] = None
    items: List[OrderItem] = []
    class Config:
        from_attributes = True