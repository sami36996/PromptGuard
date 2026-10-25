"""Analytics routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, get_current_company
from app.models.company import Company
from app.models.user import User
from app.services.analytics_service import get_company_stats, get_company_threats, get_requests_trend, get_top_risky_agents

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/")
def dashboard(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    stats = get_company_stats(db, company.id)
    threats = get_company_threats(db, company.id)
    trend = get_requests_trend(db, company.id)
    top_risky = get_top_risky_agents(db, company.id)
    
    return {
        "stats": stats,
        "threats": threats,
        "trend": trend,
        "top_risky_agents": top_risky
    }

@router.get("/stats")
def stats(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return get_company_stats(db, company.id)