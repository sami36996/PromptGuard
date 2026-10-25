from datetime import datetime

from sqlalchemy.orm import Session

from app.models.company_settings import CompanySettings


def get_or_create_company_settings(
    db: Session,
    company_id: int,
) -> CompanySettings:
    settings = (
        db.query(CompanySettings)
        .filter(CompanySettings.company_id == company_id)
        .first()
    )

    if settings:
        return settings

    settings = CompanySettings(
        company_id=company_id,
        email=None,
        email_alerts=True,
        high_risk_alerts=True,
        quarantine_alerts=True,
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update_company_settings(
    db: Session,
    company_id: int,
    updates: dict,
) -> CompanySettings:
    settings = get_or_create_company_settings(db, company_id)
    allowed = {
        "email",
        "email_alerts",
        "high_risk_alerts",
        "quarantine_alerts",
    }

    for field, value in updates.items():
        if field in allowed:
            setattr(settings, field, value)

    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return settings
