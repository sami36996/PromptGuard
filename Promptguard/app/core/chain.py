"""
PromptGuard Chain Risk Engine

EMA-based: risk decays naturally when clean prompts follow suspicious ones.
No unbounded multiplicative growth.
"""


def compute_chain_risk(
    current_score: float,
    previous_chain_risk: float,
    alpha: float = 0.3,
    max_chain_risk: float = 200.0
) -> float:
    """
    Compute new chain risk using Exponential Moving Average.
    
    Formula: new_risk = alpha * current + (1 - alpha) * previous
    
    Args:
        current_score: Risk score of current prompt (0-100)
        previous_chain_risk: Previous chain risk value
        alpha: Weight for current prompt (0.3 = 30% current, 70% history)
        max_chain_risk: Hard cap
    
    Returns:
        New chain risk value
    
    Example:
        Start: 0
        Prompt 1 (score 80):  0.3*80 + 0.7*0   = 24.0
        Prompt 2 (score 80):  0.3*80 + 0.7*24  = 40.8
        Prompt 3 (score 0):   0.3*0  + 0.7*40.8 = 28.6  # decays!
    """
    new_risk = alpha * current_score + (1 - alpha) * previous_chain_risk
    return round(min(new_risk, max_chain_risk), 2)