"""API Key management routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.dependencies import get_db, get_current_user, get_current_company, require_admin
from app.models.company import Company
from app.models.user import User
from app.schemas.api_key import APIKeyCreate, APIKeyResponse, APIKeyWithSecret
from app.services.api_key_service import create_api_key, list_company_api_keys, revoke_api_key

router = APIRouter(prefix="/api-keys", tags=["api-keys"])

@router.post("/generate", response_model=APIKeyWithSecret)
def create_key(
    name: str = "Default",
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    data = APIKeyCreate(name=name)
    api_key, raw_key = create_api_key(db, company.id, data)
    return {
        "id": api_key.id,
        "name": api_key.name,
        "api_key": raw_key,
        "key_prefix": api_key.key_prefix,
        "created_at": api_key.created_at
    }

@router.get("", response_model=List[APIKeyResponse])
def list_keys(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return list_company_api_keys(db, company.id)

@router.delete("/{key_id}")
def revoke_key(
    key_id: int,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    success = revoke_api_key(db, key_id, company.id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key revoked"}