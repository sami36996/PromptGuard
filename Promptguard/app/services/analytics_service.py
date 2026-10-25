"""
PromptGuard Analyzer Service

Production-hardened prompt analysis:
- Dual-variant detection (raw + canonical)
- Sigmoid scoring
- Critical detector short-circuiting
- Graceful error isolation
"""

import logging
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

from app.core.detectors.prompt_injection import detect as detect_prompt
from app.core.detectors.encoding_detector import detect as detect_encoding
from app.core.detectors.os_command_detector import detect as detect_os
from app.core.detectors.reverse_shell_detector import detect as detect_shell
from app.core.detectors.sqli_detector import detect as detect_sqli
from app.core.detectors.xss_detector import detect as detect_xss
from app.core.detectors.secrets_detector import detect as detect_secret
from app.core.detectors.obfuscation_detector import detect as detect_obfuscation
from app.core.detectors.image_detector import detect as detect_image
from app.core.detectors.file_detector import detect as detect_file

from app.core.normalization import normalize_text
from app.core.scoring import compute_final_score
from collections import Counter
from datetime import datetime, timedelta

from sqlalchemy import func
from app.models.company import Company
from app.models.guard_log import GuardLog
from app.models.threat_event import ThreatEvent
from app.models.agent_registry import Agent

logger = logging.getLogger("promptguard.analyzer")
# app/services/analytics_service.py
def get_risk_summary():
    # Your implementation here
    pass

# ======================================================
# Detector Registry
# ======================================================

DETECTORS = [
    detect_prompt,
    detect_encoding,
    detect_os,
    detect_shell,
    detect_sqli,
    detect_xss,
    detect_secret,
    detect_obfuscation,
    detect_image,
    detect_file,
]

CRITICAL_DETECTORS = {
    "prompt_injection",
    "reverse_shell",
    "os_command"
}

SHORT_CIRCUIT_THRESHOLD = 70


# ======================================================
# Data Models
# ======================================================

@dataclass
class DetectorResult:
    detector: str
    score: float
    findings: List[str]
    variant: str
    raw_score: float
    canonical_score: float
    error: bool = False


@dataclass
class AnalysisResult:
    score: float
    decision: str
    severity: str
    breakdown: Dict[str, float]
    findings: List[str]
    detector_results: List[DetectorResult]
    metadata: Dict[str, Any]


# ======================================================
# Policy
# ======================================================

DEFAULT_POLICY = {
    "block_threshold": 80,
    "review_threshold": 60,
    "severity_map": [
        ((80, 101), ("block", "Critical")),
        ((60, 80), ("review", "High")),
        ((30, 60), ("review", "Medium")),
        ((0, 30), ("allow", "Low"))
    ]
}


# ======================================================
# Core Functions
# ======================================================

def _run_detector(detector, prompt: str, variant: str) -> Dict[str, Any]:
    """Run a single detector with error isolation."""
    detector_name = detector.__name__.replace("detect_", "")
    try:
        result = detector(prompt)
        return {
            "detector": detector_name,
            "score": result.get("score", 0),
            "findings": result.get("findings", []),
            "variant": variant,
            "error": False
        }
    except Exception as e:
        logger.error(f"Detector {detector_name} failed: {e}",
                    extra={"detector": detector_name, "error": str(e)})
        return {
            "detector": detector_name,
            "score": 0,
            "findings": [f"Detector error: {type(e).__name__}"],
            "variant": variant,
            "error": True
        }


def analyze_prompt(
    prompt: str,
    policy: Optional[Dict] = None,
    short_circuit: bool = True
) -> AnalysisResult:
    """
    Main analysis entry point.
    
    Runs all detectors on both raw and canonical text, merges results,
    applies sigmoid scoring, and returns a decision.
    """
    policy = policy or DEFAULT_POLICY
    
    # Step 1: Normalize text
    canonical, transformations = normalize_text(prompt)
    
    # Step 2: Run detectors on both variants
    detector_results: List[DetectorResult] = []
    breakdown: Dict[str, float] = {}
    all_findings: List[str] = []
    critical_hit = False
    
    for detector in DETECTORS:
        detector_name = detector.__name__.replace("detect_", "")
        
        # Run on raw prompt
        raw_result = _run_detector(detector, prompt, "raw")
        raw_score = raw_result["score"]
        
        # Run on canonical (normalized) prompt
        canonical_result = _run_detector(detector, canonical, "canonical")
        canonical_score = canonical_result["score"]
        
        # Merge: take max score across variants
        merged_score = max(raw_score, canonical_score)
        
        # Merge findings
        merged_findings = list(set(
            raw_result["findings"] + canonical_result["findings"]
        ))
        
        # Flag obfuscation: canonical found something raw missed
        if canonical_score > raw_score and raw_score == 0:
            merged_findings.append(
                f"Obfuscation bypass: {detector_name} detected attack only after normalization"
            )
            logger.warning(
                f"Obfuscation bypass detected by {detector_name}",
                extra={"detector": detector_name, "prompt_preview": prompt[:100]}
            )
        
        # Build result object
        result = DetectorResult(
            detector=detector_name,
            score=merged_score,
            findings=merged_findings,
            variant="merged",
            raw_score=raw_score,
            canonical_score=canonical_score,
            error=raw_result["error"] or canonical_result["error"]
        )
        detector_results.append(result)
        
        # Update breakdown
        breakdown[detector_name] = merged_score
        all_findings.extend(merged_findings)
        
        # Short-circuit check
        if (short_circuit and 
            detector_name in CRITICAL_DETECTORS and 
            merged_score >= SHORT_CIRCUIT_THRESHOLD):
            critical_hit = True
            logger.warning(
                f"Critical detector short-circuit: {detector_name}={merged_score}",
                extra={"detector": detector_name, "score": merged_score}
            )
            break
    
    # Step 3: Compute final score
    total_score = compute_final_score(breakdown, all_findings, critical_hit)
    
    # Step 4: Apply policy decision
    decision = "allow"
    severity = "Low"
    
    for (low, high), (dec, sev) in policy["severity_map"]:
        if low <= total_score < high:
            decision = dec
            severity = sev
            break
    
    # Deduplicate findings preserving order
    seen = set()
    unique_findings = []
    for f in all_findings:
        if f not in seen:
            seen.add(f)
            unique_findings.append(f)
    
    return AnalysisResult(
        score=total_score,
        decision=decision,
        severity=severity,
        breakdown=breakdown,
        findings=unique_findings,
        detector_results=detector_results,
        metadata={
            "transformations": transformations,
            "critical_hit": critical_hit,
            "variants_analyzed": 2 if not critical_hit else 1,
            "canonical_text": canonical[:500] if canonical != prompt else None
        }
    )


# ======================================================
# Legacy Compatibility Wrapper
# ======================================================

def legacy_analyze(prompt: str) -> Dict[str, Any]:
    """
    Backward-compatible wrapper returning plain dict.
    Use this if your routes expect the old response format.
    """
    result = analyze_prompt(prompt)
    return {
        "score": result.score,
        "decision": result.decision,
        "severity": result.severity,
        "breakdown": result.breakdown,
        "findings": result.findings,
        "results": [
            {
                "detector": r.detector,
                "score": r.score,
                "findings": r.findings,
                "raw_score": r.raw_score,
                "canonical_score": r.canonical_score
            }
            for r in result.detector_results
        ]
    }
    # ======================================================
# Company Analytics
# ======================================================

def get_company_stats(db, company_id: int) -> Dict[str, Any]:
    """
    Return high-level security statistics for a company.
    """

    logs = (
        db.query(GuardLog)
        .filter(GuardLog.company_id == company_id)
        .all()
    )

    total_requests = len(logs)

    allowed = sum(
        1 for log in logs
        if log.action == "allow"
    )

    blocked = sum(
        1 for log in logs
        if log.action == "block"
    )

    flagged = sum(
        1 for log in logs
        if log.action in ("flag", "sanitize")
    )

    average_score = (
        sum(log.score for log in logs) / total_requests
        if total_requests > 0
        else 0
    )

    blocked_rate = (
        (blocked / total_requests) * 100
        if total_requests > 0
        else 0
    )

    return {
        "total_requests": total_requests,
        "allowed": allowed,
        "blocked": blocked,
        "flagged": flagged,
        "average_score": round(average_score, 2),
        "blocked_rate": round(blocked_rate, 2),
    }


def get_company_threats(db, company_id: int) -> Dict[str, Any]:
    """
    Return threat statistics grouped by type and severity.
    """

    threats = (
        db.query(ThreatEvent)
        .filter(
            ThreatEvent.company_id == company_id
        )
        .all()
    )

    threat_types = Counter(
        threat.threat_type
        for threat in threats
    )

    severities = Counter(
        threat.severity
        for threat in threats
    )

    statuses = Counter(
        threat.status
        for threat in threats
    )

    return {
        "total_threats": len(threats),
        "by_type": dict(threat_types),
        "by_severity": dict(severities),
        "by_status": dict(statuses),
    }


def get_requests_trend(
    db,
    company_id: int,
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Return daily request volume and action distribution
    for the last `days` days.
    """

    since = datetime.utcnow() - timedelta(days=days)

    logs = (
        db.query(GuardLog)
        .filter(
            GuardLog.company_id == company_id,
            GuardLog.created_at >= since,
        )
        .order_by(GuardLog.created_at.asc())
        .all()
    )

    daily = {}

    for log in logs:

        if log.created_at:
            date_key = log.created_at.date().isoformat()
        else:
            continue

        if date_key not in daily:
            daily[date_key] = {
                "date": date_key,
                "total": 0,
                "allowed": 0,
                "blocked": 0,
                "flagged": 0,
            }

        daily[date_key]["total"] += 1

        if log.action == "allow":
            daily[date_key]["allowed"] += 1

        elif log.action == "block":
            daily[date_key]["blocked"] += 1

        elif log.action in ("flag", "sanitize"):
            daily[date_key]["flagged"] += 1

    return list(daily.values())


def get_top_risky_agents(
    db,
    company_id: int,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Return agents ranked by average GuardLog risk score.
    """

    agents = (
        db.query(Agent)
        .filter(
            Agent.company_id == company_id
        )
        .all()
    )

    results = []

    for agent in agents:

        logs = (
            db.query(GuardLog)
            .filter(
                GuardLog.company_id == company_id,
                GuardLog.agent_id == agent.id,
            )
            .all()
        )

        if not logs:
            continue

        total_requests = len(logs)

        average_score = (
            sum(log.score for log in logs)
            / total_requests
        )

        blocked = sum(
            1 for log in logs
            if log.action == "block"
        )

        results.append({
            "agent_id": agent.agent_id,
            "agent_name": agent.agent_name,
            "agent_type": agent.agent_type,
            "average_score": round(
                average_score,
                2
            ),
            "total_requests": total_requests,
            "blocked_requests": blocked,
            "trust_score": agent.trust_score,
        })

    results.sort(
        key=lambda agent: agent["average_score"],
        reverse=True,
    )

    return results[:limit]
def get_global_stats(db) -> Dict[str, Any]:
    """
    Global statistics for the PromptGuard platform.
    Accessible only to super admins.
    """

    today = datetime.utcnow().date()

    total_companies = db.query(Company).count()
    total_agents = db.query(Agent).count()
    total_requests = db.query(GuardLog).count()

    total_blocked = (
        db.query(GuardLog)
        .filter(GuardLog.action == "block")
        .count()
    )

    active_today = (
        db.query(GuardLog)
        .filter(
            func.date(GuardLog.created_at) == today
        )
        .count()
    )

    threats_today = (
        db.query(ThreatEvent)
        .filter(
            func.date(ThreatEvent.created_at) == today
        )
        .count()
    )

    return {
        "total_companies": total_companies,
        "total_agents": total_agents,
        "total_requests": total_requests,
        "total_blocked": total_blocked,
        "active_today": active_today,
        "threats_today": threats_today,
    }