"""Security policy schemas."""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any, List


class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    threshold: Optional[float] = 0.7
    action_block: Optional[bool] = True
    action_sanitize: Optional[bool] = False
    action_alert: Optional[bool] = True
    action_log: Optional[bool] = True
    detector_config: Optional[Dict[str, Any]] = {}


class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    threshold: Optional[float] = None
    action_block: Optional[bool] = None
    action_sanitize: Optional[bool] = None
    action_alert: Optional[bool] = None
    action_log: Optional[bool] = None
    detector_config: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None


class PolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    company_id: int
    name: str
    description: Optional[str]
    is_default: bool
    threshold: float
    action_block: bool
    action_sanitize: bool
    action_alert: bool
    action_log: bool
    detector_config: Dict[str, Any]
    custom_rules: List[Dict[str, Any]]
    created_at: datetime