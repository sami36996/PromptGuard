"""Permission dependencies."""
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.membership import Membership, MembershipRole

ROLE_HIERARCHY = {
    MembershipRole.VIEWER: 1,
    MembershipRole.DEVELOPER: 2,
    MembershipRole.ADMIN: 3,
    MembershipRole.OWNER: 4,
}

def require_role(min_role: str):
    async def role_checker(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if user.is_platform_admin:
            return user
        
        membership = db.query(Membership).filter(
            Membership.user_id == user.id
        ).first()
        
        if not membership:
            raise HTTPException(status_code=403, detail="No company membership")
        
        if ROLE_HIERARCHY.get(membership.role, 0) < ROLE_HIERARCHY.get(min_role, 0):
            raise HTTPException(status_code=403, detail=f"Requires {min_role} role")
        
        return user
    return role_checker

require_admin = require_role(MembershipRole.ADMIN)
require_owner = require_role(MembershipRole.OWNER)