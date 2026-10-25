"""Agent schemas."""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any


class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    agent_type: Optional[str] = "chatbot"
    endpoint_url: Optional[str] = None
    config: Optional[Dict[str, Any]] = {}


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    agent_type: Optional[str] = None
    endpoint_url: Optional[str] = None
    status: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    company_id: int
    name: str
    description: Optional[str]
    agent_type: str
    endpoint_url: Optional[str]
    status: str
    is_public: bool
    config: Dict[str, Any]
    created_at: datetime