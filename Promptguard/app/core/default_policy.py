from app.models.security_policy import SecurityPolicy


def create_default_policy(db):

    policy = db.query(SecurityPolicy).first()

    if policy:
        return

    policy = SecurityPolicy(
        name="Default Policy",
        review_threshold=30,
        block_threshold=70,
        quarantine_threshold=30,
        max_chain_risk=200,
        auto_quarantine=True
    )

    db.add(policy)
    db.commit()