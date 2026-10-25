"""API Key dependency."""
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.models.api_key import AgentAPIKey
from app.models.company import Company
from app.core.security import hash_api_key
from app.services.api_key_service import get_api_key_by_hash, update_last_used

async def get_company_from_api_key(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db)
) -> Company:
    if not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header required")
    
    key_hash = hash_api_key(x_api_key)
    api_key = get_api_key_by_hash(db, key_hash)
    
    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    if not api_key.is_active:
        raise HTTPException(status_code=401, detail="API key revoked")
    
    update_last_used(db, api_key)
    
    return api_key.company