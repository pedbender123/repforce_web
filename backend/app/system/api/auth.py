from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from sqlalchemy.orm import Session
from app.shared import database, schemas
from app.shared.security import create_access_token, verify_password
from app.system.models import models
import re

router = APIRouter()

@router.post("/auth/login", response_model=schemas.Token)
def login(
    username: str = Body(..., embed=True),
    password: str = Body(..., embed=True),
    db: Session = Depends(database.get_db)
):
    # 1. Validation: Username must NOT be an email
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if re.match(email_regex, username):
       raise HTTPException(
           status_code=400, 
           detail="Username login does not accept email format. Please use your username."
       )

    # 2. Fetch User
    user = db.query(models.GlobalUser).filter(models.GlobalUser.username == username).first()
    
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
def get_me(request: Request, db: Session = Depends(database.get_db)):
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    user = db.query(models.GlobalUser).filter(models.GlobalUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": str(user.id),
        "username": user.username,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "memberships": [
            {
                "role": m.role,
                "tenant": {
                    "id": str(m.tenant.id),
                    "name": m.tenant.name,
                    "slug": m.tenant.slug
                }
            } for m in user.memberships
        ]
    }
