from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime
import uuid

# --- TOKEN (SaaS Lite) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    is_sysadmin: bool = False

# --- TENANT (SaaS Lite) ---
class TenantRef(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    plan_type: str
    
    class Config:
        from_attributes = True

class TenantBase(BaseModel):
    name: str
    cnpj: Optional[str] = None
    tenant_type: Optional[str] = 'industry'

class TenantUpdate(TenantBase):
    name: Optional[str] = None
    tenant_type: Optional[str] = None
    status: Optional[str] = None
    commercial_info: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    cnpj: Optional[str] = None

class TenantCreate(TenantBase):
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = 'inactive'
    commercial_info: Optional[str] = None

class Tenant(TenantBase):
    id: uuid.UUID
    slug: Optional[str] = None
    status: Optional[str] = 'active'
    is_active: bool
    created_at: datetime
    demo_mode_start: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- MEMBERSHIP (SaaS Lite) ---
class MembershipRef(BaseModel):
    role: str
    tenant: TenantRef
    
    class Config:
        from_attributes = True

# --- USER (Global) ---
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    tenant_id: Optional[uuid.UUID] = None
    role_id: Optional[uuid.UUID] = None

class User(UserBase):
    id: uuid.UUID
    is_sysadmin: bool = False
    created_at: Optional[datetime]
    
    # List of memberships to show available tenants in Lobby
    memberships: List[MembershipRef] = []

    # Compatibility fields for legacy code (if needed)
    name: Optional[str] = None # mapped to full_name?
    
    class Config:
        from_attributes = True

# --- SCHEMAS AUXILIARES PARA ÁREAS E CARGOS ---
class PageItem(BaseModel):
    label: str
    path: str

class AreaBase(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = "LayoutDashboard"
    order: int = 0
    is_active: bool = True
    pages_json: List[Any] = []

class AreaCreate(AreaBase):
    pass

class Area(AreaBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    area_ids: List[uuid.UUID] = []

class RoleUpdate(RoleBase):
    area_ids: Optional[List[uuid.UUID]] = None

class Role(RoleBase):
    id: uuid.UUID
    tenant_id: Optional[uuid.UUID] = None
    areas: List[Area] = [] 
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
    id: uuid.UUID
    client_id: uuid.UUID
    class Config:
        from_attributes = True

# --- SUPPLIER ---
class SupplierBase(BaseModel):
    name: str
    cnpj: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: uuid.UUID
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
    supplier_id: Optional[uuid.UUID] = None
    custom_attributes: Optional[Dict[str, Any]] = {}

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: uuid.UUID
    supplier: Optional[Supplier] = None
    class Config:
        from_attributes = True

# --- CLIENT ---
class ClientBase(BaseModel):
    fantasy_name: Optional[str] = None
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
    representative_id: Optional[uuid.UUID] = None
    custom_attributes: Optional[Dict[str, Any]] = {}

class ClientCreate(ClientBase):
    address_data: Optional[Dict[str, Any]] = None

class Client(ClientBase):
    id: uuid.UUID
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
    id: uuid.UUID
    class Config:
        from_attributes = True

# --- CATALOG METADATA ---
class CatalogItemBase(BaseModel):
    name: str

class Brand(CatalogItemBase):
    id: uuid.UUID
    class Config:
        from_attributes = True

class ProductFamily(CatalogItemBase):
    id: uuid.UUID
    class Config:
        from_attributes = True

class ProductType(CatalogItemBase):
    id: uuid.UUID
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
    target_id: Optional[uuid.UUID] = None
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
    id: uuid.UUID
    class Config:
        from_attributes = True

# --- CART & PRICING DTOs ---
class CartItemInput(BaseModel):
    product_id: uuid.UUID
    quantity: int

class CartItemSummary(BaseModel):
    product_id: uuid.UUID
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
    client_id: uuid.UUID
    sequence: int

class VisitRouteCreate(BaseModel):
    name: str
    date: str
    stops: List[RouteStop]

class VisitRoute(BaseModel):
    id: uuid.UUID
    name: str
    date: str
    stops: Any
    class Config:
        from_attributes = True

# --- ORDER ---
class OrderItemBase(BaseModel):
    product_id: uuid.UUID
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: uuid.UUID
    unit_price: float
    total: float
    name: Optional[str] = None 
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    client_id: uuid.UUID
    items: List[OrderItemCreate]
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class Order(BaseModel):
    id: uuid.UUID
    created_at: datetime
    status: str
    total_value: float
    notes: Optional[str] = None
    client_id: uuid.UUID
    client: Optional[Client] = None
    items: List[OrderItem] = []
    class Config:
        from_attributes = True