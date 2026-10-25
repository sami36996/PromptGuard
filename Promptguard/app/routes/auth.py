"""Auth routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import login_user, register_user

router = APIRouter(tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    result = register_user(db, data)
    return {
        "access_token": result["access_token"],
        "token_type": "bearer",
        "expires_in": result["expires_in"]
    }

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    result = login_user(db, data.email, data.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "access_token": result["access_token"],
        "token_type": "bearer",
        "expires_in": result["expires_in"]
    }