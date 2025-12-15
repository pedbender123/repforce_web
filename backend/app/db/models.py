from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum

# Enums
class UserRole(str, enum.Enum):
    SYSADMIN = "sysadmin"
    ADMIN = "admin"
    SALES_REP = "sales_rep"

class OrderStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELED = "canceled"

# --- CORE ---
class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cnpj = Column(String, unique=True, index=True)
    
    # CORREÇÃO: Adicionada a coluna status que faltava
    status = Column(String, default="active") 
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    tenant_type = Column(String, default="industry") 
    commercial_info = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    
    users = relationship("User", back_populates="tenant")
    products = relationship("Product", back_populates="tenant")
    clients = relationship("Client", back_populates="tenant")
    orders = relationship("Order", back_populates="tenant")
    suppliers = relationship("Supplier", back_populates="tenant")
    routes = relationship("VisitRoute", back_populates="tenant")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, index=True)
    hashed_password = Column(String)
    name = Column(String)
    full_name = Column(String, nullable=True)
    profile = Column(String, default="sales_rep")
    is_active = Column(Boolean, default=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    tenant = relationship("Tenant", back_populates="users")
    orders = relationship("Order", back_populates="sales_rep")
    routes = relationship("VisitRoute", back_populates="user")

# --- CATALOG ---
class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cnpj = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="suppliers")
    products = relationship("Product", back_populates="supplier")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float)
    cost_price = Column(Float, nullable=True)
    stock = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    category = Column(String, nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="products")
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier", back_populates="products")

# --- CRM & SALES ---
class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    fantasy_name = Column(String, index=True)
    name = Column(String)
    trade_name = Column(String, nullable=True)
    cnpj = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, default="active")
    
    # Endereço (Flattened)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    zip_code = Column(String, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="clients")
    orders = relationship("Order", back_populates="client")
    
    # Relacionamento com Contatos
    contacts = relationship("Contact", back_populates="client", cascade="all, delete-orphan")

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    role = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_primary = Column(Boolean, default=False)
    
    client_id = Column(Integer, ForeignKey("clients.id"))
    client = relationship("Client", back_populates="contacts")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    status = Column(String, default=OrderStatus.DRAFT)
    total_value = Column(Float, default=0.0)
    margin_value = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="orders")
    client_id = Column(Integer, ForeignKey("clients.id"))
    client = relationship("Client", back_populates="orders")
    representative_id = Column(Integer, ForeignKey("users.id"))
    sales_rep = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price = Column(Float)
    total = Column(Float)
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

# --- VISITS & ROUTES ---
class VisitRoute(Base):
    __tablename__ = "visit_routes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    date = Column(String) # YYYY-MM-DD
    stops = Column(JSON) # Lista de clientes/paradas
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="routes")
    
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="routes")