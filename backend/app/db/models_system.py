from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class GlobalUser(Base):
    __tablename__ = "global_users"
    __table_args__ = {"schema": "public"}
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, index=True) # Optional or required, but username is primary login
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_sysadmin = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    memberships = relationship("Membership", back_populates="user")
    
    role_id = Column(Integer, ForeignKey("public.roles.id"), nullable=True) # Linked to Role 
    role_obj = relationship("Role", foreign_keys=[role_id])

class Tenant(Base):
    __tablename__ = "tenants"
    __table_args__ = {"schema": "public"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True) # Critical for routing
    plan_type = Column(String, default="trial")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Legacy Fields Support
    cnpj = Column(String, nullable=True)
    commercial_info = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    status = Column(String, default="active")
    tenant_type = Column(String, default="industry")
    demo_mode_start = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    memberships = relationship("Membership", back_populates="tenant")
    invites = relationship("Invite", back_populates="tenant")

class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = {"schema": "public"}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("public.global_users.id")) # Explicit schema
    tenant_id = Column(Integer, ForeignKey("public.tenants.id")) # Explicit schema
    role = Column(String, default="user") # 'owner', 'admin', 'user' - Global Tenant Role
    
    user = relationship("GlobalUser", back_populates="memberships")
    tenant = relationship("Tenant", back_populates="memberships")

class Invite(Base):
    __tablename__ = "invites"
    __table_args__ = {"schema": "public"}
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    email = Column(String)
    tenant_id = Column(Integer, ForeignKey("public.tenants.id"))
    role = Column(String, default="user")
    expires_at = Column(DateTime)
    
    tenant = relationship("Tenant", back_populates="invites")

class ShadowBackup(Base):
    __tablename__ = "shadow_backups"

    id = Column(Integer, primary_key=True, index=True)
    tenant_slug = Column(String, index=True)
    table_name = Column(String, index=True)
    record_id = Column(String) # UUID or Int as string
    data = Column(Text) # JSON string (Text for storage safety in generic SQL, or JSONB if Postgres specific)
    # Let's use JSONB since we are Postgres 15+
    # But Base imports need JSONB.
    # For now, Text is simplest and robust.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ApiKey(Base):
    __tablename__ = "api_keys"
    __table_args__ = {"schema": "public"}
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    name = Column(String) 
    tenant_id = Column(Integer, ForeignKey("public.tenants.id"))
    is_active = Column(Boolean, default=True)
    scopes = Column(Text, default="crm_full") # JSON not strictly needed for MVP
    
    tenant = relationship("Tenant")

from sqlalchemy import Table, JSON, Enum
import enum

class AccessLevel(str, enum.Enum):
    GLOBAL = "global"
    TEAM = "team"
    OWN = "own"

# Association Table
role_area_association = Table(
    'role_area_association',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('public.roles.id')),
    Column('area_id', Integer, ForeignKey('public.areas.id')),
    schema='public'
)

class Area(Base):
    __tablename__ = "areas"
    __table_args__ = {"schema": "public"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    icon = Column(String, nullable=True)
    pages_json = Column(JSON, default=[]) 
    
    tenant_id = Column(Integer, ForeignKey("public.tenants.id"))
    tenant = relationship("Tenant")
    
    roles = relationship("Role", secondary=role_area_association, back_populates="areas")

class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "public"}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String, nullable=True)
    access_level = Column(String, default=AccessLevel.OWN)
    
    tenant_id = Column(Integer, ForeignKey("public.tenants.id"))
    tenant = relationship("Tenant")
    
    areas = relationship("Area", secondary=role_area_association, back_populates="roles")

class UserGridPreference(Base):
    __tablename__ = "user_grid_preferences"
    __table_args__ = {"schema": "public"}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("public.global_users.id"))
    grid_id = Column(String, index=True)
    columns_json = Column(JSON, default=[])
