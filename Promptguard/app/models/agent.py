from pydantic import BaseModel , Field
from typing import Optional
from sqlalchemy import Enum as SQLEnum

class AgentMessage(BaseModel):


    to_agent: str = Field()

    message: str = Field()

    origin_agent: Optional[str] = Field()
    
    
class InternalAgentMessage(AgentMessage):
    chain_id: str | None = None
    origin_agent: str | None = None
    
    
    