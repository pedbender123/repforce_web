from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime
from app.db.models import UserRole
from app.db.models_crm import OrderStatus

# --- SCHEMAS AUXILIARES PARA ÁREAS E CARGOS ---
class PageItem(BaseModel):
    label: str
    path: str

class AreaBase(BaseModel):
    name: str
    icon: Optional[str] = "LayoutDashboard"
    pages_json: List[PageItem] = []

class AreaCreate(AreaBase):
    tenant_id: int
    allowed_role_ids: List[int] = []

class Area(AreaBase):
    id: int
    tenant_id: int
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    area_ids: List[int] = []

class RoleUpdate(RoleBase):
    area_ids: Optional[List[int]] = None

class Role(RoleBase):
    id: int
    tenant_id: int
    # Importante: Usamos Area aqui. O Pydantic resolve a referência pois Area já foi definido acima.
    areas: List[Area] = [] 
    class Config:
        from_attributes = True

# --- TOKEN ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role_name: Optional[str] = None
    tenant_id: Optional[int] = None
    role_id: Optional[int] = None

# --- TENANT ---
class TenantBase(BaseModel):
    name: str
    cnpj: Optional[str] = None
    cnpj: Optional[str] = None
    tenant_type: Optional[str] = 'industry'

class TenantUpdate(TenantBase):
    name: Optional[str] = None
    tenant_type: Optional[str] = None
    status: Optional[str] = None
    commercial_info: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    cnpj: Optional[str] = None

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
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    tenant_id: Optional[int] = None
    role_id: Optional[int] = None
    profile: Optional[str] = "sales_rep"

class User(UserBase):
    id: int
    tenant_id: Optional[int] = None
    tenant: Optional[Tenant] = None 
    role_obj: Optional[Role] = None
    class Config:
        from_attributes = True

# --- CONTACT ---
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
    # tenant_id removed
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
    custom_attributes: Optional[Dict[str, Any]] = {}

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    # tenant_id removed
    supplier: Optional[Supplier] = None
    class Config:
        from_attributes = True

# --- CLIENT ---
class ClientBase(BaseModel):
    fantasy_name: str
    name: str # Razão Social
    trade_name: Optional[str] = None
    cnpj: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = "active"
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    representative_id: Optional[int] = None
    custom_attributes: Optional[Dict[str, Any]] = {}

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    # tenant_id removed
    contacts: List[Contact] = []
    class Config:
        from_attributes = True

# --- CUSTOM FIELDS CONFIG SCHEMA ---
class CustomFieldConfigBase(BaseModel):
    entity: str
    key: str
    label: str
    type: str
    options: Optional[List[str]] = None
    required: bool = False
    order_index: int = 0

class CustomFieldConfigCreate(CustomFieldConfigBase):
    pass

class CustomFieldConfig(CustomFieldConfigBase):
    id: int
    class Config:
        from_attributes = True

# --- CATALOG METADATA ---
class CatalogItemBase(BaseModel):
    name: str

class Brand(CatalogItemBase):
    id: int
    class Config:
        from_attributes = True

class ProductFamily(CatalogItemBase):
    id: int
    class Config:
        from_attributes = True

class ProductType(CatalogItemBase):
    id: int
    class Config:
        from_attributes = True

class BrandCreate(CatalogItemBase): pass
class FamilyCreate(CatalogItemBase): pass
class TypeCreate(CatalogItemBase): pass

# --- PRICING RULES ---
class DiscountRuleBase(BaseModel):
    name: str
    type: str # quantity, value, seasonal, mix
    target_type: str # product, family, brand, global
    target_id: Optional[int] = None
    min_quantity: Optional[int] = None
    min_value: Optional[float] = None
    discount_percent: Optional[float] = None
    discount_value: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: int = 0
    active: bool = True

class DiscountRuleCreate(DiscountRuleBase):
    pass

class DiscountRule(DiscountRuleBase):
    id: int
    class Config:
        from_attributes = True

# --- CART & PRICING DTOs ---
class CartItemInput(BaseModel):
    product_id: int
    quantity: int

class CartItemSummary(BaseModel):
    product_id: int
    name: str
    quantity: int
    unit_price: float
    discount_value: float
    net_unit_price: float
    total: float
    rule_applied: Optional[str] = None

class CartSummary(BaseModel):
    items: List[CartItemSummary]
    total_gross: float
    total_discount: float
    total_net: float
    margin_value: float = 0.0

# --- ROUTES ---
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