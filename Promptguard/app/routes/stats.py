from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.guard_log import GuardLog

router = APIRouter()


@router.get("/stats")
def get_stats(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company_id = user.company_id
    company_logs = db.query(GuardLog).filter(
        GuardLog.company_id == company_id
    )
    total = company_logs.count()

    allowed = (
        company_logs
        .filter(GuardLog.action == "allow")
        .count()
    )

    review = (
        company_logs
        .filter(GuardLog.action.in_(("flag", "sanitize")))
        .count()
    )

    blocked = (
        company_logs
        .filter(GuardLog.action == "block")
        .count()
    )

    return {
        "total_requests": total,
        "allowed": allowed,
        "review": review,
        "blocked": blocked
    }