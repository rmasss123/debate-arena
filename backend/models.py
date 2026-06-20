from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Debate(BaseModel):
    id: Optional[str] = None
    topic: str
    agent_a: str
    agent_b: str
    status: str = "pending"
    created_at: Optional[datetime] = None


class Argument(BaseModel):
    id: Optional[str] = None
    debate_id: str
    agent_name: str
    content: str
    round_number: int
    created_at: Optional[datetime] = None


class Vote(BaseModel):
    id: Optional[str] = None
    debate_id: str
    winner_agent: str
    reason: Optional[str] = None
    created_at: Optional[datetime] = None


class StartDebateRequest(BaseModel):
    topic: str
    agent_a: str = "Optimist"
    agent_b: str = "Critic"


class VoteRequest(BaseModel):
    debate_id: str
    winner_agent: str
    reason: Optional[str] = None
