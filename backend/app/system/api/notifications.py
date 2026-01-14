from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.shared import database as session
from app.system import models as models_system
from fastapi.security import OAuth2PasswordBearer
from app.shared import security
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(session.get_db)):
    try:
        payload = security.decode_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = payload.get("sub")
        user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

class NotificationCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_id: UUID
    resource_link: Optional[Dict[str, Any]] = None

class NotificationResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    is_read: bool # Replaces is_completed
    resource_link: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True

@router.get("/me", response_model=List[NotificationResponse])
def get_my_notifications(
    db: Session = Depends(session.get_db),
    current_user: models_system.GlobalUser = Depends(get_current_user),
    unread_only: bool = False
):
    query = db.query(models_system.Notification)\
             .filter(models_system.Notification.assignee_id == current_user.id)
             
    if unread_only:
        query = query.filter(models_system.Notification.is_read == False)
        
    return query.order_by(models_system.Notification.created_at.desc()).all()

@router.post("/", response_model=NotificationResponse)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(session.get_db),
    current_user: models_system.GlobalUser = Depends(get_current_user)
):
    assignee = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.id == payload.assignee_id).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee not found")

    new_notif = models_system.Notification(
        title=payload.title,
        description=payload.description,
        assignee_id=payload.assignee_id,
        resource_link=payload.resource_link,
        is_read=False
    )
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return new_notif

@router.put("/{notif_id}/read")
def mark_as_read(
    notif_id: UUID,
    db: Session = Depends(session.get_db),
    current_user: models_system.GlobalUser = Depends(get_current_user)
):
    notif = db.query(models_system.Notification).filter(models_system.Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if notif.assignee_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    notif.is_read = True
    db.commit()
    return {"status": "ok"}
