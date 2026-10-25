"""
Risk scoring engine.

Combines detector results into a single risk score.

Design principles:
- Strong security detections dominate.
- Supporting detectors such as encoding/obfuscation should
  contribute evidence without overwhelming primary detections.
- Scores are capped at 100.
"""

from app.engine.patterns import get_detector_weight


# Detectors that represent direct/high-confidence threats.
PRIMARY_DETECTORS = {
    "prompt_injection",
    "os_command",
    "reverse_shell",
    "sqli",
    "xss",
    "secrets",
    "file",
}


# Detectors that usually provide supporting evidence.
SUPPORTING_DETECTORS = {
    "encoding",
    "obfuscation",
    "image",
}


def calculate_risk_score(
    detector_results: list[dict],
) -> int:

    primary_scores = []
    supporting_score = 0.0

    for result in detector_results:

        if not isinstance(result, dict):
            continue

        detector_name = result.get(
            "detector",
            "unknown",
        )

        score = result.get(
            "score",
            0,
        )

        try:
            score = float(score)
        except (TypeError, ValueError):
            score = 0.0

        score = max(0.0, min(score, 100.0))

        weight = get_detector_weight(
            detector_name
        )

        weighted_score = score * weight

        if detector_name in PRIMARY_DETECTORS:

            primary_scores.append(
                weighted_score
            )

        elif detector_name in SUPPORTING_DETECTORS:

            supporting_score += (
                weighted_score
            )

    # Strongest primary threat establishes the baseline.
    strongest_primary = (
        max(primary_scores)
        if primary_scores
        else 0.0
    )

    # Supporting evidence is deliberately capped.
    supporting_score = min(
        supporting_score,
        25.0,
    )

    total_score = (
        strongest_primary
        + supporting_score
    )

    return min(
        round(total_score),
        100,
    )


def compute_final_score(
    breakdown: dict[str, float],
    findings: list[str] | None = None,
    critical_hit: bool = False,
) -> int:
    """Compatibility adapter for the analytics analyzer."""
    detector_results = [
        {"detector": detector, "score": score}
        for detector, score in breakdown.items()
    ]
    score = calculate_risk_score(detector_results)
    if critical_hit:
        score = max(score, 70)
    return min(score, 100)