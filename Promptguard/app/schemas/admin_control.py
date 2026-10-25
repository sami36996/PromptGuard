from enum import Enum

from pydantic import BaseModel


class AgentStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    QUARANTINED = "quarantined"
    REVOKED = "revoked"


class AgentStatusUpdate(BaseModel):
    status: AgentStatus
    reason: str | None = None


class AgentControlResponse(BaseModel):
    agent_id: str
    status: AgentStatus
    message: str