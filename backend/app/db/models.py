from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Text, Enum, JSON, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum

# Enums
class UserRole(str, enum.Enum):
    SYSADMIN = "sysadmin"
    ADMIN = "admin"
    SALES_REP = "sales_rep"

class AccessLevel(str, enum.Enum):
    GLOBAL = "global"
    TEAM = "team"
    OWN = "own"

# --- TABELAS DE ASSOCIAÇÃO (Many-to-Many) ---

# Tabela de ligação: Um Cargo pode ter várias Áreas, e uma Área pode estar em vários Cargos
role_area_association = Table(
    'role_area_association',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id')),
    Column('area_id', Integer, ForeignKey('areas.id'))
)

# --- CORE ---
class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cnpj = Column(String, unique=True, index=True)
    status = Column(String, default="active") 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    tenant_type = Column(String, default="industry") 
    commercial_info = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    
    users = relationship("User", back_populates="tenant")
    # CRM relationships removed (products, clients, orders, suppliers, routes)
    
    # Novos relacionamentos de configuração
    roles = relationship("Role", back_populates="tenant")
    areas = relationship("Area", back_populates="tenant")

class Area(Base):
    """
    Representa uma Área de Trabalho (ex: Vendas, SAC, Estoque).
    Contém uma lista de páginas (menu items) em JSON.
    """
    __tablename__ = "areas"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # Ex: "Vendas", "SAC"
    icon = Column(String, nullable=True) # Ex: "ShoppingCart", "Phone"
    
    # Estrutura JSON esperada: [{"label": "Novo Pedido", "path": "/app/orders/new"}, ...]
    pages_json = Column(JSON, default=[]) 
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="areas")
    
    roles = relationship("Role", secondary=role_area_association, back_populates="areas")

class Role(Base):
    """
    Representa um Cargo (ex: Vendedor, Gerente, Atendente).
    Define quais Áreas o usuário pode ver.
    """
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # Ex: "Vendedor Externo"
    description = Column(String, nullable=True)
    
    # Novo: Nível de Acesso (Escopo)
    access_level = Column(String, default=AccessLevel.OWN) # global, team, own
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="roles")
    
    areas = relationship("Area", secondary=role_area_association, back_populates="roles")
    users = relationship("User", back_populates="role_obj")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, index=True)
    hashed_password = Column(String)
    name = Column(String)
    full_name = Column(String, nullable=True)
    
    # Mantemos 'profile' para distinguir SysAdmin vs Usuário de Tenant
    profile = Column(String, default="sales_rep") 
    is_active = Column(Boolean, default=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    tenant = relationship("Tenant", back_populates="users")
    
    # Novo: Link para o Cargo (Role)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    role_obj = relationship("Role", back_populates="users")

    # CRM relationships removed (orders, routes, clients)