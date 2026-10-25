from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.guard_log import GuardLog
from app.models.agent_registry import Agent

router = APIRouter(
    prefix="/events",
    tags=["Events"]
)
@router.get("/")
def get_events(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(GuardLog)
    if not user.is_platform_admin:
        query = query.filter(GuardLog.company_id == user.company_id)
    logs = query.order_by(GuardLog.created_at.desc()).limit(50).all()

    events = []

    for log in logs:

        event_type = log.action.upper()

        if log.action == "block":
            severity = "critical"

        elif log.action in ("flag", "sanitize"):
            severity = "warning"

        else:
            severity = "info"

        events.append({

            "id": log.id,

            "timestamp": log.created_at,

            "type": event_type,

            "severity": severity,

            "risk": log.score,

            "prompt": log.prompt,

            "findings": log.detections

        })

    return events
@router.get("/quarantined")
def quarantined_agents(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Agent).filter(Agent.status == "quarantined")
    if not user.is_platform_admin:
        query = query.filter(Agent.company_id == user.company_id)
    agents = query.all()

    result = []

    for agent in agents:

        result.append({

            "agent": agent.agent_id,

            "trust": agent.trust_score,

            "messages": agent.total_messages,

            "last_seen": agent.last_seen

        })

    return result
@router.get("/high-risk")
def high_risk_events(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(GuardLog).filter(GuardLog.score >= 70)
    if not user.is_platform_admin:
        query = query.filter(GuardLog.company_id == user.company_id)
    logs = query.order_by(GuardLog.score.desc()).limit(20).all()

    return [

        {

            "id": log.id,

            "score": log.score,

            "decision": log.action,

            "prompt": log.prompt,

            "time": log.created_at

        }

        for log in logs

    ]