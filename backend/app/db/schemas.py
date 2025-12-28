from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- TOKEN ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    is_sysadmin: bool = False

# --- TENANT (Simplified for List) ---
class TenantRef(BaseModel):
    id: int
    name: str
    slug: str
    plan_type: str
    
    class Config:
        orm_mode = True

# --- MEMBERSHIP ---
class MembershipRef(BaseModel):
    role: str
    tenant: TenantRef
    
    class Config:
        orm_mode = True

# --- USER ---
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_sysadmin: bool = False
    created_at: Optional[datetime]
    
    # List of memberships to show available tenants in Lobby
    memberships: List[MembershipRef] = []

    class Config:
        orm_mode = True

# --- LEGACY SUPPORT (Optional, if needed) ---
# ...