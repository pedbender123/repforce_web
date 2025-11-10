from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class Tenant(Base):
    """
    Modelo da Conta Mãe (Tenant).
    """
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    users = relationship("User", back_populates="tenant")
    clients = relationship("Client", back_populates="tenant")
    products = relationship("Product", back_populates="tenant")
    orders = relationship("Order", back_populates="tenant")

class User(Base):
    """
    Modelo de Usuário (Admin ou Representante).
    """
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    profile = Column(String, nullable=False) # 'admin' ou 'representante'
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="users")
    
    # Relacionamentos para o representante
    clients_as_representative = relationship("Client", back_populates="representative")
    orders_as_representative = relationship("Order", back_populates="representative")

class Client(Base):
    """
    Modelo de Cliente (do CRM).
    """
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    cnpj = Column(String, unique=True, index=True, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="clients")
    
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    representative = relationship("User", back_populates="clients_as_representative")

class Product(Base):
    """
    Modelo de Produto (Catálogo).
    """
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    cost = Column(Float, nullable=True)
    stock = Column(Integer, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="products")

class Order(Base):
    """
    Modelo de Pedido.
    """
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="PENDING", nullable=False)
    total_value = Column(Float, nullable=False)
    items = Column(JSON) # Armazena os itens do pedido como JSON
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="orders")
    
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    client = relationship("Client")
    
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    representative = relationship("User", back_populates="orders_as_representative")