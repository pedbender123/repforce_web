from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime

class MetaFieldBase(BaseModel):
    name: str
    label: str
    field_type: str
    is_required: bool = False
    options: Optional[Any] = None
    formula: Optional[str] = None
    is_virtual: bool = False

class MetaFieldCreate(MetaFieldBase):
    pass

class MetaFieldUpdate(BaseModel):
    label: Optional[str] = None
    # We allow renaming the column physically, so we accept 'name' but treat is as rename
    name: Optional[str] = None
    # Changing types is dangerous, but we might allow it later. For now, just label/name.
    formula: Optional[str] = None
    is_virtual: Optional[bool] = None

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

class MetaPageUpdate(BaseModel):
    name: Optional[str] = None
    layout_config: Optional[Dict[str, Any]] = None
    order: Optional[int] = None

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

class MetaNavigationGroupUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None

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

# --- View Schemas ---

class MetaViewBase(BaseModel):
    name: str
    filters: Optional[List[Dict[str, Any]]] = []
    columns: Optional[List[str]] = []
    sort: Optional[Dict[str, Any]] = {}

class MetaViewCreate(MetaViewBase):
    pass

class MetaViewResponse(MetaViewBase):
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

class MetaEntityUpdate(BaseModel):
    display_name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None

class MetaEntityResponse(MetaEntityBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    fields: List[MetaFieldResponse] = []
    views: List[MetaViewResponse] = []
    
    class Config:
        from_attributes = True

# --- Action Schemas ---

class MetaActionBase(BaseModel):
    trigger_source: str
    trigger_context: str
    name: str
    action_type: str
    config: Optional[Dict[str, Any]] = {}

class MetaActionCreate(MetaActionBase):
    pass

class MetaActionUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class MetaActionResponse(MetaActionBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
# --- Trail Schemas ---

class MetaTrailBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    trigger_type: str = "MANUAL" # MANUAL, DB_EVENT, WEBHOOK, SCHEDULE
    trigger_config: Optional[Dict[str, Any]] = {}
    local_variables: Optional[List[Dict[str, str]]] = [] # [{name: 'var1', type: 'TEXT'}]
    nodes: Optional[Dict[str, Any]] = {}

class MetaTrailCreate(MetaTrailBase):
    pass

class MetaTrailUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    trigger_type: Optional[str] = None
    trigger_config: Optional[Dict[str, Any]] = None
    nodes: Optional[Dict[str, Any]] = None

class MetaTrailResponse(MetaTrailBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
