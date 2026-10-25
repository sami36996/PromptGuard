from fastapi import APIRouter

from sqlalchemy import func
from fastapi import Depends 
from app.dependencies import get_super_admin
from app.core.database import SessionLocal

from app.models.guard_log import GuardLog
from app.models.agent_registry import Agent
from app.models.agent_graph import AgentEdge

from datetime import datetime

router = APIRouter(
    prefix="/report",
    tags=["Incident Report"]
)

@router.get("/")
def incident_report(user=Depends(get_super_admin)):

    db = SessionLocal()

    total_messages = db.query(GuardLog).count()

    blocked = (
        db.query(GuardLog)
        .filter(GuardLog.action == "block")
        .count()
    )

    review = (
        db.query(GuardLog)
        .filter(GuardLog.action.in_(("flag", "sanitize")))
        .count()
    )

    allowed = (
        db.query(GuardLog)
        .filter(GuardLog.action == "allow")
        .count()
    )

    total_agents = db.query(Agent).count()

    active_agents = (
        db.query(Agent)
        .filter(Agent.status == "active")
        .count()
    )

    quarantined_agents = (
        db.query(Agent)
        .filter(Agent.status == "quarantined")
        .count()
    )

    avg_trust = (
        db.query(func.avg(Agent.trust_score))
        .scalar()
    ) or 0

    avg_risk = (
        db.query(func.avg(GuardLog.score))
        .scalar()
    ) or 0

    highest_chain = (
        db.query(func.max(AgentEdge.chain_risk))
        .scalar()
    ) or 0
    dangerous_agent = (
        db.query(Agent)
        .order_by(Agent.trust_score.asc())
        .first()
    )

    if dangerous_agent:
        dangerous_name = dangerous_agent.agent_id
    else:
        dangerous_name = None
    recommendations = []

    if quarantined_agents > 0:

        recommendations.append(
            "Investigate quarantined agents."
        )

    if avg_risk > 40:

        recommendations.append(
            "Overall system risk is elevated."
        )

    if blocked > review:

        recommendations.append(
            "Frequent prompt attacks detected."
        )

    if avg_trust < 60:

        recommendations.append(
            "Agent trust is degrading."
        )

    if len(recommendations) == 0:

        recommendations.append(
            "System operating normally."
        )
    report = {

        "generated_at": datetime.utcnow(),

        "summary": {

            "total_messages": total_messages,

            "allowed": allowed,

            "review": review,

            "blocked": blocked

        },

        "agents": {

            "total": total_agents,

            "active": active_agents,

            "quarantined": quarantined_agents

        },

        "average_trust": round(avg_trust,2),

        "average_risk": round(avg_risk,2),

        "highest_chain_risk": highest_chain,

        "highest_risk_agent": dangerous_name,

        "recommendations": recommendations

    }

    db.close()

    return report