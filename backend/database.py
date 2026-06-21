import logging
import os

from supabase import create_client, Client

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in environment")
        _client = create_client(url, key)
    return _client


def create_debate(topic: str, agent_a: str, agent_b: str) -> dict:
    client = get_client()
    result = (
        client.table("debates")
        .insert({"topic": topic, "agent_a": agent_a, "agent_b": agent_b, "status": "active"})
        .execute()
    )
    return result.data[0]


def get_debate(debate_id: str) -> dict | None:
    """Return debate dict or None if not found / on error."""
    try:
        client = get_client()
        result = (
            client.table("debates")
            .select("*")
            .eq("id", debate_id)
            .single()
            .execute()
        )
        return result.data
    except Exception as exc:
        logger.debug("get_debate(%s) returned no result: %s", debate_id, exc)
        return None


def save_argument(debate_id: str, agent_name: str, content: str, round_number: int) -> dict:
    client = get_client()
    result = (
        client.table("arguments")
        .insert(
            {
                "debate_id": debate_id,
                "agent_name": agent_name,
                "content": content,
                "round_number": round_number,
            }
        )
        .execute()
    )
    return result.data[0]


def get_arguments(debate_id: str) -> list:
    client = get_client()
    result = (
        client.table("arguments")
        .select("*")
        .eq("debate_id", debate_id)
        .order("round_number")
        .execute()
    )
    return result.data


def save_vote(debate_id: str, winner_agent: str, reason: str | None = None) -> dict:
    client = get_client()
    result = (
        client.table("votes")
        .insert({"debate_id": debate_id, "winner_agent": winner_agent, "reason": reason})
        .execute()
    )
    client.table("debates").update({"status": "completed"}).eq("id", debate_id).execute()
    return result.data[0]


def get_vote_feedback(debate_id: str) -> dict:
    client = get_client()
    result = (
        client.table("votes")
        .select("*")
        .eq("debate_id", debate_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else {}
