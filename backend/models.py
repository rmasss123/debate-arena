from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from datetime import datetime

VALID_AGENTS = {"Optimist", "Critic", "Philosopher"}
MAX_TOPIC_LENGTH = 500


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

    @field_validator("topic")
    @classmethod
    def topic_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Topic cannot be empty")
        if len(v) > MAX_TOPIC_LENGTH:
            raise ValueError(f"Topic must be {MAX_TOPIC_LENGTH} characters or fewer")
        return v

    @field_validator("agent_a", "agent_b")
    @classmethod
    def agent_known(cls, v: str) -> str:
        if v not in VALID_AGENTS:
            raise ValueError(f"Agent must be one of {sorted(VALID_AGENTS)}")
        return v

    @model_validator(mode="after")
    def agents_must_differ(self) -> "StartDebateRequest":
        if self.agent_a == self.agent_b:
            raise ValueError("agent_a and agent_b must be different")
        return self


class VoteRequest(BaseModel):
    debate_id: str
    winner_agent: str
    reason: Optional[str] = None

    @field_validator("debate_id")
    @classmethod
    def debate_id_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("debate_id cannot be empty")
        return v.strip()
