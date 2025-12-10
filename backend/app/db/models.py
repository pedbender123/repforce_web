from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, Date, Float
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql.schema import MetaData

# Convenção de nomes para Constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}
metadata = MetaData(naming_convention=convention)

# ==========================================
# CORE MODELS (Schema: public)
# ==========================================
CoreBase = declarative_base(metadata=metadata)

class Tenant(CoreBase):
    __tablename__ = "tenants"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    schema_name = Column(String, unique=True, nullable=False)
    status = Column(String, default="active") 

    users = relationship("User", back_populates="tenant")
    areas = relationship("TenantArea", back_populates="tenant", cascade="all, delete-orphan")

class Role(CoreBase):
    __tablename__ = "roles"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False) 
    permissions_json = Column(JSON, default={}) 

    users = relationship("User", back_populates="role")

class User(CoreBase):
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_sysadmin = Column(Boolean, default=False)
    
    tenant_id = Column(Integer, ForeignKey("public.tenants.id"), nullable=True)
    role_id = Column(Integer, ForeignKey("public.roles.id"), nullable=True)

    tenant = relationship("Tenant", back_populates="users")
    role = relationship("Role", back_populates="users")

# --- UI Dinâmica (Server-Driven) ---

class SysComponent(CoreBase):
    """Componentes/Templates React disponíveis"""
    __tablename__ = "sys_components"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False) # ex: GENERIC_LIST
    name = Column(String, nullable=False)

class TenantArea(CoreBase):
    """Áreas do Menu (ex: SysAdmin, Vendas)"""
    __tablename__ = "tenant_areas"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("public.tenants.id"), nullable=False)
    label = Column(String, nullable=False)
    icon = Column(String, nullable=False) 
    order = Column(Integer, default=0)

    tenant = relationship("Tenant", back_populates="areas")
    pages = relationship("TenantPage", back_populates="area", order_by="TenantPage.order", cascade="all, delete-orphan")

class TenantPage(CoreBase):
    """Páginas configuráveis"""
    __tablename__ = "tenant_pages"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("public.tenant_areas.id"), nullable=False)
    component_id = Column(Integer, ForeignKey("public.sys_components.id"), nullable=False)
    
    label = Column(String, nullable=False)
    path = Column(String, nullable=False) # URL da rota (ex: /sysadmin/tenants)
    order = Column(Integer, default=0)
    
    # A MÁGICA: Aqui salvamos o JSON que define as colunas e campos do GenericListForm
    config_json = Column(JSON, default={}) 

    area = relationship("TenantArea", back_populates="pages")
    component = relationship("SysComponent")

# ==========================================
# TENANT MODELS (Schema: Dinâmico)
# ==========================================
TenantBase = declarative_base(metadata=metadata)

class Client(TenantBase):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    trade_name = Column(String, index=True)
    email = Column(String, index=True)
    phone = Column(String)
    document = Column(String)
    address_json = Column(JSON, nullable=True) 
    status = Column(String, default="active")
    contacts = relationship("Contact", back_populates="client", cascade="all, delete-orphan")

class Contact(TenantBase):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    role = Column(String)
    is_primary = Column(Boolean, default=False)
    client = relationship("Client", back_populates="contacts")

class Supplier(TenantBase):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String)
    phone = Column(String)
    document = Column(String)

class Product(TenantBase):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sku = Column(String, index=True, unique=True)
    price = Column(Float)
    cost_price = Column(Float, default=0.0)
    stock_quantity = Column(Integer, default=0)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier")

class Order(TenantBase):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    representative_id = Column(Integer)
    total_value = Column(Float, default=0.0)
    margin_value = Column(Float, default=0.0)
    status = Column(String, default="draft")
    created_at = Column(Date)
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    client = relationship("Client")

class OrderItem(TenantBase):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    unit_price = Column(Float)
    subtotal = Column(Float)
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class Route(TenantBase):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    representative_id = Column(Integer) 
    name = Column(String)
    date = Column(Date)
    status = Column(String, default="planned") 
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")

class RouteStop(TenantBase):
    __tablename__ = "route_stops"
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    sequence = Column(Integer)
    status = Column(String, default="pending")
    notes = Column(String, nullable=True)
    route = relationship("Route", back_populates="stops")
    client = relationship("Client")