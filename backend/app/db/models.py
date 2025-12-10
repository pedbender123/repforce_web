from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql.schema import MetaData

# Base compartilhada para metadados
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}
metadata = MetaData(naming_convention=convention)

# --- CORE MODELS (Schema: public) ---
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
    tenant = relationship("Tenant", back_populates="users")

class SysComponent(CoreBase):
    __tablename__ = "sys_components"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    default_path = Column(String, nullable=False)

class TenantArea(CoreBase):
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
    __tablename__ = "tenant_pages"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("public.tenant_areas.id"), nullable=False)
    component_id = Column(Integer, ForeignKey("public.sys_components.id"), nullable=False)
    label = Column(String, nullable=False)
    path_override = Column(String, nullable=True)
    order = Column(Integer, default=0)

    area = relationship("TenantArea", back_populates="pages")
    component = relationship("SysComponent")


# --- TENANT MODELS (Schema: dinâmico) ---
TenantBase = declarative_base(metadata=metadata)

class Client(TenantBase):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, index=True)
    phone = Column(String)
    document = Column(String)
    address = Column(String)
    city = Column(String)

    # Relacionamento com Contatos
    contacts = relationship("Contact", back_populates="client", cascade="all, delete-orphan")

class Contact(TenantBase):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    role = Column(String) # Ex: Gerente, Comprador
    
    client = relationship("Client", back_populates="contacts")

class Product(TenantBase):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sku = Column(String, index=True, unique=True)
    price = Column(Integer)
    stock_quantity = Column(Integer, default=0)
    description = Column(String, nullable=True)

class Order(TenantBase):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    total_amount = Column(Integer, default=0)
    status = Column(String, default="draft")
    created_at = Column(String)
    
    items = relationship("OrderItem", back_populates="order")
    client = relationship("Client")

class OrderItem(TenantBase):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    unit_price = Column(Integer)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")