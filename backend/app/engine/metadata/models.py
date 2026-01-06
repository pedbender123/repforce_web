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
    tenant = relationship("app.system.models.models.Tenant")
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
