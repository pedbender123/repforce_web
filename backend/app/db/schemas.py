from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import date, datetime

# --- Tenant ---
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

# --- User ---
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    profile: Optional[str] = "representante"
    tenant_id: Optional[int] = None

class User(UserBase):
    id: int
    profile: str
    tenant_id: int
    tenant: Tenant
    class Config:
        orm_mode = True

# --- Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

# --- Contact (NOVO) ---
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
        orm_mode = True

# --- Client ---
class AddressData(BaseModel):
    rua: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    cep: Optional[str] = None

class ClientBase(BaseModel):
    name: str
    trade_name: Optional[str] = None
    cnpj: Optional[str] = None
    status: str = 'active'
    address_data: Optional[AddressData] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class ClientCreate(ClientBase):
    representative_id: Optional[int] = None

class Client(ClientBase):
    id: int
    tenant_id: int
    representative_id: Optional[int] = None
    contacts: List[Contact] = [] # Inclui contatos na leitura
    class Config:
        orm_mode = True

# --- Product ---
class ProductBase(BaseModel):
    name: str
    sku: Optional[str] = None
    price: float
    cost_price: Optional[float] = None
    stock: Optional[int] = 0
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    tenant_id: int
    class Config:
        orm_mode = True

# --- Order ---
class OrderItem(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    subtotal: Optional[float] = 0
    name: Optional[str] = None

class OrderCreate(BaseModel):
    client_id: int
    items: List[OrderItem]

class Order(BaseModel):
    id: int
    status: str
    total_value: float
    margin_value: Optional[float]
    created_at: datetime
    items: Any
    client_id: int
    tenant_id: int
    representative_id: int
    class Config:
        orm_mode = True

# --- Routes (NOVO) ---
class RouteStopBase(BaseModel):
    client_id: int
    sequence: int
    notes: Optional[str] = None

class RouteCreate(BaseModel):
    name: str
    date: date
    stops: List[RouteStopBase]

class RouteStop(RouteStopBase):
    id: int
    status: str
    checkin_time: Optional[datetime]
    client: Client
    class Config:
        orm_mode = True

class Route(BaseModel):
    id: int
    name: Optional[str]
    date: date
    status: str
    stops: List[RouteStop]
    class Config:
        orm_mode = True