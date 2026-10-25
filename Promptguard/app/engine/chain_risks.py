"""
Chain risk propagation engine.
"""


def calculate_chain_risk(
    current_score: float,
    previous_chain_risk: float = 0,
    max_chain_risk: float = 200,
) -> float:

    current_score = max(
        0,
        float(current_score),
    )

    previous_chain_risk = max(
        0,
        float(previous_chain_risk),
    )

    max_chain_risk = max(
        0,
        float(max_chain_risk),
    )

    multiplier = 1 + (
        previous_chain_risk / 100
    )

    chain_risk = (
        current_score * multiplier
    )

    return min(
        round(chain_risk, 2),
        max_chain_risk,
    )