from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database
from ..db import models_crm as models
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# --- SCHEMAS ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "system" # error, order, route, system
    related_id: Optional[int] = None
    link_url: Optional[str] = None
    assigned_user_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    status: str # open, completed, archived

class TaskOut(TaskBase):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# --- API ---

@router.get("/tasks", response_model=List[TaskOut])
def get_tasks(
    status: Optional[str] = "open",
    db: Session = Depends(database.get_crm_db)
):
    """
    Lista tarefas do tenant atual. 
    Por padrão retorna apenas as 'open'.
    """
    query = db.query(models.Task)
    if status:
        query = query.filter(models.Task.status == status)
    
    # --- DEBUG START ---
    try:
        from sqlalchemy import text
        # 1. Verifica Search Path
        sp = db.execute(text("SHOW search_path")).scalar()
        print(f"DEBUG[get_tasks]: Active Search Path: {sp}", flush=True)
        
        # 2. Verifica se a tabela existe no pg_catalog (Visibilidade Real)
        table_check = db.execute(text(f"SELECT count(*) FROM pg_tables WHERE schemaname = '{sp}' AND tablename = 'tasks'")).scalar()
        print(f"DEBUG[get_tasks]: Table 'tasks' in schema '{sp}' exists? {table_check}", flush=True)

        # 3. Tenta select raw explicito
        try:
            raw_count = db.execute(text("SELECT count(*) FROM tasks")).scalar()
            print(f"DEBUG[get_tasks]: Raw SELECT count(*) FROM tasks success: {raw_count}", flush=True)
        except Exception as e_raw:
             print(f"DEBUG[get_tasks]: Raw SELECT FROM tasks FAILED: {e_raw}", flush=True)

    except Exception as e_debug:
        print(f"DEBUG[get_tasks]: Debug block failed: {e_debug}", flush=True)
    # --- DEBUG END ---

    # Ordena por created_at desc
    return query.order_by(models.Task.created_at.desc()).all()

@router.post("/tasks", response_model=TaskOut, status_code=201)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(database.get_crm_db)
):
    db_task = models.Task(
        title=task_in.title,
        description=task_in.description,
        type=task_in.type,
        related_id=task_in.related_id,
        link_url=task_in.link_url,
        assigned_user_id=task_in.assigned_user_id,
        status="open"
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.patch("/tasks/{task_id}", response_model=TaskOut)
def update_task_status(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(database.get_crm_db)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_task.status = task_update.status
    db.commit()
    db.refresh(db_task)
    return db_task
