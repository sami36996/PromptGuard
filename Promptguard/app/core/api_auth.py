from fastapi import Header, HTTPException

from app.core.database import SessionLocal
from app.models.api_key import AgentAPIKey

def verify_api_key(x_api_key: str = Header(None)):

    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API Key"
        )

    db = SessionLocal()

    key = db.query(AgentAPIKey).filter(
        AgentAPIKey.api_key == x_api_key
    ).first()

    db.close()

    if not key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API Key"
        )

    return key