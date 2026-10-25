"""Security policy routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.dependencies import get_db, get_current_user, get_current_company, require_admin
from app.models.company import Company
from app.models.user import User
from app.schemas.policy import PolicyCreate, PolicyUpdate, PolicyResponse
from app.services.policy_service import (
    create_policy, get_policy, list_company_policies,
    update_policy, delete_policy, set_default_policy
)

router = APIRouter(prefix="/policies", tags=["policies"])

@router.post("", response_model=PolicyResponse)
def create(
    data: PolicyCreate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    return create_policy(db, company.id, data)

@router.get("", response_model=List[PolicyResponse])
def list_policies(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return list_company_policies(db, company.id)

@router.get("/{policy_id}", response_model=PolicyResponse)
def get(
    policy_id: int,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    policy = get_policy(db, policy_id, company.id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@router.put("/{policy_id}", response_model=PolicyResponse)
def update(
    policy_id: int,
    data: PolicyUpdate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    policy = get_policy(db, policy_id, company.id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return update_policy(db, policy, data)

@router.delete("/{policy_id}")
def delete(
    policy_id: int,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    policy = get_policy(db, policy_id, company.id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    delete_policy(db, policy)
    return {"message": "Policy deleted"}

@router.post("/{policy_id}/default", response_model=PolicyResponse)
def make_default(
    policy_id: int,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    return set_default_policy(db, policy_id, company.id)