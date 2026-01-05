import uuid
import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum, DateTime, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.shared.database import BaseCrm

class MetaEntityType(str, enum.Enum):
    SYSTEM = "system"  # Maps to physical tables like 'products'
    CUSTOM = "custom"  # Maps to EntityRecords (JSONB)

class FieldType(str, enum.Enum):
    TEXT = "text"
    NUMBER = "number"
    CURRENCY = "currency"
    DATE = "date"
    DATETIME = "datetime"
    BOOLEAN = "boolean"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    REFERENCE = "reference_to_entity"
    IMAGE = "image"
    FILE = "file"

class MetaEntity(BaseCrm):
    __tablename__ = "meta_entities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True) # slug: e.g., 'product'
    display_name = Column(String)
    description = Column(String, nullable=True)
    entity_type = Column(Enum(MetaEntityType), default=MetaEntityType.CUSTOM)
    is_system = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    fields = relationship("MetaField", back_populates="entity", cascade="all, delete-orphan")
    views = relationship("MetaView", back_populates="entity", cascade="all, delete-orphan")

class MetaField(BaseCrm):
    __tablename__ = "meta_fields"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("meta_entities.id"))
    
    name = Column(String, index=True) # slug: e.g., 'price'
    label = Column(String) # display: e.g., 'Preço'
    type = Column(Enum(FieldType), default=FieldType.TEXT)
    
    options = Column(JSONB, default={}) # validation rules, select options, etc.
    is_required = Column(Boolean, default=False)
    is_system = Column(Boolean, default=False)
    
    entity = relationship("MetaEntity", back_populates="fields")

class ViewType(str, enum.Enum):
    LIST = "list"
    DETAIL = "detail"
    FORM = "form"
    KANBAN = "kanban"

class MetaView(BaseCrm):
    __tablename__ = "meta_views"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("meta_entities.id"))
    
    name = Column(String)
    type = Column(Enum(ViewType), default=ViewType.LIST)
    config = Column(JSONB, default={}) # column order, default filters, etc.
    
    is_default = Column(Boolean, default=False)
    
    entity = relationship("MetaEntity", back_populates="views")

class EntityRecord(BaseCrm):
    """
    Híbrido: Usado para armazenar dados de entidades CUSTOM.
    Entidades SYSTEM continuam em suas próprias tabelas.
    """
    __tablename__ = "entity_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("meta_entities.id"))
    
    # Armazenamento genérico
    data = Column(JSONB, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Audit fields
    created_by = Column(UUID(as_uuid=True), nullable=True)
