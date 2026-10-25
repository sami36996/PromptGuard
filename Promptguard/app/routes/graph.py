from fastapi import APIRouter
from sqlalchemy import func
from fastapi import Depends
from app.dependencies import get_super_admin

from app.core.database import SessionLocal
from app.models.agent_graph import AgentEdge


router = APIRouter(
    prefix="/graph",
    tags=["Graph"]
)
@router.get("/stats")
def graph_stats(user=Depends(get_super_admin)):

    db = SessionLocal()

    total_edges = db.query(AgentEdge).count()

    total_chains = (
        db.query(func.count(func.distinct(AgentEdge.chain_id)))
        .scalar()
    )

    highest_chain_risk = (
        db.query(func.max(AgentEdge.chain_risk))
        .scalar()
    ) or 0

    longest_chain = (
        db.query(
            AgentEdge.chain_id,
            func.max(AgentEdge.hop_index).label("length")
        )
        .group_by(AgentEdge.chain_id)
        .order_by(func.max(AgentEdge.hop_index).desc())
        .first()
    )

    chain_lengths = (
        db.query(
            AgentEdge.chain_id,
            func.max(AgentEdge.hop_index).label("length")
        )
        .group_by(AgentEdge.chain_id)
        .subquery()
    )

    average_chain_length = (
        db.query(
            func.avg(chain_lengths.c.length)
        )
        .scalar()
    )

    db.close()

    return {

        "total_edges": total_edges,

        "total_chains": total_chains,

        "average_chain_length": round(
            average_chain_length or 0,
            2
        ),

        "highest_chain_risk": highest_chain_risk,

        "longest_chain": {

            "chain_id": longest_chain.chain_id if longest_chain else None,

            "length": longest_chain.length if longest_chain else 0

        }

    }
