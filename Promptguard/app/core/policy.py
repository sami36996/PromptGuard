from app.models.security_policy import SecurityPolicy


def get_policy(db):

    policy = db.query(SecurityPolicy).first()

    if policy:
        return policy

    return SecurityPolicy(
        review_threshold=30,
        block_threshold=70,
        quarantine_threshold=30,
        max_chain_risk=200,
        auto_quarantine=True
    )