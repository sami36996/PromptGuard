from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_company, get_db, require_admin
from app.models.company import Company
from app.models.user import User
from app.schemas.company_policy import CompanyPolicyResponse, CompanyPolicyUpdate
from app.services.company_policy_service import (
    get_or_create_company_policy,
    reset_company_policy,
    serialize_company_policy,
    update_company_policy,
)

router = APIRouter(tags=["company-policy"])


@router.get("/policy", response_model=CompanyPolicyResponse)
def get_company_policy(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    policy = get_or_create_company_policy(db, company.id)
    return serialize_company_policy(policy)


@router.put("/policy", response_model=CompanyPolicyResponse)
def put_company_policy(
    data: CompanyPolicyUpdate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    policy = get_or_create_company_policy(db, company.id)
    updated = update_company_policy(
        db,
        policy,
        max_risk=data.maxRisk,
        max_chain_risk=data.maxChainRisk,
        auto_block=data.autoBlock,
        allowed_models=data.allowedModels,
        blocked_keywords=data.blockedKeywords,
    )
    return serialize_company_policy(updated)


@router.post("/policy/reset", response_model=CompanyPolicyResponse)
def reset_policy(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    policy = reset_company_policy(db, company.id)
    return serialize_company_policy(policy)
