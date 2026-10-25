"""Guard endpoint schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class GuardRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="The prompt to analyze")
    agent_id: Optional[int] = Field(None, description="Optional agent ID for context")
    context: Optional[Dict[str, Any]] = Field(default={}, description="Additional context")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Custom metadata")


class DetectionResult(BaseModel):
    detector: str
    detected: bool
    confidence: float
    matched_text: Optional[str] = None
    message: Optional[str] = None


class GuardResponse(BaseModel):
    allowed: bool
    score: float
    threshold: float
    action: str  # allow, block, sanitize, flag
    detections: List[DetectionResult]
    sanitized_prompt: Optional[str] = None
    message: Optional[str] = None
    request_id: Optional[str] = None