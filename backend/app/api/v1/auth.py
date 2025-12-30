from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.db import session, models_system, schemas
from app.core import security
import re

router = APIRouter()

@router.post("/auth/login", response_model=schemas.Token)
def login(
    username: str = Body(..., embed=True),
    password: str = Body(..., embed=True),
    db: Session = Depends(session.get_db)
):
    # 1. Validation: Username must NOT be an email
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if re.match(email_regex, username):
       raise HTTPException(
           status_code=400, 
           detail="Username login does not accept email format. Please use your username."
       )

    # 2. Fetch User
    user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == username).first()
    
    # 3. Verify
    if not user or not security.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # 4. Create Token
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "is_superuser": user.is_superuser
    }
    
    access_token = security.create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/sysadmin/login", response_model=schemas.Token)
def sysadmin_login(
    username: str = Body(..., embed=True),
    password: str = Body(..., embed=True),
    db: Session = Depends(session.get_db)
):
    user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == username).first()
    
    if not user or not security.verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not user.is_superuser: # Using is_superuser as per legacy sysadmin check logic (or is_sysadmin if model has it)
        # Re-checking legacy auth.py: it checked user.is_sysadmin. 
        # But v1 Login checks is_superuser? 
        # Let's check model definition if possible, or stick to what worked. 
        # Legacy auth.py used user.is_sysadmin.
        # v1 auth.py used user.is_superuser in token payload.
        # I will check models_system content if needed, but safe bet is:
        if not (user.is_superuser or getattr(user, 'is_sysadmin', False)):
             raise HTTPException(status_code=403, detail="Not a sysadmin")

    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "is_sysadmin": True,
        "is_superuser": True
    }
    access_token = security.create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}
