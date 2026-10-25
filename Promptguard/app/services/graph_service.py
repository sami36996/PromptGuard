from sqlalchemy.orm import Session
from collections import defaultdict

from app.models.agent_graph import AgentEdge
def load_graph(db: Session):
    edges = db.query(AgentEdge).all()

    graph = defaultdict(list)

    for e in edges:
        graph[e.from_agent].append({
            "to": e.to_agent,
            "score": e.score,
            "chain_risk": e.chain_risk
        })

    return graph

def compute_agent_risk(db: Session):

    edges = db.query(AgentEdge).all()

    risk_map = defaultdict(float)

    for e in edges:

        # direct contribution
        risk_map[e.from_agent] += e.score * 0.4
        risk_map[e.to_agent] += e.chain_risk * 0.6

    # normalize to 0–100
    for k in risk_map:
        risk_map[k] = min(risk_map[k], 100)

    return dict(risk_map)

def detect_risky_chains(db: Session, threshold: float = 70):

    edges = db.query(AgentEdge).all()

    chains = []

    for e in edges:

        if e.chain_risk >= threshold:

            chains.append({
                "from": e.from_agent,
                "to": e.to_agent,
                "chain_risk": e.chain_risk
            })

    return chains