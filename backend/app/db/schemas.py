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
    profile: Optional[str] = None 

class User(UserBase):
    id: int
    is_active: bool
    is_sysadmin: bool
    tenant_id: Optional[int] = None
    profile: str = "user"
    model_config = ConfigDict(from_attributes=True)

# --- Tenant Management ---
class TenantBase(BaseModel):
    name: str
    slug: str

class TenantCreate(TenantBase):
    sysadmin_email: EmailStr
    sysadmin_password: str
    tenant_type: str = "industry"

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
    config_json: Dict[str, Any] = {}

class TenantPage(TenantPageBase):
    id: int
    component_key: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class TenantAreaBase(BaseModel):
    label: str
    icon: str
    order: int = 0

# --- CORREÇÃO: Adicionada a classe que faltava ---
class TenantAreaCreate(TenantAreaBase):
    tenant_id: int

class TenantArea(TenantAreaBase):
    id: int
    pages: List[TenantPage] = []
    model_config = ConfigDict(from_attributes=True)

# --- Business Data ---

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
    trade_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    document: Optional[str] = None
    address_json: Optional[Dict] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    status: str
    contacts: List[Contact] = []
    model_config = ConfigDict(from_attributes=True)

class SupplierBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    document: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    sku: str
    price: float
    cost_price: float = 0.0
    stock_quantity: int = 0
    description: Optional[str] = None
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    supplier_id: Optional[int] = None

class Product(ProductBase):
    id: int
    supplier: Optional[Supplier] = None
    model_config = ConfigDict(from_attributes=True)

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItem(OrderItemBase):
    id: int
    unit_price: float
    subtotal: float
    product: Optional[Product] = None
    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    client_id: int
    items: List[OrderItemBase]

class Order(BaseModel):
    id: int
    total_value: float
    margin_value: float
    status: str
    client_id: int
    created_at: Optional[date] = None
    items: List[OrderItem] = []
    model_config = ConfigDict(from_attributes=True)

class RouteStopBase(BaseModel):
    client_id: int
    sequence: int
    status: str = "pending"
    notes: Optional[str] = None

class RouteStopCreate(RouteStopBase):
    pass

class RouteStop(RouteStopBase):
    id: int
    route_id: int
    client: Optional[Client] = None
    model_config = ConfigDict(from_attributes=True)

class RouteBase(BaseModel):
    name: str
    date: date

class RouteCreate(RouteBase):
    stops: List[RouteStopCreate] = []

class Route(RouteBase):
    id: int
    status: str
    stops: List[RouteStop] = []
    model_config = ConfigDict(from_attributes=True)