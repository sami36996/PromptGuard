"""Global security policy service."""

from sqlalchemy.orm import Session

from app.models.security_policy import SecurityPolicy


def get_or_create_global_policy(
    db: Session,
) -> SecurityPolicy:

    policy = (
        db.query(SecurityPolicy)
        .order_by(SecurityPolicy.id.asc())
        .first()
    )

    if policy:
        return policy

    policy = SecurityPolicy(
        name="Global Security Policy",
        review_threshold=30,
        block_threshold=70,
        quarantine_threshold=30,
        max_chain_risk=200,
        auto_quarantine=True,
    )

    db.add(policy)
    db.commit()
    db.refresh(policy)

    return policy


def get_default_policy(
    db: Session,
    company_id: int | None = None,
) -> SecurityPolicy:

    return get_or_create_global_policy(db)


def update_global_policy(
    db: Session,
    policy: SecurityPolicy,
    updates: dict,
) -> SecurityPolicy:

    allowed_fields = {
        "review_threshold",
        "block_threshold",
        "quarantine_threshold",
        "max_chain_risk",
        "auto_quarantine",
    }

    for field, value in updates.items():

        if field in allowed_fields:
            setattr(
                policy,
                field,
                value,
            )

    db.commit()
    db.refresh(policy)

    return policy
