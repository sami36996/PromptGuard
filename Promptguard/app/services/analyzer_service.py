from app.core.database import SessionLocal
from app.core.policy import get_policy
from app.core.security import analyze_prompt
from app.services.company_policy_service import (
    apply_company_policy,
    get_or_create_company_policy,
)


def analyze(prompt, company_id=None):
    db = SessionLocal()

    try:
        policy = get_policy(db)
        analysis = analyze_prompt(
            prompt,
            review_threshold=policy.review_threshold,
            block_threshold=policy.block_threshold,
        )

        if analysis["score"] >= policy.block_threshold:
            analysis["decision"] = "block"
        elif analysis["score"] >= policy.review_threshold:
            analysis["decision"] = "review"
        else:
            analysis["decision"] = "allow"

        if company_id is not None:
            company_policy = get_or_create_company_policy(db, company_id)
            analysis = apply_company_policy(
                analysis,
                company_policy,
                prompt,
            )

        return analysis
    finally:
        db.close()
