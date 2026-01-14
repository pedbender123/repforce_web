from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.shared import database, schemas
from app.shared.security import create_access_token, verify_password, decode_access_token
from app.system import models
import re

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    user = db.query(models.GlobalUser).filter(models.GlobalUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_active_user(current_user: models.GlobalUser = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@router.post("/auth/login", response_model=schemas.Token)
def login(
    username: str = Body(..., embed=True),
    password: str = Body(..., embed=True),
    db: Session = Depends(database.get_db)
):
    # 1. Validation Logic Removed (Allow emails as usernames)
    # email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    # if re.match(email_regex, username): ...

    # 2. Fetch User (Email or Username)
    user = db.query(models.GlobalUser).filter(
        (models.GlobalUser.username == username) | (models.GlobalUser.recovery_email == username)
    ).first()
    
    # 3. Verify
    if not user or not verify_password(password, user.password_hash):
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
    
    access_token = create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/auth/users/me")
def get_me(current_user: models.GlobalUser = Depends(get_current_active_user)):
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "ui_state": current_user.ui_state,
        "memberships": [
            {
                "role": m.role,
                "tenant": {
                    "id": str(m.tenant.id),
                    "name": m.tenant.name,
                    "slug": m.tenant.slug
                }
            } for m in current_user.memberships
        ]
    }
