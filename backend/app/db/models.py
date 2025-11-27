from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, Boolean, Date, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    cnpj = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    commercial_info = Column(String, nullable=True) 
    status = Column(String, nullable=False, default='inactive') 
    
    # NOVO: Tipo de Tenant
    # industry: Indústria (tem estoque, é o fabricante)
    # agency: Representação (não tem estoque físico, gere fornecedores)
    # reseller: Revenda (tem estoque e fornecedores)
    tenant_type = Column(String, default='industry', nullable=False)

    users = relationship("User", back_populates="tenant")
    clients = relationship("Client", back_populates="tenant")
    products = relationship("Product", back_populates="tenant")
    orders = relationship("Order", back_populates="tenant")
    suppliers = relationship("Supplier", back_populates="tenant") # NOVO

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True) 
    email = Column(String, unique=False, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    profile = Column(String, nullable=False) 
    name = Column(String, nullable=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="users")
    
    clients_as_representative = relationship("Client", back_populates="representative")
    orders_as_representative = relationship("Order", back_populates="representative")
    routes = relationship("Route", back_populates="representative")

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    trade_name = Column(String, index=True, nullable=True)
    cnpj = Column(String, index=True, nullable=True) 
    status = Column(String, default='active')
    
    address_data = Column(JSON, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="clients")
    
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    representative = relationship("User", back_populates="clients_as_representative")
    
    contacts = relationship("Contact", back_populates="client", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="client")

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_primary = Column(Boolean, default=False)
    
    client = relationship("Client", back_populates="contacts")

class Supplier(Base):
    """Modelo de Fornecedor / Representada (NOVO)"""
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # Nome da Fábrica/Marca
    commercial_contact = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="suppliers")
    products = relationship("Product", back_populates="supplier")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    sku = Column(String, index=True, nullable=True)
    price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=True)
    stock = Column(Integer, nullable=True)
    image_url = Column(String, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="products")

    # NOVO: Vínculo com Fornecedor (Opcional se for Industria)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier", back_populates="products")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="draft", nullable=False)
    total_value = Column(Float, nullable=False)
    margin_value = Column(Float, nullable=True)
    items = Column(JSON) 
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="orders")
    
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    client = relationship("Client", back_populates="orders")
    
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    representative = relationship("User", back_populates="orders_as_representative")

class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, default='planned')
    name = Column(String, nullable=True)
    
    representative = relationship("User", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")

class RouteStop(Base):
    __tablename__ = "route_stops"
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    sequence = Column(Integer, nullable=False)
    status = Column(String, default='pending')
    checkin_time = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    
    route = relationship("Route", back_populates="stops")
    client = relationship("Client")