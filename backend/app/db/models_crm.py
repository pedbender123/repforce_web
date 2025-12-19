from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, Enum, JSON, ForeignKey, func 
from sqlalchemy.orm import relationship
from app.db.database import BaseCrm
import enum

# Enums (replicated or imported? simpler to redefine or move to shared)
class OrderStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELED = "canceled"

class DiscountRuleType(str, enum.Enum):
    QUANTITY = "quantity" # Minimo X unidades
    VALUE = "value" # Minimo X valor total
    SEASONAL = "seasonal" # Data especifica
    MIX = "mix" # Combinação de produtos

class DiscountTargetType(str, enum.Enum):
    PRODUCT = "product"
    FAMILY = "family"
    BRAND = "brand"
    GLOBAL = "global"

# --- CONFIG & CUSTOMIZATION ---
class CustomFieldConfig(BaseCrm):
    __tablename__ = "custom_fields_config"
    id = Column(Integer, primary_key=True, index=True)
    entity = Column(String, index=True) # "product", "client", "order"
    key = Column(String, index=True) # "shoe_size"
    label = Column(String) # "Tamanho do Sapato"
    type = Column(String) # "text", "number", "date", "select", "boolean"
    options = Column(JSON, nullable=True) # Para selects: ["P", "M", "G"]
    required = Column(Boolean, default=False)
    order_index = Column(Integer, default=0) # Para ordenação na UI

# --- CATALOG ---
class Brand(BaseCrm):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    products = relationship("Product", back_populates="brand")

class ProductFamily(BaseCrm):
    __tablename__ = "product_families"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    products = relationship("Product", back_populates="family")

class ProductType(BaseCrm):
    __tablename__ = "product_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    products = relationship("Product", back_populates="type")

class Supplier(BaseCrm):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cnpj = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    # tenant_id removed
    
    products = relationship("Product", back_populates="supplier")

class Product(BaseCrm):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float)
    cost_price = Column(Float, nullable=True)
    stock = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    category = Column(String, nullable=True) # Legacy (can be removed later)
    
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    brand = relationship("Brand", back_populates="products")

    family_id = Column(Integer, ForeignKey("product_families.id"), nullable=True)
    family = relationship("ProductFamily", back_populates="products")

    type_id = Column(Integer, ForeignKey("product_types.id"), nullable=True)
    type = relationship("ProductType", back_populates="products")

    # Campo Dinâmico (Mini-Sheets)
    # Indexamos com GIN para performance em buscas JSON
    # Ex: { "shoe_size": "42", "color": "Red" }
    custom_attributes = Column(JSON, default={})

    # tenant_id removed

    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier", back_populates="products")

# --- PRICING ---
class DiscountRule(BaseCrm):
    __tablename__ = "discount_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String) # DiscountRuleType
    target_type = Column(String) # DiscountTargetType
    target_id = Column(Integer, nullable=True) # Product ID, Family ID, etc.
    
    min_quantity = Column(Integer, nullable=True)
    min_value = Column(Float, nullable=True)
    
    discount_percent = Column(Float, nullable=True) # 10.0 = 10%
    discount_value = Column(Float, nullable=True) # 50.0 = R$ 50,00 off
    
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    priority = Column(Integer, default=0)
    active = Column(Boolean, default=True)

# --- CRM & SALES ---
class Client(BaseCrm):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    fantasy_name = Column(String, index=True)
    name = Column(String)
    trade_name = Column(String, nullable=True)
    cnpj = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, default="active")
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    zip_code = Column(String, nullable=True)
    
    # Campo Dinâmico
    custom_attributes = Column(JSON, default={})

    # tenant_id removed
    
    # Representative (User) is in SystemDB. Mapping by ID only.
    representative_id = Column(Integer, index=True, nullable=True) 
    
    orders = relationship("Order", back_populates="client")
    contacts = relationship("Contact", back_populates="client", cascade="all, delete-orphan")

class Contact(BaseCrm):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    role = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_primary = Column(Boolean, default=False)
    client_id = Column(Integer, ForeignKey("clients.id"))
    client = relationship("Client", back_populates="contacts")

class Order(BaseCrm):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    status = Column(String, default=OrderStatus.DRAFT)
    total_value = Column(Float, default=0.0)
    margin_value = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    
    # Campo Dinâmico (Ex: "gift_wrap": true)
    custom_attributes = Column(JSON, default={})

    # tenant_id removed

    client_id = Column(Integer, ForeignKey("clients.id"))
    client = relationship("Client", back_populates="orders")
    
    # Representative (User)
    representative_id = Column(Integer, index=True)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(BaseCrm):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    
    # Snapshot de Preços (Histórico)
    unit_price = Column(Float) # Preço cheio
    discount_value = Column(Float, default=0.0) # Desconto por unidade
    net_unit_price = Column(Float, default=0.0) # Preço final por unidade
    total = Column(Float) # net_unit_price * quantity
    
    rule_snapshot = Column(String, nullable=True) # Nome da regra aplicada
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

# --- VISITS & ROUTES ---
class VisitRoute(BaseCrm):
    __tablename__ = "visit_routes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    date = Column(String)
    stops = Column(JSON)
    # tenant_id removed
    
    user_id = Column(Integer, index=True) # Sales Rep

# --- SYSTEM TASKS (Notifications) ---
class TaskType(str, enum.Enum):
    ERROR = "error"
    ORDER = "order"
    ROUTE = "route"
    SYSTEM = "system"

class TaskStatus(str, enum.Enum):
    OPEN = "open"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class Task(BaseCrm):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    type = Column(String) # TaskType
    status = Column(String, default=TaskStatus.OPEN, index=True)
    
    related_id = Column(Integer, nullable=True) # ID of related Order, Route, etc.
    link_url = Column(String, nullable=True) # Direct link to related resource
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Assignee (optional)
    assigned_user_id = Column(Integer, index=True, nullable=True)

