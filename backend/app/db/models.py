from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Text, Enum
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

# --- CORE (Multi-tenancy & Users) ---

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cnpj = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="tenant")
    products = relationship("Product", back_populates="tenant")
    clients = relationship("Client", back_populates="tenant")
    orders = relationship("Order", back_populates="tenant")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default=UserRole.SALES_REP) # sysadmin, admin, sales_rep
    is_active = Column(Boolean, default=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True) # Sysadmins podem não ter tenant
    tenant = relationship("Tenant", back_populates="users")
    
    orders = relationship("Order", back_populates="sales_rep")

# --- CATALOG & PRODUCTS ---

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float)
    stock_quantity = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    category = Column(String, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="products")

# --- SALES & ORDERING (Mantendo Clientes apenas como entidade cadastral) ---

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    fantasy_name = Column(String, index=True)
    company_name = Column(String) # Razão Social
    cnpj_cpf = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="clients")
    
    orders = relationship("Order", back_populates="client")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, index=True, nullable=True) # ID no ERP
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    status = Column(String, default=OrderStatus.DRAFT)
    total_value = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="orders")

    client_id = Column(Integer, ForeignKey("clients.id"))
    client = relationship("Client", back_populates="orders")

    sales_rep_id = Column(Integer, ForeignKey("users.id"))
    sales_rep = relationship("User", back_populates="orders")

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price = Column(Float) # Preço no momento da venda
    total = Column(Float)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")