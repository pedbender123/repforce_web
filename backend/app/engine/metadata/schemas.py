from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime

class MetaFieldBase(BaseModel):
    name: str
    label: str
    field_type: str
    is_required: bool = False
    options: Optional[List[str]] = None

class MetaFieldCreate(MetaFieldBase):
    pass

class MetaFieldResponse(MetaFieldBase):
    id: UUID
    entity_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Navigation Schemas ---

class MetaPageBase(BaseModel):
    name: str
    type: str = "list"
    entity_id: Optional[UUID] = None
    layout_config: Optional[Dict[str, Any]] = {}
    order: int = 0

class MetaPageCreate(MetaPageBase):
    pass

class MetaPageResponse(MetaPageBase):
    id: UUID
    group_id: UUID
    
    class Config:
        from_attributes = True

class MetaNavigationGroupBase(BaseModel):
    name: str
    icon: str = "Circle"
    order: int = 0

class MetaNavigationGroupCreate(MetaNavigationGroupBase):
    pass

class MetaNavigationGroupResponse(MetaNavigationGroupBase):
    id: UUID
    pages: List[MetaPageResponse] = []
    
    class Config:
        from_attributes = True

# --- Workflow Schemas ---

class MetaWorkflowBase(BaseModel):
    trigger_type: str
    name: Optional[str] = None
    webhook_url: str
    is_active: bool = True

class MetaWorkflowCreate(MetaWorkflowBase):
    entity_id: UUID

class MetaWorkflowResponse(MetaWorkflowBase):
    id: UUID
    entity_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class MetaEntityBase(BaseModel):
    slug: str
    display_name: str
    icon: Optional[str] = "Database"
    is_system: bool = False

class MetaEntityCreate(MetaEntityBase):
    pass

class MetaEntityResponse(MetaEntityBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    fields: List[MetaFieldResponse] = []
    views: List[MetaViewResponse] = []
    
    class Config:
        from_attributes = True
