from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.shared import database as session
from app.system import models as models_system
from fastapi.security import OAuth2PasswordBearer
from app.shared import security
from pydantic import BaseModel
from typing import Optional, List
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

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_id: UUID

class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    is_completed: bool
    
    class Config:
        from_attributes = True

@router.get("/me", response_model=List[TaskResponse])
def get_my_tasks(
    db: Session = Depends(session.get_db),
    current_user: models_system.GlobalUser = Depends(get_current_user)
):
    return db.query(models_system.GlobalTask)\
             .filter(models_system.GlobalTask.assignee_id == current_user.id)\
             .filter(models_system.GlobalTask.is_completed == False)\
             .all()

@router.post("/", response_model=TaskResponse)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(session.get_db),
    current_user: models_system.GlobalUser = Depends(get_current_user)
):
    # Security: In strict mode, check if assignee belongs to same tenant.
    # For now (MVP), just check if user exists.
    assignee = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.id == payload.assignee_id).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee not found")

    new_task = models_system.GlobalTask(
        title=payload.title,
        description=payload.description,
        assignee_id=payload.assignee_id,
        is_completed=False
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.put("/{task_id}/complete")
def complete_task(
    task_id: UUID,
    db: Session = Depends(session.get_db),
    current_user: models_system.GlobalUser = Depends(get_current_user)
):
    task = db.query(models_system.GlobalTask).filter(models_system.GlobalTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Only assignee or superuser can complete? Or creator? 
    # Let's say assignee or creator (if we tracked it, but we dont). 
    # Let's restrict to assignee for now.
    if task.assignee_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    task.is_completed = True
    db.commit()
    return {"status": "ok"}
