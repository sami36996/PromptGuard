"""Attacks routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, get_current_company
from app.models.company import Company
from app.models.user import User
from app.models.threat_event import ThreatEvent

router = APIRouter(prefix="/recent-attacks", tags=["attacks"])

@router.get("")
def recent_attacks(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return db.query(ThreatEvent).filter(
        ThreatEvent.company_id == company.id
    ).order_by(ThreatEvent.created_at.desc()).limit(20).all()