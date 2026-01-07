from sqlalchemy import Column, String, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.shared.database import Base

class EntityRecord(Base):
    """
    Universal Table for storing dynamic entity data.
    Instead of creating a physical table for each entity, fields are stored in 'data' JSONB.
    This allows for true runtime schema changes without DDL locks.
    Physical tables can still be used for high-performance entities if needed.
    """
    __tablename__ = "entity_records"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    
    # Links to the MetaEntity definition
    entity_id = Column(UUID(as_uuid=True), ForeignKey("public.meta_entities.id", ondelete="CASCADE"), nullable=False)
    
    # The dynamic data payload
    data = Column(JSONB, default={})
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    entity_definition = relationship("app.engine.metadata.models.MetaEntity")
