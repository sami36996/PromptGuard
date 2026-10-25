"""Guard service - orchestrates your detection engine."""
from sqlalchemy.orm import Session
from app.models.company import Company
from app.models.agent_registry import Agent
from app.models.api_key import AgentAPIKey
from app.models.guard_log import GuardLog
from app.models.security_policy import SecurityPolicy
from app.services.policy_service import get_default_policy
from app.schemas.guard import GuardRequest, GuardResponse, DetectionResult
from typing import Optional
import time


def analyze_prompt(
    db: Session,
    company: Company,
    request: GuardRequest,
    api_key: Optional[AgentAPIKey] = None
) -> GuardResponse:
    """
    Main analysis function. Wraps your existing detection engine.
    """
    start_time = time.time()
    
    # Get active policy
    policy = get_default_policy(db, company.id)
    if not policy:
        # Fallback default
        policy = SecurityPolicy(
            company_id=company.id,
            name="Default",
            threshold=0.7,
            action_block=True,
            action_sanitize=False,
            action_alert=True
        )
    
    # TODO: Integrate your actual detection engine here
    # For now, placeholder that calls your detectors
    detections = _run_detectors(request.prompt, policy)
    
    # Calculate score
    max_score = max((d.confidence for d in detections if d.detected), default=0.0)
    
    # Determine action
    if max_score >= policy.threshold:
        action = "block" if policy.action_block else "flag"
    elif max_score >= policy.threshold * 0.5:
        action = "sanitize" if policy.action_sanitize else "flag"
    else:
        action = "allow"
    
    allowed = action == "allow"
    
    # Sanitize if needed
    sanitized = None
    if action == "sanitize":
        sanitized = _sanitize_prompt(request.prompt)
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    # Log the interaction
    guard_log = GuardLog(
        company_id=company.id,
        agent_id=request.agent_id,
        api_key_id=api_key.id if api_key else None,
        prompt=request.prompt,
        prompt_length=len(request.prompt),
        action=action,
        score=max_score,
        detections=[d.model_dump() for d in detections],
        latency_ms=latency_ms
    )
    db.add(guard_log)
    db.commit()
    
    return GuardResponse(
        allowed=allowed,
        score=max_score,
        threshold=policy.threshold,
        action=action,
        detections=detections,
        sanitized_prompt=sanitized,
        message=_get_message(action, detections),
        request_id=str(guard_log.id)
    )


def _run_detectors(prompt: str, policy: SecurityPolicy) -> list[DetectionResult]:
    """
    TODO: Replace with your actual detector calls.
    This is a placeholder that simulates detection.
    """
    detections = []
    
    # Check which detectors are enabled
    detector_config = policy.detector_config or {}
    
    # Prompt Injection
    if detector_config.get("prompt_injection", True):
        # TODO: Call your actual prompt_injection detector
        detections.append(DetectionResult(
            detector="prompt_injection",
            detected=False,  # Replace with actual detection
            confidence=0.0,
            message="No prompt injection detected"
        ))
    
    # XSS
    if detector_config.get("xss", True):
        detections.append(DetectionResult(
            detector="xss",
            detected=False,
            confidence=0.0,
            message="No XSS detected"
        ))
    
    # SQL Injection
    if detector_config.get("sqli", True):
        detections.append(DetectionResult(
            detector="sqli",
            detected=False,
            confidence=0.0,
            message="No SQL injection detected"
        ))
    
    # Add more detectors as needed...
    
    return detections


def _sanitize_prompt(prompt: str) -> str:
    """Basic sanitization - replace with your actual logic."""
    # TODO: Implement actual sanitization
    return prompt


def _get_message(action: str, detections: list[DetectionResult]) -> Optional[str]:
    if action == "allow":
        return None
    triggered = [d.detector for d in detections if d.detected]
    if triggered:
        return f"Blocked due to: {', '.join(triggered)}"
    return "Request blocked by security policy"