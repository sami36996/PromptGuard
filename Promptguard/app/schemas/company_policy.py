from datetime import datetime

from pydantic import BaseModel, Field


class CompanyPolicyUpdate(BaseModel):
    maxRisk: int = Field(ge=0, le=100)
    maxChainRisk: int = Field(ge=0, le=100)
    autoBlock: bool
    allowedModels: list[str] = Field(default_factory=list)
    blockedKeywords: list[str] = Field(default_factory=list)


class CompanyPolicyResponse(BaseModel):
    id: str
    maxRisk: int
    maxChainRisk: int
    autoBlock: bool
    allowedModels: list[str]
    blockedKeywords: list[str]
    updatedAt: datetime | None = None
