from time import perf_counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies import get_current_user, get_db
from app.models.company import Company
from app.models.guard_log import GuardLog
from app.models.threat_event import ThreatEvent
from app.models.schemas import ChatRequest
from app.services.analyzer_service import analyze
from app.services.company_policy_service import (
    get_or_create_company_policy,
    model_is_allowed,
)
from app.services.llm_service import (
    LLMNotConfigured,
    LLMRequestError,
    LLMResponseTooLarge,
    send_to_llm,
)
from app.services.logging_service import save_log


router = APIRouter()


@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    started_at = perf_counter()

    if current_user.company_id is not None:
        company = (
            db.query(Company)
            .filter(Company.id == current_user.company_id)
            .first()
        )
        if company is not None and not company.is_active:
            raise HTTPException(
                status_code=403,
                detail="Company account is suspended",
            )

    analysis = analyze(
        request.prompt,
        company_id=current_user.company_id,
    )

    if current_user.company_id is not None:
        company_policy = get_or_create_company_policy(
            db,
            current_user.company_id,
        )
        if not model_is_allowed(company_policy, settings.LLM_MODEL):
            finding = "Model not in company allowlist"
            if finding not in analysis["findings"]:
                analysis["findings"].append(finding)
            if company_policy.auto_block:
                analysis["decision"] = "block"
                analysis["severity"] = "critical"
            elif analysis["decision"] == "allow":
                analysis["decision"] = "review"
                analysis["severity"] = "high"

    save_log(
        prompt=request.prompt,
        score=analysis["score"],
        decision=analysis["decision"],
        findings=analysis["findings"],
    )
    action = (
        "flag"
        if analysis["decision"] == "review"
        else analysis["decision"]
    )
    if current_user.company_id is not None:
        guard_log = GuardLog(
            company_id=current_user.company_id,
            prompt=request.prompt,
            prompt_length=len(request.prompt),
            action=action,
            score=analysis["score"],
            detections=[
                {"type": finding}
                for finding in analysis["findings"]
            ],
            latency_ms=int((perf_counter() - started_at) * 1000),
        )
        db.add(guard_log)
        db.flush()
        if analysis["decision"] in {"review", "block"}:
            for finding in analysis["findings"]:
                db.add(
                    ThreatEvent(
                        company_id=current_user.company_id,
                        guard_log_id=guard_log.id,
                        threat_type=finding[:50] or "security_detection",
                        severity=analysis["severity"].lower(),
                        confidence=analysis["score"],
                        matched_text=finding,
                        prompt_snippet=request.prompt[:500],
                    )
                )
        db.commit()

    if analysis["decision"] == "block":
        return {
            "status": "blocked",
            "analysis": analysis,
        }

    try:
        response = await send_to_llm(request.prompt)
    except LLMNotConfigured:
        return {
            "status": "allowed",
            "analysis": analysis,
            "llm_error": (
                "LLM provider is not configured. "
                "Security analysis completed without a model reply."
            ),
        }
    except (LLMRequestError, LLMResponseTooLarge) as exc:
        return {
            "status": "allowed",
            "analysis": analysis,
            "llm_error": str(exc),
        }

    return {
        "status": "allowed",
        "analysis": analysis,
        "response": response,
    }
