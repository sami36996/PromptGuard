"""Guard logs routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.guard_log import GuardLog
from app.schemas.common import PaginationParams

router = APIRouter(prefix="/logs", tags=["logs"])

@router.get("")
def list_logs(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(GuardLog)
    if not user.is_platform_admin:
        query = query.filter(GuardLog.company_id == user.company_id)

    logs = query.order_by(GuardLog.created_at.desc()).offset(
        (pagination.page - 1) * pagination.page_size
    ).limit(pagination.page_size).all()
    
    total = query.count()
    
    return {
        "items": logs,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "pages": (total + pagination.page_size - 1) // pagination.page_size
    }