"""Risk routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, get_current_company
from app.models.company import Company
from app.models.user import User
from app.models.guard_log import GuardLog
from sqlalchemy import func

router = APIRouter(prefix="/risk-summary", tags=["risk"])

@router.get("")
def risk_summary(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    total = db.query(GuardLog).filter(GuardLog.company_id == company.id).count()
    high_risk = db.query(GuardLog).filter(
        GuardLog.company_id == company.id,
        GuardLog.score >= 70
    ).count()
    
    avg_score = db.query(func.avg(GuardLog.score)).filter(
        GuardLog.company_id == company.id
    ).scalar() or 0
    
    return {
        "total_prompts": total,
        "high_risk_count": high_risk,
        "average_score": round(float(avg_score), 2),
        "risk_level": "high" if high_risk > total * 0.1 else "medium" if high_risk > 0 else "low"
    }