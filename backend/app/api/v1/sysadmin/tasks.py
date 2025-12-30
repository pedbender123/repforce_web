from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import session, models_system
from app.core import security
from app.api import deps
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter()

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    is_completed: bool

class TaskOut(TaskBase):
    id: uuid.UUID
    is_completed: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

# Dependency for SysAdmin
def get_sysadmin_user(token: str = Depends(security.oauth2_scheme), db: Session = Depends(session.get_db_sys)):
    # Simple check, real implementation should reuse logic from auth (decode token)
    # But SysAdminAuthContext sends custom 'Authorization: Bearer <sysadmin_token>'
    # We'll rely on our auth system or implement quickly here:
    # ideally we import logic from v1/auth.py or use a shared dependency.
    # For now, let's assume security.get_current_user works if we pass the right key?
    # Actually, v1/auth.py issues tokens with is_superuser=True.
    
    # Implementing minimal decoding here as we don't have a shared 'get_current_sysadmin' readily available in deps
    try:
        payload = security.decode_token(token)
        user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == payload.get("sub")).first()
        if not user or not user.is_superuser:
            raise HTTPException(status_code=403, detail="Not authorized")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    completed: bool = False,
    db: Session = Depends(session.get_db_sys), 
    current_user: models_system.GlobalUser = Depends(get_sysadmin_user)
):
    """
    List tasks. By default lists ONLY pending tasks (is_completed=False).
    If completed=True, lists ONLY completed tasks.
    """
    tasks = db.query(models_system.GlobalTask)\
        .filter(models_system.GlobalTask.is_completed == completed)\
        .order_by(models_system.GlobalTask.created_at.desc())\
        .all()
    return tasks

@router.post("/", response_model=TaskOut)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(session.get_db_sys),
    current_user: models_system.GlobalUser = Depends(get_sysadmin_user)
):
    task = models_system.GlobalTask(
        title=task_in.title,
        description=task_in.description,
        assignee_id=current_user.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: uuid.UUID,
    task_update: TaskUpdate,
    db: Session = Depends(session.get_db_sys),
    current_user: models_system.GlobalUser = Depends(get_sysadmin_user)
):
    task = db.query(models_system.GlobalTask).filter(models_system.GlobalTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.is_completed = task_update.is_completed
    db.commit()
    db.refresh(task)
    return task
