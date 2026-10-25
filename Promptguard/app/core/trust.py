"""
PromptGuard Trust Engine

Event-based decay + time-based recovery. Trust score naturally restores
during periods of clean behavior.
"""

from datetime import datetime
from typing import Dict, Any


TRUST_WEIGHTS = {
    "prompt_injection": 1.5,
    "encoding": 0.4,
    "os_command": 1.8,
    "reverse_shell": 2.0,
    "sqli": 1.4,
    "xss": 1.2,
    "secrets": 1.3,
    "obfuscation": 1.0,
    "image": 0.8,
    "file": 0.8,
}


def update_trust(
    breakdown: Dict[str, float],
    current_trust: float,
    last_interaction: datetime,
    now: datetime = None
) -> Dict[str, Any]:
    """
    Update agent trust score.
    
    Args:
        breakdown: {detector_name: score} from analysis
        current_trust: Current trust 0-100
        last_interaction: Timestamp of last message from this agent
        now: Current time (defaults to UTC now)
    
    Returns:
        Dict with new trust, decay, recovery, weighted_risk
    """
    if now is None:
        now = datetime.utcnow()
    
    # Time-based recovery: +5 trust per hour of clean behavior
    hours_since = max((now - last_interaction).total_seconds() / 3600, 0)
    recovery = min(hours_since * 5, 20)  # Cap recovery per update at 20
    
    # Event-based decay
    weighted_risk = sum(
        score * TRUST_WEIGHTS.get(detector.lower(), 1.0)
        for detector, score in breakdown.items()
    )
    decay = min(weighted_risk * 0.4, 60)  # Cap single-event decay at 60
    
    trust = current_trust - decay + recovery
    trust = max(0.0, min(100.0, trust))
    
    return {
        "trust": round(trust, 2),
        "decay": round(decay, 2),
        "recovery": round(recovery, 2),
        "weighted_risk": round(weighted_risk, 2),
        "hours_since_last": round(hours_since, 2)
    }