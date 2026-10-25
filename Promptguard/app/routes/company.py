"""Company management routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, get_current_company, require_admin
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyResponse, CompanyUpdate
from app.services.company_service import serialize_company, update_company

router = APIRouter(prefix="/company", tags=["company"])

@router.get("/me", response_model=CompanyResponse)
def get_my_company(
    company: Company = Depends(get_current_company),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return serialize_company(db, company)

@router.put("/me", response_model=CompanyResponse)
def update_my_company(
    data: CompanyUpdate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    updated = update_company(db, company, data)
    return serialize_company(db, updated)