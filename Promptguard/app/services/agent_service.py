"""Agent service."""
from sqlalchemy.orm import Session
from app.models.agent_registry import Agent
from app.schemas.agent import AgentCreate, AgentUpdate


def create_agent(db: Session, company_id: int, data: AgentCreate) -> Agent:
    agent = Agent(company_id=company_id, **data.model_dump())
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


def get_agent(db: Session, agent_id: int, company_id: int | None = None) -> Agent | None:
    query = db.query(Agent).filter(Agent.id == agent_id)
    if company_id:
        query = query.filter(Agent.company_id == company_id)
    return query.first()


def list_company_agents(db: Session, company_id: int) -> list[Agent]:
    return db.query(Agent).filter(Agent.company_id == company_id).all()


def update_agent(db: Session, agent: Agent, data: AgentUpdate) -> Agent:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)
    db.commit()
    db.refresh(agent)
    return agent


def delete_agent(db: Session, agent: Agent) -> None:
    db.delete(agent)
    db.commit()


def list_all_agents(db: Session, skip: int = 0, limit: int = 100) -> list[Agent]:
    """Admin only - all agents across companies."""
    return db.query(Agent).offset(skip).limit(limit).all()