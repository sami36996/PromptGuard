"""Analytics schemas."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class DashboardStats(BaseModel):
    total_requests: int
    blocked_requests: int
    allowed_requests: int
    block_rate: float
    avg_score: float
    top_threats: List[Dict[str, Any]]
    requests_trend: List[Dict[str, Any]]  # daily counts


class ThreatSummary(BaseModel):
    threat_type: str
    count: int
    severity: str
    last_seen: datetime