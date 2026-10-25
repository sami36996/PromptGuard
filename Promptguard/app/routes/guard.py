"""Guard route - THE core product endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_company_from_api_key
from app.models.company import Company
from app.schemas.guard import GuardRequest, GuardResponse
from app.services.guard_service import analyze_prompt

router = APIRouter(tags=["guard"])

@router.post("/guard", response_model=GuardResponse)
def protect_prompt(
    request: GuardRequest,
    company: Company = Depends(get_company_from_api_key),
    db: Session = Depends(get_db)
):
    """Main protection endpoint. AI vendors send prompts here."""
    return analyze_prompt(db, company, request)