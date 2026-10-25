from app.models.agent_graph import AgentEdge
from app.models.log import PromptLog
from app.core.database import SessionLocal


ATTACK_SIGNATURES = {
    "Injection": [
        "ignore",
        "forget",
        "disregard"
    ],

    "Jailbreak": [
        "developer mode",
        "jailbreak",
        "disable safety",
        "bypass safety"
    ],

    "Exfiltration": [
        "system prompt",
        "developer message",
        "hidden instructions",
        "reveal"
    ]
}


def compute_chain_score(chain_id: str):

    db = SessionLocal()

    edges = (
        db.query(AgentEdge)
        .filter(AgentEdge.chain_id == chain_id)
        .order_by(AgentEdge.id.asc())
        .all()
    )

    db.close()

    total = 0
    decay = 1.0

    for edge in edges:

        total += edge.chain_risk * decay

        decay *= 0.85

    return min(total, 200)


def detect_attack_pattern(chain_id: str):

    db = SessionLocal()

    logs = (
        db.query(PromptLog)
        .order_by(PromptLog.id.desc())
        .limit(30)
        .all()
    )

    findings_text = ""

    for log in logs:

        findings_text += " "

        if log.findings:
            findings_text += log.findings.lower()

    db.close()

    attack_types = []

    for attack, signatures in ATTACK_SIGNATURES.items():

        for sig in signatures:

            if sig in findings_text:

                attack_types.append(attack)

                break

    attack_types = sorted(list(set(attack_types)))

    score = compute_chain_score(chain_id)

    if score >= 150:

        verdict = "critical_attack"

    elif score >= 90:

        verdict = "high_risk"

    elif score >= 40:

        verdict = "suspicious"

    else:

        verdict = "normal"

    return {

        "chain_id": chain_id,

        "risk_score": score,

        "attack_types": attack_types,

        "verdict": verdict

    }