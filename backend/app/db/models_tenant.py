from sqlalchemy import Column, String, Boolean, Float, DateTime, Text, JSON, ForeignKey, func 
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.session import BaseCrm
import uuid

# Base implementation for all Tenant Models
# They will be schema-agnostic in Python, but deployed to "tenant_X" schema in DB.

class Client(BaseCrm):
    __tablename__ = "clients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    
    # Core Fields (Indexed for search)
    # Custom/Flex Fields -> JSONB
    content = Column(JSONB, default={}) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    orders = relationship("Order", back_populates="client")

class Order(BaseCrm):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    
    status = Column(String, default="draft", index=True)
    total_value = Column(Float, default=0.0)
    
    # Items and Snapshots stored in JSONB for flexibility and performance
    # Schema: { "items": [ { "product_id": "...", "qty": 1, "price": 10.0 } ] }
    data = Column(JSONB, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", back_populates="orders")

class WebhookSubscription(BaseCrm):
    __tablename__ = "webhook_subscriptions"
    
    # event_type is key (e.g., 'order.created')
    event_type = Column(String, primary_key=True) 
    target_url = Column(String)
    active = Column(Boolean, default=True)
