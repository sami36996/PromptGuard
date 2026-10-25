"""API Key schemas."""
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List


class APIKeyCreate(BaseModel):
    name: Optional[str] = "Default"
    agent_id: Optional[int] = None
    permissions: List[str] = Field(
        default_factory=lambda: ["guard:read"]
    )
    rate_limit: Optional[int] = 1000


class APIKeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: Optional[str]
    key_prefix: str
    permissions: List[str]
    rate_limit: int
    is_active: bool
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime


class APIKeyWithSecret(BaseModel):
    """Only returned on creation - includes the full key once."""
    id: int
    name: Optional[str]
    api_key: str  # Full key - ONLY shown once!
    key_prefix: str
    created_at: datetime