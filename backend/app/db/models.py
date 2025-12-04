from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, Boolean, Date, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

# ==========================================
# MODELOS GLOBAIS (Banco: repforce_global)
# ==========================================

class SysUser(Base):
    """Usuários administradores do sistema (SysAdmin)"""
    __tablename__ = "sys_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    # Perfil fixo
    profile = Column(String, default="sysadmin", nullable=False)

class Tenant(Base):
    """Cadastro das Empresas (Catálogo de Tenants)"""
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False) # Ex: "nike", "cocacola"
    
    # A CHAVE DO ISOLAMENTO: String de conexão completa
    # Ex: postgresql://user:pass@db:5432/repforce_tenant_1
    db_connection_string = Column(String, nullable=False)
    
    cnpj = Column(String, nullable=True)
    status = Column(String, default='active') 
    tenant_type = Column(String, default='industry')
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# ==========================================
# MODELOS DE TENANT (Banco: repforce_tenant_X)
# Nota: Removemos 'tenant_id' pois o isolamento agora é físico (por banco)
# ==========================================

class User(Base):
    """Usuários DO TENANT (Admin, Representante)"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    profile = Column(String, nullable=False) # 'admin' ou 'representante'
    name = Column(String, nullable=True)
    
    # Relacionamentos locais
    clients = relationship("Client", back_populates="representative")
    routes = relationship("Route", back_populates="representative")
    orders = relationship("Order", back_populates="representative")

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    trade_name = Column(String, nullable=True)
    cnpj = Column(String, nullable=True)
    status = Column(String, default='active')
    address_data = Column(JSON, nullable=True)
    
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    representative = relationship("User", back_populates="clients")
    
    contacts = relationship("Contact", back_populates="client")
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

class Product(Base):
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

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    commercial_contact = Column(String, nullable=True)
    products = relationship("Product", back_populates="supplier")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="draft")
    total_value = Column(Float, default=0.0)
    margin_value = Column(Float, default=0.0)
    items = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    client = relationship("Client", back_populates="orders")
    
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    representative = relationship("User", back_populates="orders")

class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    date = Column(Date, nullable=False)
    status = Column(String, default='planned')
    
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    representative = relationship("User", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route")

class RouteStop(Base):
    __tablename__ = "route_stops"
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    sequence = Column(Integer, nullable=False)
    status = Column(String, default='pending')
    route = relationship("Route", back_populates="stops")