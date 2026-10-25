"""
Risk scoring engine.

Combines detector results into a single explainable risk score.

Primary detectors represent direct security threats.
Supporting detectors provide additional evidence but should
not independently dominate the final risk score.
"""

from app.engine.patterns import get_detector_weight


PRIMARY_DETECTORS = {
    "prompt_injection",
    "os_command",
    "reverse_shell",
    "sqli",
    "xss",
    "secrets",
    "file",
}


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

        score = max(
            0.0,
            min(score, 100.0),
        )

        weight = get_detector_weight(
            detector_name,
        )

        weighted_score = (
            score * weight
        )

        if detector_name in PRIMARY_DETECTORS:

            primary_scores.append(
                weighted_score
            )

        elif detector_name in SUPPORTING_DETECTORS:

            supporting_score += (
                weighted_score
            )

    # The strongest direct threat establishes
    # the primary risk level.
    strongest_primary = (
        max(primary_scores)
        if primary_scores
        else 0.0
    )

    # Supporting indicators provide additional
    # evidence but cannot dominate the score.
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
