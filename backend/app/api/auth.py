from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from ..db import database, models_global, schemas
from ..core import security

router = APIRouter()

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(database.get_db)
):
    # 1. Fetch Global User
    user = db.query(models_global.GlobalUser).filter(models_global.GlobalUser.username == username).first()
    
    # 2. Verify
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorret user or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # 3. Create Token
    # Payload: sub=uid, username=str, sysadmin=bool
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "is_sysadmin": user.is_sysadmin
    }
    
    access_token = security.create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/sysadmin/token", response_model=schemas.Token)
def sysadmin_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    user = db.query(models_global.GlobalUser).filter(models_global.GlobalUser.username == form_data.username).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not user.is_sysadmin:
        raise HTTPException(status_code=403, detail="Not a sysadmin")
        
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "is_sysadmin": True
    }
    access_token = security.create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.User)
def read_users_me(request: Request, db: Session = Depends(database.get_db)):
    # User ID comes from Token (via Middleware or manually decoded if middleware doesn't set it yet)
    # The middleware sets request.state.user_id if valid token found
    user_id = getattr(request.state, "user_id", None)
    
    if not user_id:
        # Fallback: Check header manually if middleware skipped? 
        # Ideally middleware handles this.
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.query(models_global.GlobalUser).options(
        joinedload(models_global.GlobalUser.memberships).joinedload(models_global.Membership.tenant)
    ).filter(models_global.GlobalUser.id == user_id).first()
    
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
         
    return user