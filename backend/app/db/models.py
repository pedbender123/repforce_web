from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Text, Enum, JSON, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from .models_system import Tenant, GlobalUser, ApiKey
import enum

# Backwards compatibility alias
User = GlobalUser

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
# Tenant is imported from models_system

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
    tenant = relationship("Tenant") # Simplified relationship
    
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
    tenant = relationship("Tenant")
    
    areas = relationship("Area", secondary=role_area_association, back_populates="roles")
    
    # User relationship here is tricky because User is Global.
    # But old User had 'role_id'.
    # GlobalUser doesn't have role_id (Membership has role as string).
    # So this relationship will likely fail if we try to access it via ORM unless we map GlobalUser.role_id (which doesn't exist anymore).
    # We must remove the User relationship or accept it breaks.
    # users = relationship("User", back_populates="role_obj") # DELETED

# User is imported from models_system

# ApiKey is imported from models_system

class UserGridPreference(Base):
    __tablename__ = "user_grid_preferences"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_users.id")) # Fixed FK
    grid_id = Column(String, index=True) # Ex: "product_list", "client_list"
    columns_json = Column(JSON, default=[]) # Ex: [{"field": "sku", "visible": true}, ...]
    
    # user = relationship("User", back_populates="grid_preferences")
    # For now, disable relationship back_populates if it causes issues, or fix User model.