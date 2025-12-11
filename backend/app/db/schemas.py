from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    tenant_id: Optional[int] = None

class User(BaseModel):
    id: int
    username: str
    email: Optional[str]
    is_sysadmin: bool
    class Config:
        from_attributes = True

# Tenant
class TenantCreate(BaseModel):
    name: str
    slug: str
    sysadmin_email: EmailStr
    sysadmin_password: str
    tenant_type: str = "industry"

class Tenant(BaseModel):
    id: int
    name: str
    slug: str
    status: str
    class Config:
        from_attributes = True

# Navigation
class TenantPage(BaseModel):
    label: str
    path: str
    component_key: Optional[str] = None
    config_json: Dict[str, Any] = {}
    class Config:
        from_attributes = True

class TenantArea(BaseModel):
    id: int
    label: str
    icon: str
    pages: List[TenantPage] = []
    class Config:
        from_attributes = True

# Business
class Client(BaseModel):
    id: int
    name: str
    trade_name: Optional[str]
    email: Optional[str]
    document: Optional[str]
    class Config:
        from_attributes = True