from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, Boolean, Date, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import CoreBase, TenantBase

# ==========================================
# 🌍 CORE (Schema: public)
# ==========================================

class Tenant(CoreBase):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False) # Ex: "nike" -> schema "tenant_nike"
    cnpj = Column(String, nullable=True)
    status = Column(String, default='active') 
    tenant_type = Column(String, default='industry')
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="tenant")

class User(CoreBase):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    profile = Column(String, nullable=False) 
    name = Column(String, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    tenant = relationship("Tenant", back_populates="users")

# ==========================================
# 🏢 TENANT DATA (Schema: tenant_x)
# ==========================================

class Client(TenantBase):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    trade_name = Column(String, nullable=True)
    cnpj = Column(String, nullable=True)
    status = Column(String, default='active')
    address_data = Column(JSON, nullable=True)
    
    # ID do usuário que atende (Referência lógica ao Core)
    representative_id = Column(Integer, nullable=True) 
    
    contacts = relationship("Contact", back_populates="client")
    orders = relationship("Order", back_populates="client")

class Contact(TenantBase):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_primary = Column(Boolean, default=False)
    client = relationship("Client", back_populates="contacts")

class Product(TenantBase):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    sku = Column(String, index=True, nullable=True)
    price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=True)
    stock = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier", back_populates="products")

class Supplier(TenantBase):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    commercial_contact = Column(String, nullable=True)
    products = relationship("Product", back_populates="supplier")

class Order(TenantBase):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="draft")
    total_value = Column(Float, default=0.0)
    items = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    client = relationship("Client", back_populates="orders")
    
    representative_id = Column(Integer, nullable=False) # Lógica

class Route(TenantBase):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    date = Column(Date, nullable=False)
    status = Column(String, default='planned')
    representative_id = Column(Integer, nullable=False) # Lógica
    stops = relationship("RouteStop", back_populates="route")

class RouteStop(TenantBase):
    __tablename__ = "route_stops"
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    sequence = Column(Integer, nullable=False)
    status = Column(String, default='pending')
    route = relationship("Route", back_populates="stops")
    client = relationship("Client")