from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text, Enum, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.shared.database import Base
import uuid
import enum

# Enums
class TenantStatus(str, enum.Enum):
    setup_pending = "setup_pending"
    active = "active"
    suspended = "suspended"

class AccessLevel(str, enum.Enum):
    GLOBAL = "global"
    TEAM = "team"
    OWN = "own"

# 1. Global Users (Authentication)
class GlobalUser(Base):
    __tablename__ = "global_users"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True) # Primary Login Key
    password_hash = Column(String)
    
    # Notification & Recovery only - NOT for login
    recovery_email = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False) # Replaces is_sysadmin
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    memberships = relationship("Membership", back_populates="user")
    
    # Legacy/Direct Links (Optional but useful for simple setups)
    role_id = Column(UUID(as_uuid=True), ForeignKey("public.roles.id"), nullable=True)
    role_obj = relationship("Role", foreign_keys=[role_id])
    
    tasks = relationship("GlobalTask", back_populates="assignee")

class GlobalTask(Base):
    __tablename__ = "global_tasks"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("public.global_users.id"), nullable=True)
    assignee = relationship("GlobalUser", back_populates="tasks")

# 2. Tenants (SaaS Units)
class Tenant(Base):
    __tablename__ = "tenants"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String, unique=True, index=True) # URL routing
    name = Column(String, index=True)
    

    
    status = Column(Enum(TenantStatus), default=TenantStatus.setup_pending)
    fiscal_data = Column(JSONB, default={}) # CNPJ, Address, etc.
    
    plan_type = Column(String, default="trial")
    is_active = Column(Boolean, default=True)
    
    # Legacy Support / Extra metadata
    commercial_info = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    demo_mode_start = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    memberships = relationship("Membership", back_populates="tenant")
    invites = relationship("Invite", back_populates="tenant")

# 3. Memberships (User <-> Tenant)
class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("public.global_users.id"))
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id"))
    role = Column(String, default="user")
    
    user = relationship("GlobalUser", back_populates="memberships")
    tenant = relationship("Tenant", back_populates="memberships")

# 4. RBAC (Roles & Areas)
from sqlalchemy import Table

role_area_association = Table(
    'role_area_association',
    Base.metadata,
    Column('role_id', UUID(as_uuid=True), ForeignKey('public.roles.id')),
    Column('area_id', UUID(as_uuid=True), ForeignKey('public.areas.id')),
    schema='public'
)

class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    description = Column(String, nullable=True)
    access_level = Column(Enum(AccessLevel), default=AccessLevel.OWN)
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id"))
    tenant = relationship("Tenant")
    
    areas = relationship("Area", secondary=role_area_association, back_populates="roles")

class Area(Base):
    __tablename__ = "areas"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    icon = Column(String, nullable=True)
    pages_json = Column(JSONB, default=[]) 
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id"))
    tenant = relationship("Tenant")
    
    roles = relationship("Role", secondary=role_area_association, back_populates="areas")

# 5. Invites
class Invite(Base):
    __tablename__ = "invites"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, index=True)
    email = Column(String) # For sending the invite
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id"))
    role = Column(String, default="user")
    expires_at = Column(DateTime)
    
    tenant = relationship("Tenant", back_populates="invites")

# 6. API Keys
class ApiKey(Base):
    __tablename__ = "api_keys"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, unique=True, index=True)
    name = Column(String) 
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id"))
    is_active = Column(Boolean, default=True)
    scopes = Column(Text, default="crm_full")
    
    tenant = relationship("Tenant")

# 7. Shadow Backup
class ShadowBackup(Base):
    __tablename__ = "shadow_backups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_slug = Column(String, index=True)
    table_name = Column(String, index=True)
    record_id = Column(String)
    data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 8. Preferences
class UserGridPreference(Base):
    __tablename__ = "user_grid_preferences"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("public.global_users.id"))
    grid_id = Column(String, index=True)
    columns_json = Column(JSONB, default=[])
