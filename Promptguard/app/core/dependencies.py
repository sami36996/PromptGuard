from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.core.api_keys import hash_api_key
from app.core.database import SessionLocal, get_db

from app.models.user import User
from app.models.agent_registry import Agent
from app.services.api_key_service import get_api_key_by_hash


# ============================================================
# SECURITY SCHEMES
# ============================================================

security = HTTPBearer(
    scheme_name="BearerAuth",
    auto_error=False
)

agent_security = HTTPBearer(
    scheme_name="AgentAPIKey",
    auto_error=True,
)


# ============================================================
# ADMIN JWT AUTHENTICATION
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    token = credentials.credentials

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
        )

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID in token",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="User account is inactive",
        )

    return user


# ============================================================
# AGENT API KEY AUTHENTICATION
# ============================================================

def get_current_agent(
    credentials: HTTPAuthorizationCredentials = Depends(agent_security),
):
    raw_api_key = credentials.credentials
    key_hash = hash_api_key(raw_api_key)

    db = SessionLocal()

    try:
        api_key = get_api_key_by_hash(
            db,
            key_hash,
        )

        if not api_key:
            raise HTTPException(
                status_code=401,
                detail="Invalid or inactive API Key",
            )

        if not api_key.agent_id:
            raise HTTPException(
                status_code=400,
                detail="API key is not assigned to an agent",
            )

        agent = (
            db.query(Agent)
            .filter(
                Agent.agent_id == api_key.agent_id
            )
            .first()
        )

        if not agent:
            raise HTTPException(
                status_code=404,
                detail="Agent not found",
            )

        return agent

    finally:
        db.close()