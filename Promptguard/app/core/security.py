"""
Compatibility layer for security functionality.

New code should import directly from:
- app.engine
- app.core.auth
- app.core.api_keys

This module preserves compatibility with existing services
and routes that still import security functions from here.
"""

from app.engine.analyzer import analyze_prompt

from app.engine.trust import (
    calculate_trust_score,
)

from app.engine.chain_risks import (
    calculate_chain_risk,
)

from app.core.auth import (
    verify_password,
    hash_password,
    create_access_token,
    decode_access_token,
)

from app.core.api_keys import (
    generate_api_key,
    hash_api_key,
)


def update_trust(
    breakdown: dict,
    current_trust: float,
) -> float:

    return calculate_trust_score(
        breakdown,
        current_trust,
    )


def compute_chain_risk(
    current_score: float,
    previous_chain_risk: float,
    max_chain_risk: float = 200,
) -> float:

    return calculate_chain_risk(
        current_score,
        previous_chain_risk,
        max_chain_risk,
    )


__all__ = [
    # Analysis
    "analyze_prompt",

    # Trust and chain risk
    "update_trust",
    "compute_chain_risk",

    # Authentication
    "verify_password",
    "hash_password",
    "create_access_token",
    "decode_access_token",

    # API keys
    "generate_api_key",
    "hash_api_key",
]