from datetime import datetime

from sqlalchemy.orm import Session

from app.models.company_policy import CompanyPolicy


DEFAULT_MAX_RISK = 70
DEFAULT_MAX_CHAIN_RISK = 70
DEFAULT_AUTO_BLOCK = True
DEFAULT_REVIEW_THRESHOLD = 30


def get_or_create_company_policy(
    db: Session,
    company_id: int,
) -> CompanyPolicy:
    policy = (
        db.query(CompanyPolicy)
        .filter(CompanyPolicy.company_id == company_id)
        .first()
    )

    if policy:
        return policy

    policy = CompanyPolicy(
        company_id=company_id,
        max_risk=DEFAULT_MAX_RISK,
        max_chain_risk=DEFAULT_MAX_CHAIN_RISK,
        auto_block=DEFAULT_AUTO_BLOCK,
        allowed_models=[],
        blocked_keywords=[],
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def update_company_policy(
    db: Session,
    policy: CompanyPolicy,
    *,
    max_risk: int,
    max_chain_risk: int,
    auto_block: bool,
    allowed_models: list[str],
    blocked_keywords: list[str],
) -> CompanyPolicy:
    policy.max_risk = max_risk
    policy.max_chain_risk = max_chain_risk
    policy.auto_block = auto_block
    policy.allowed_models = _clean_string_list(allowed_models)
    policy.blocked_keywords = _clean_string_list(blocked_keywords)
    policy.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(policy)
    return policy


def reset_company_policy(
    db: Session,
    company_id: int,
) -> CompanyPolicy:
    policy = get_or_create_company_policy(db, company_id)
    return update_company_policy(
        db,
        policy,
        max_risk=DEFAULT_MAX_RISK,
        max_chain_risk=DEFAULT_MAX_CHAIN_RISK,
        auto_block=DEFAULT_AUTO_BLOCK,
        allowed_models=[],
        blocked_keywords=[],
    )


def serialize_company_policy(policy: CompanyPolicy) -> dict:
    return {
        "id": str(policy.id),
        "maxRisk": policy.max_risk,
        "maxChainRisk": policy.max_chain_risk,
        "autoBlock": policy.auto_block,
        "allowedModels": list(policy.allowed_models or []),
        "blockedKeywords": list(policy.blocked_keywords or []),
        "updatedAt": policy.updated_at,
    }


def apply_company_policy(
    analysis: dict,
    policy: CompanyPolicy | None,
    prompt: str,
) -> dict:
    if policy is None:
        return analysis

    findings = list(analysis.get("findings") or [])
    score = float(analysis.get("score") or 0)
    keyword_hit = False

    for keyword in policy.blocked_keywords or []:
        if _keyword_matches(prompt, keyword):
            keyword_hit = True
            finding = f"Blocked keyword: {keyword}"
            if finding not in findings:
                findings.append(finding)

    block_threshold = int(policy.max_risk)
    review_threshold = min(DEFAULT_REVIEW_THRESHOLD, block_threshold)
    exceeds_block = score >= block_threshold
    exceeds_review = score >= review_threshold

    if keyword_hit or exceeds_block:
        if policy.auto_block:
            analysis["decision"] = "block"
            analysis["severity"] = "critical"
        else:
            analysis["decision"] = "review"
            analysis["severity"] = "high"
    elif exceeds_review:
        analysis["decision"] = "review"
        analysis["severity"] = "high"
    else:
        analysis["decision"] = "allow"
        analysis["severity"] = "low"

    analysis["findings"] = findings
    return analysis


def model_is_allowed(
    policy: CompanyPolicy | None,
    model_name: str | None,
) -> bool:
    if policy is None:
        return True

    allowed = _clean_string_list(policy.allowed_models or [])
    if not allowed:
        return True

    if not model_name:
        return False

    return model_name.strip().lower() in {item.lower() for item in allowed}


def _clean_string_list(values: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()

    for value in values:
        item = value.strip()
        if not item:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(item)

    return cleaned


def _keyword_matches(prompt: str, keyword: str) -> bool:
    keyword = keyword.strip()
    if len(keyword) < 2:
        return False
    return keyword.lower() in prompt.lower()
