from pydantic import BaseModel


class ChatRequest(BaseModel):
    prompt: str


class ChatResponse(BaseModel):
    status: str
    response: str


class AgentRegister(BaseModel):
    agent_name: str
    agent_type: str
    organization: str
    description: str