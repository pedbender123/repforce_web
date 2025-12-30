from sqlalchemy import Column, String, Boolean, Float, DateTime, Text, JSON, ForeignKey, func, Integer 
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
    representative_id = Column(Integer) # ID from GlobalUser
    
    status = Column(String, default="draft", index=True)
    total_value = Column(Float, default=0.0)
    
    # Items and Snapshots stored in JSONB for flexibility and performance
    # Schema: { "items": [ { "product_id": "...", "qty": 1, "price": 10.0 } ] }
    data = Column(JSONB, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(BaseCrm):
    __tablename__ = "order_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    net_unit_price = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")



class ProductCategory(BaseCrm):
    __tablename__ = "products_categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    
class Product(BaseCrm):
    __tablename__ = "products"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    sku = Column(String)
    price = Column(Float)
    specs = Column(JSONB, default={}) # Flexible specs
    category_id = Column(UUID(as_uuid=True), ForeignKey("products_categories.id"))
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"))
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"))

    brand = relationship("Brand", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")

class Brand(BaseCrm):
    __tablename__ = "brands"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    products = relationship("Product", back_populates="brand")

class Supplier(BaseCrm):
    __tablename__ = "suppliers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    products = relationship("Product", back_populates="supplier")

class DiscountRule(BaseCrm):
    __tablename__ = "discount_rules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    conditions = Column(JSONB, default={}) # Logic for discount
    effect = Column(JSONB, default={}) # What happens
    
    # Legacy/Simple support
    type = Column(String, default="value")
    discount_percent = Column(Float, default=0.0)
    active = Column(Boolean, default=True)

class CustomFieldConfig(BaseCrm):
    __tablename__ = "custom_fields_config"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity = Column(String, index=True) # client, order, product
    key = Column(String, index=True)
    label = Column(String)
    type = Column(String) # text, number, select, etc.
    options = Column(JSONB, default=[]) # For select fields
    required = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    
class Task(BaseCrm):
    __tablename__ = "tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String)
    status = Column(String)
    
class WebhookSubscription(BaseCrm):
    __tablename__ = "webhook_subscriptions"
    
    # event_type is key (e.g., 'order.created')
    event_type = Column(String, primary_key=True) 
    target_url = Column(String)
    active = Column(Boolean, default=True)

class Area(BaseCrm):
    __tablename__ = "areas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    icon = Column(String, nullable=True)
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Store list of allowed paths/labels: [{"label": "Clientes", "path": "/crm/clients"}, ...]
    pages_json = Column(JSONB, default=[])
