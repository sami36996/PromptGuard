"""Company dependency."""
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.company import Company
from app.models.membership import Membership

async def get_current_company(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Company:
    membership = db.query(Membership).filter(
        Membership.user_id == user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=400, detail="User has no companies")
    company = db.query(Company).filter(
        Company.id == membership.company_id
    ).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

async def get_company_or_404(
    company_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Company:
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    membership = db.query(Membership).filter(
        Membership.user_id == user.id,
        Membership.company_id == company_id
    ).first()
    
    if not membership and not user.is_platform_admin:
        raise HTTPException(status_code=403, detail="Not a member of this company")
    
    return company