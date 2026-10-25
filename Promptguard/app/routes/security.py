from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.agent_graph import AgentEdge
from app.models.agent_registry import Agent
from app.core.chain_security import (
    compute_chain_score,
)

router = APIRouter()

@router.get("/chain")
def list_chains(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(AgentEdge)
    if not user.is_platform_admin:
        agent_ids = [
            value
            for (value,) in db.query(Agent.agent_id)
            .filter(Agent.company_id == user.company_id)
            .all()
        ]
        if not agent_ids:
            return []
        query = query.filter(AgentEdge.from_agent.in_(agent_ids))

    edges = query.order_by(
        AgentEdge.chain_id,
        AgentEdge.hop_index,
    ).all()
    grouped: dict[str, list[AgentEdge]] = {}
    for edge in edges:
        grouped.setdefault(edge.chain_id, []).append(edge)

    return [
        serialize_chain(chain_id, chain_edges)
        for chain_id, chain_edges in grouped.items()
    ]


@router.get("/chain/{chain_id}")
def analyze_chain(
    chain_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(AgentEdge).filter(AgentEdge.chain_id == chain_id)
    if not user.is_platform_admin:
        agent_ids = [
            value
            for (value,) in db.query(Agent.agent_id)
            .filter(Agent.company_id == user.company_id)
            .all()
        ]
        query = query.filter(AgentEdge.from_agent.in_(agent_ids))
    edges = query.order_by(AgentEdge.hop_index.asc()).all()

    if not edges:
        return {
            "id": chain_id,
            "chainRisk": 0,
            "createdAt": None,
            "finalVerdict": "ALLOW",
            "hops": [],
        }

    return serialize_chain(chain_id, edges)


def serialize_chain(
    chain_id: str,
    edges: list[AgentEdge],
) -> dict:
    chain_risk = compute_chain_score(chain_id)

    def normalize_decision(decision: str | None) -> str:
        normalized = (decision or "allow").upper()
        if normalized in {"ALLOW", "REVIEW", "BLOCK"}:
            return normalized
        return "ALLOW"

    hops = []

    for edge in edges:
        hops.append({
            "from": edge.from_agent,
            "to": edge.to_agent,
            "attackTypes": [],
            "decision": normalize_decision(edge.decision),
            "risk": edge.score or 0,
        })

    if chain_risk >= 150:
        verdict = "BLOCK"
    elif chain_risk >= 40:
        verdict = "REVIEW"
    else:
        verdict = "ALLOW"

    return {
        "id": chain_id,
        "chainRisk": chain_risk,
        "createdAt": edges[0].created_at,
        "finalVerdict": verdict,
        "hops": hops,
    }