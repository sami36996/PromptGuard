"""Team/members management routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.dependencies import get_db, get_current_user, get_current_company, require_admin
from app.models.company import Company
from app.models.user import User
from app.models.membership import Membership, MembershipRole
from app.schemas.user import MemberResponse
from app.services.user_service import get_user_by_email, add_user_to_company

router = APIRouter(prefix="/members", tags=["members"])

@router.get("", response_model=List[MemberResponse])
def list_members(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    members = []
    for u in company.users:
        membership = db.query(Membership).filter(
            Membership.user_id == u.id,
            Membership.company_id == company.id
        ).first()
        members.append({
            "user_id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": membership.role if membership else "member",
            "joined_at": membership.created_at if membership else u.created_at
        })
    return members

@router.post("/invite")
def invite_member(
    email: str,
    role: str = MembershipRole.DEVELOPER,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    target_user = get_user_by_email(db, email)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = db.query(Membership).filter(
        Membership.user_id == target_user.id,
        Membership.company_id == company.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User already a member")
    
    add_user_to_company(db, target_user.id, company.id, role)
    return {"message": f"Invited {email} as {role}"}