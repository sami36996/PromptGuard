from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime

from datetime import datetime

from app.core.database import Base


class PromptLog(Base):

    __tablename__ = "prompt_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    prompt = Column(String)

    score = Column(Integer)

    decision = Column(String)

    findings = Column(String)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )