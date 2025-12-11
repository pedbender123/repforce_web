from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, Date, Float
from sqlalchemy.orm import relationship, declarative_base

CoreBase = declarative_base()

# --- PUBLIC SCHEMA (System) ---

class Tenant(CoreBase):
    __tablename__ = "tenants"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    schema_name = Column(String, unique=True, nullable=False)
    status = Column(String, default="active")
    tenant_type = Column(String, default="industry")

    users = relationship("User", back_populates="tenant")

class User(CoreBase):
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String)
    password_hash = Column(String)
    is_active = Column(Boolean, default=True)
    is_sysadmin = Column(Boolean, default=False)
    tenant_id = Column(Integer, ForeignKey("public.tenants.id"))

    tenant = relationship("Tenant", back_populates="users")

class SysComponent(CoreBase):
    """Componentes React mapeados (ex: GENERIC_LIST)"""
    __tablename__ = "sys_components"
    __table_args__ = {"schema": "public"}
    
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True)
    name = Column(String)

class TenantArea(CoreBase):
    """Áreas do Menu (ex: Vendas, Configurações)"""
    __tablename__ = "tenant_areas"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("public.tenants.id"))
    label = Column(String)
    icon = Column(String)
    order = Column(Integer, default=0)

    pages = relationship("TenantPage", back_populates="area", order_by="TenantPage.order")

class TenantPage(CoreBase):
    """Páginas dinâmicas"""
    __tablename__ = "tenant_pages"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True)
    area_id = Column(Integer, ForeignKey("public.tenant_areas.id"))
    component_id = Column(Integer, ForeignKey("public.sys_components.id"))
    label = Column(String)
    path = Column(String)
    order = Column(Integer, default=0)
    config_json = Column(JSON, default={}) # O Segredo do Server-Driven UI

    area = relationship("TenantArea", back_populates="pages")
    component = relationship("SysComponent")

# --- TENANT SCHEMA (Dados de Negócio) ---

TenantBase = declarative_base()

class Client(TenantBase):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    trade_name = Column(String)
    email = Column(String)
    document = Column(String)

class Order(TenantBase):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    total_value = Column(Float)
    status = Column(String, default="draft")