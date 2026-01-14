from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any
from pydantic import BaseModel
from app.shared.database import get_crm_db
from app.engine.automation.service import AutomationService
from app.engine.automation.definitions import ACTION_DEFINITIONS

router = APIRouter()

class TrailRunRequest(BaseModel):
    trail_id: str
    context: Dict[str, Any] = {}

@router.post("/run")
def run_trail(payload: TrailRunRequest, db: Session = Depends(get_crm_db)):
    """
    Executa uma trilha de automação.
    Requer contexto de tenant (header X-Tenant-Slug ou similar via get_crm_db).
    """
    service = AutomationService(db)
    try:
        result = service.run_trail(payload.trail_id, payload.context)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import logging
        logging.error(f"Error running trail: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/definitions")
def get_definitions():
    return ACTION_DEFINITIONS
