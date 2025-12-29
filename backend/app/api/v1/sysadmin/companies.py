from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from sqlalchemy.orm import Session
from app.db import session, models_system
from app.api.v1.auth import router as auth_router # Dependency? Or utils.
# I need a dependency to check for Superuser. 
# The prompt said: "Middleware: Permite is_superuser acessar qualquer rota de tenant."
# But here we are in SysAdmin realm. We need to check is_superuser.
from fastapi.security import OAuth2PasswordBearer
from app.core import security

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")

def get_current_superuser(token: str = Depends(oauth2_scheme), db: Session = Depends(session.get_db)):
    payload = security.decode_access_token(token)
    if not payload:
         raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check is_superuser from payload or DB
    is_su = payload.get("is_superuser", False)
    if not is_su:
         raise HTTPException(status_code=403, detail="Not a superuser")
    return payload

@router.get("/companies")
def list_companies(db: Session = Depends(session.get_db), user=Depends(get_current_superuser)):
    tenants = db.query(models_system.Tenant).all()
    return tenants

@router.post("/companies")
def create_company(
    name: str = Body(..., embed=True),
    slug: str = Body(..., embed=True),
    db: Session = Depends(session.get_db), 
    user=Depends(get_current_superuser)
):
    # Basic creation
    # Validate slug uniqueness
    existing = db.query(models_system.Tenant).filter(models_system.Tenant.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")

    new_tenant = models_system.Tenant(
        name=name,
        slug=slug,
        status="active" # Auto-activate for now or setup_pending
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    return new_tenant
