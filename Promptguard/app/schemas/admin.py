from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CompanyAdminView(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str
    slug: str
    is_active: bool

    member_count: int
    agent_count: int
    total_requests: int

    created_at: datetime


class GlobalStats(BaseModel):

    total_companies: int
    total_agents: int
    total_requests: int
    total_blocked: int
    active_today: int
    threats_today: int


class AgentGlobalView(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    agent_id: str
    company_id: int
    company_name: str

    agent_name: str
    agent_type: str
    status: str

    total_messages: int
    blocked_messages: int
    trust_score: float

    last_seen: Optional[datetime]
    created_at: datetime