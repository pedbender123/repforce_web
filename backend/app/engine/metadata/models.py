from sqlalchemy import Column, String, Boolean, ForeignKey, Integer, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.shared.database import Base

class MetaEntity(Base):
    __tablename__ = "meta_entities"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    
    slug = Column(String, nullable=False) # Nome técnico (ex: visitas_tecnicas)
    display_name = Column(String, nullable=False) # Nome visual (ex: "Visitas Técnicas")
    is_system = Column(Boolean, default=False) # Tabelas nativas não deletáveis
    icon = Column(String, default="Database")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("app.system.models.Tenant")
    fields = relationship("MetaField", back_populates="entity", cascade="all, delete-orphan")
    views = relationship("MetaView", back_populates="entity", cascade="all, delete-orphan")

class MetaField(Base):
    __tablename__ = "meta_fields"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("public.meta_entities.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False) # Nome coluna DB
    label = Column(String, nullable=False) # Label Visual
    field_type = Column(String, nullable=False) # text, number, date, select ...
    is_required = Column(Boolean, default=False)
    options = Column(JSON, nullable=True) # Para selects
    
    # Formula Engine
    formula = Column(String, nullable=True) # Expressão: [Preco] * [Qtd]
    is_virtual = Column(Boolean, default=False) # Se True, não persiste (On-Read). Se False, persiste (Snapshot).
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    entity = relationship("MetaEntity", back_populates="fields")

class MetaView(Base):
    __tablename__ = "meta_views"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("public.meta_entities.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False) # Ex: "Todos os Clientes", "Meus Pedidos"
    filters = Column(JSON, default=[]) # Ex: [{"field": "status", "op": "eq", "value": "active"}]
    columns = Column(JSON, default=[]) # Ex: ["name", "email", "status"] - Order matters
    sort = Column(JSON, default={}) # Ex: {"field": "created_at", "direction": "desc"}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    entity = relationship("MetaEntity", back_populates="views")

class MetaNavigationGroup(Base):
    __tablename__ = "meta_navigation_groups"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)
    icon = Column(String, default="Folder")
    order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    pages = relationship("MetaPage", back_populates="group", cascade="all, delete-orphan", order_by="MetaPage.order")
    tenant = relationship("app.system.models.Tenant")

class MetaPage(Base):
    __tablename__ = "meta_pages"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("public.meta_navigation_groups.id", ondelete="CASCADE"), nullable=False)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("public.meta_entities.id", ondelete="SET NULL"), nullable=True)
    
    name = Column(String, nullable=False)
    type = Column(String, default="list") # list, form, dashboard, blank
    layout_config = Column(JSON, default={})
    tabs_config = Column(JSON, default={})
    order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group = relationship("MetaNavigationGroup", back_populates="pages")
    entity = relationship("MetaEntity")

class MetaWorkflow(Base):
    __tablename__ = "meta_workflows"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("public.meta_entities.id", ondelete="CASCADE"), nullable=False)
    
    trigger_type = Column(String, nullable=False) # ON_CREATE, ON_UPDATE, ON_DELETE
    name = Column(String, nullable=True)
    webhook_url = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    entity = relationship("MetaEntity")

class MetaAction(Base):
    __tablename__ = "meta_actions"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    
    # UI or Virtual
    trigger_source = Column(String, nullable=False) # 'UI_BUTTON', 'LIST_CLICK', 'VIRTUAL_HOOK'
    trigger_context = Column(String, nullable=False) # PageID, or HookKey
    
    name = Column(String, nullable=False) # Button Label
    action_type = Column(String, nullable=False) # NAVIGATE, URL, WEBHOOK, XLSX, PDF, EMAIL, CREATE_ITEM, EDIT_ITEM, DELETE_ITEM
    
    # Config for the action
    config = Column(JSON, default={})
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("app.system.models.Tenant")

class MetaTrail(Base):
    __tablename__ = "meta_trails"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Core Graph Data
    # Structure: { "node_id": { "type": "ACTION", "action_type": "DB_UPDATE", "config": {...}, "next": "id" } }
    nodes = Column(JSON, default={}) 
    
    # Quick Access Metadata
    trigger_type = Column(String, nullable=False) # 'MANUAL', 'DB_EVENT', 'WEBHOOK', 'SCHEDULE'
    trigger_config = Column(JSON, default={}) # { "entity_id": "...", "event": "ON_CREATE" }
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("app.system.models.Tenant")
