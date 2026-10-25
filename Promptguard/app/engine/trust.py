"""
Agent trust scoring engine.
"""

from app.engine.patterns import get_detector_weight


TRUST_DECAY_FACTOR = 0.4
MAX_WEIGHTED_RISK = 120


def calculate_trust_score(
    breakdown: dict,
    current_trust: float,
) -> float:

    current_trust = max(
        0,
        min(
            100,
            float(current_trust),
        ),
    )

    weighted_risk = 0.0

    for detector_name, score in breakdown.items():

        try:
            score = float(score)
        except (
            TypeError,
            ValueError,
        ):
            score = 0.0

        weight = get_detector_weight(
            detector_name,
        )

        weighted_risk += (
            score * weight
        )

    weighted_risk = min(
        weighted_risk,
        MAX_WEIGHTED_RISK,
    )

    decay = (
        weighted_risk *
        TRUST_DECAY_FACTOR
    )

    new_trust = (
        current_trust -
        decay
    )

    return max(
        0,
        min(
            100,
            round(new_trust, 2),
        ),
    )