from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.agent_registry import Agent
from app.models.guard_log import GuardLog
from app.models.agent_graph import AgentEdge

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def dashboard(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company_id = user.company_id

    agents_query = db.query(Agent).filter(
        Agent.company_id == company_id
    )
    total_agents = agents_query.count()

    active_agents = (
        agents_query
        .filter(Agent.status == "active")
        .count()
    )

    quarantined_agents = (
        agents_query
        .filter(Agent.status == "quarantined")
        .count()
    )

    total_messages = (
        db.query(func.sum(Agent.total_messages))
        .filter(Agent.company_id == company_id)
        .scalar()
    ) or 0

    blocked_prompts = (
        db.query(GuardLog)
        .filter(
            GuardLog.company_id == company_id,
            GuardLog.action == "block",
        )
        .count()
    )

    review_prompts = (
        db.query(GuardLog)
        .filter(
            GuardLog.company_id == company_id,
            GuardLog.action.in_(("flag", "sanitize")),
        )
        .count()
    )

    average_trust = (
        db.query(func.avg(Agent.trust_score))
        .filter(Agent.company_id == company_id)
        .scalar()
    ) or 100

    agent_ids = [
        value
        for (value,) in db.query(Agent.agent_id)
        .filter(Agent.company_id == company_id)
        .all()
    ]
    highest_chain_risk = 0
    if agent_ids:
        highest_chain_risk = (
            db.query(func.max(AgentEdge.chain_risk))
            .filter(AgentEdge.from_agent.in_(agent_ids))
            .scalar()
        ) or 0

    return {
        "total_agents": total_agents,
        "active_agents": active_agents,
        "quarantined_agents": quarantined_agents,
        "total_messages": total_messages,
        "blocked_prompts": blocked_prompts,
        "review_prompts": review_prompts,
        "average_trust": round(average_trust, 2),
        "highest_chain_risk": highest_chain_risk
    }