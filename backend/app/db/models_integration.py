from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .models_crm import BaseCrm

class ApiKey(BaseCrm):
    """
    Chaves de API para acesso Machine-to-Machine (ex: n8n -> Repforce).
    Escopo: Tenant Level.
    """
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # Ex: "n8n Integration"
    key_hash = Column(String, index=True) # Hash da chave para verificação
    prefix = Column(String) # Primeiros caracteres para display (ex: "sk_live_123...")
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Permissions
    scopes = Column(JSON, default=[]) # ["orders:read", "products:write"]

class WebhookConfig(BaseCrm):
    """
    Configuração de Webhooks de Saída (Repforce -> n8n).
    Dispara eventos para URLs externas.
    """
    __tablename__ = "webhook_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # Ex: "Order Created -> n8n"
    url = Column(String) # Target URL
    secret = Column(String, nullable=True) # Hmac Secret
    
    events = Column(JSON) # List of events: ["order.created", "client.updated"]
    api_headers = Column(JSON, default={}) # Custom headers Authorization, etc.
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
