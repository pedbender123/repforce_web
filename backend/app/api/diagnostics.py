from fastapi import APIRouter, Request, HTTPException
from app.services.diagnostic_engine import DiagnosticEngine
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class DiagnosticRunRequest(BaseModel):
    tenant_slug: Optional[str] = None

@router.post("/run")
def run_diagnostics(
    request: Request,
    payload: DiagnosticRunRequest
):
    # Security Check
    if not getattr(request.state, "is_sysadmin", False):
        raise HTTPException(status_code=403, detail="Requires SysAdmin privileges")

    engine = DiagnosticEngine()
    results = engine.run_all(tenant_slug=payload.tenant_slug)
    return results
