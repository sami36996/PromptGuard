from sqlalchemy import Column, Integer, String
from app.core.database import Base


class AgentStatus(Base):
    __tablename__ = "agent_status"

    id = Column(Integer, primary_key=True)

    agent_id = Column(String, unique=True)

    status = Column(String, default="active")