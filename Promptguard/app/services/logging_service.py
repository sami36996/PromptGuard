from app.core.database import SessionLocal
from app.models.log import PromptLog


def save_log(
    prompt: str,
    score: int,
    decision: str,
    findings: list
):

    db = SessionLocal()

    log = PromptLog(
        prompt=prompt,
        score=score,
        decision=decision,
        findings=",".join(findings)
    )

    db.add(log)
    db.commit()
    db.close()