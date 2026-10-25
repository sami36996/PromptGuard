"""
Security decision engine.
"""


def make_decision(
    score: float,
    review_threshold: float = 30,
    block_threshold: float = 70,
) -> dict:

    score = float(score)

    if score >= block_threshold:

        return {
            "decision": "block",
            "severity": "critical",
        }

    if score >= review_threshold:

        return {
            "decision": "review",
            "severity": "high",
        }

    return {
        "decision": "allow",
        "severity": "low",
    }