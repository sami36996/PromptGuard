"""Company schemas."""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CompanyCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    is_active: Optional[bool] = None
    email_alerts: Optional[bool] = None
    high_risk_alerts: Optional[bool] = None
    quarantine_alerts: Optional[bool] = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    plan: str | None = None
    is_active: bool
    email: str | None = None
    website: str | None = None
    created_at: datetime
    email_alerts: bool = True
    high_risk_alerts: bool = True
    quarantine_alerts: bool = True

    class Config:
        from_attributes = True