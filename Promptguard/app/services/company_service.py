"""Company service."""
from sqlalchemy.orm import Session
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.services.company_settings_service import (
    get_or_create_company_settings,
    update_company_settings,
)

COMPANY_COLUMNS = {"name", "is_active"}
SETTINGS_FIELDS = {
    "email",
    "email_alerts",
    "high_risk_alerts",
    "quarantine_alerts",
}


def create_company(db: Session, data: CompanyCreate) -> Company:
    company = Company(
        name=data.name,
        slug=data.slug
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    return company


def get_company(db: Session, company_id: int) -> Company | None:
    return db.query(Company).filter(Company.id == company_id).first()


def get_company_by_slug(db: Session, slug: str) -> Company | None:
    return db.query(Company).filter(Company.slug == slug).first()


def list_companies(db: Session, skip: int = 0, limit: int = 100) -> list[Company]:
    return db.query(Company).offset(skip).limit(limit).all()


def update_company(db: Session, company: Company, data: CompanyUpdate) -> Company:
    payload = data.model_dump(exclude_unset=True)
    settings_updates = {
        field: payload[field]
        for field in SETTINGS_FIELDS
        if field in payload
    }

    for field, value in payload.items():
        if field in COMPANY_COLUMNS:
            setattr(company, field, value)

    if settings_updates:
        update_company_settings(db, company.id, settings_updates)

    db.commit()
    db.refresh(company)
    return company


def serialize_company(db: Session, company: Company) -> dict:
    settings = get_or_create_company_settings(db, company.id)
    return {
        "id": company.id,
        "name": company.name,
        "slug": company.slug,
        "description": None,
        "plan": None,
        "is_active": company.is_active,
        "email": settings.email,
        "website": None,
        "created_at": company.created_at,
        "email_alerts": settings.email_alerts,
        "high_risk_alerts": settings.high_risk_alerts,
        "quarantine_alerts": settings.quarantine_alerts,
    }


def delete_company(db: Session, company: Company) -> None:
    db.delete(company)
    db.commit()