"""API Key service."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.api_key import AgentAPIKey
from app.schemas.api_key import APIKeyCreate
from app.core.api_keys import generate_api_key, hash_api_key


def create_api_key(
    db: Session,
    company_id: int,
    data: APIKeyCreate,
) -> tuple[AgentAPIKey, str]:

    raw_key = generate_api_key()
    key_hash = hash_api_key(raw_key)

    api_key = AgentAPIKey(
        company_id=company_id,
        agent_id=str(data.agent_id) if data.agent_id else None,
        name=data.name or "Default",
        key_hash=key_hash,
        key_prefix=raw_key[:12],
        permissions=data.permissions,
        rate_limit=data.rate_limit or 1000,
        is_active=True,
    )

    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return api_key, raw_key


def get_api_key_by_hash(
    db: Session,
    key_hash: str,
) -> AgentAPIKey | None:

    return (
        db.query(AgentAPIKey)
        .filter(
            AgentAPIKey.key_hash == key_hash,
            AgentAPIKey.is_active == True,
        )
        .first()
    )


def list_company_api_keys(
    db: Session,
    company_id: int,
) -> list[AgentAPIKey]:

    return (
        db.query(AgentAPIKey)
        .filter(
            AgentAPIKey.company_id == company_id,
        )
        .all()
    )


def revoke_api_key(
    db: Session,
    key_id: int,
    company_id: int,
) -> bool:

    key = (
        db.query(AgentAPIKey)
        .filter(
            AgentAPIKey.id == key_id,
            AgentAPIKey.company_id == company_id,
        )
        .first()
    )

    if not key:
        return False

    key.is_active = False
    db.commit()

    return True


def update_last_used(
    db: Session,
    api_key: AgentAPIKey,
) -> None:

    api_key.last_used_at = datetime.utcnow()
    db.commit()