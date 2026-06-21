import asyncio
import json
import logging
import os
import time
from collections import defaultdict

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from models import StartDebateRequest, VoteRequest
import database
import agents

app = FastAPI(title="Debate Arena API")

# ── CORS ────────────────────────────────────────────────────────────────────
# In production, set ALLOWED_ORIGINS to your frontend domain(s).
# When unset (local dev), allow all origins so any localhost port works.
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
if _raw_origins.strip():
    ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
    _allow_origin_regex = None
else:
    ALLOWED_ORIGINS = ["*"]
    _allow_origin_regex = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

ROUNDS = 3
PAUSE_BETWEEN_ARGS = 2  # seconds

# ── Rate limiting (in-memory, per IP, sliding 60-second window) ──────────────
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 60  # seconds
_rate_buckets: dict[str, list[float]] = defaultdict(list)


def _check_rate_limit(ip: str) -> bool:
    """Return True if request is allowed, False if rate-limited."""
    now = time.monotonic()
    window_start = now - RATE_LIMIT_WINDOW
    bucket = _rate_buckets[ip]
    # Evict expired timestamps
    _rate_buckets[ip] = [t for t in bucket if t > window_start]
    if len(_rate_buckets[ip]) >= RATE_LIMIT_MAX:
        return False
    _rate_buckets[ip].append(now)
    return True


# ── Stream deduplication (prevent double-generation for same debate_id) ───────
_active_streams: set[str] = set()


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Start debate ──────────────────────────────────────────────────────────────
@app.post("/debate/start")
async def start_debate(request: StartDebateRequest, req: Request):
    client_ip = req.client.host if req.client else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")

    debate = database.create_debate(request.topic, request.agent_a, request.agent_b)
    return {
        "debate_id": debate["id"],
        "topic": debate["topic"],
        "agent_a": debate["agent_a"],
        "agent_b": debate["agent_b"],
    }


# ── Stream debate ─────────────────────────────────────────────────────────────
@app.get("/debate/{debate_id}/stream")
async def stream_debate(debate_id: str):
    debate = database.get_debate(debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    if debate_id in _active_streams:
        raise HTTPException(status_code=409, detail="Debate stream already in progress")

    async def event_generator():
        _active_streams.add(debate_id)
        try:
            topic = debate["topic"]
            agent_a = debate["agent_a"]
            agent_b = debate["agent_b"]
            debate_agents = [agent_a, agent_b]
            all_arguments = []

            yield {
                "event": "start",
                "data": json.dumps({"debate_id": debate_id, "topic": topic, "agents": debate_agents}),
            }

            loop = asyncio.get_running_loop()

            for round_num in range(1, ROUNDS + 1):
                logging.info("Starting round %d", round_num)
                for agent_name in debate_agents:
                    try:
                        vote_feedback = database.get_vote_feedback(debate_id)

                        logging.info("Generating argument: %s round %d", agent_name, round_num)
                        content = await loop.run_in_executor(
                            None,
                            lambda a=agent_name, r=round_num, vf=vote_feedback: agents.generate_argument(
                                a, topic, r, all_arguments, vf
                            ),
                        )
                        logging.info("Got argument from %s (%d chars)", agent_name, len(content))

                        impact_score, saved = await asyncio.gather(
                            loop.run_in_executor(
                                None,
                                lambda c=content, t=topic: agents.score_argument(c, t),
                            ),
                            loop.run_in_executor(
                                None,
                                lambda: database.save_argument(debate_id, agent_name, content, round_num),
                            ),
                        )

                        all_arguments.append(saved)

                        yield {
                            "event": "argument",
                            "data": json.dumps(
                                {
                                    "agent": agent_name,
                                    "round": round_num,
                                    "content": content,
                                    "argument_id": saved["id"],
                                    "impact_score": impact_score,
                                }
                            ),
                        }

                    except Exception:
                        logging.exception("Error in round %d for %s", round_num, agent_name)
                        yield {
                            "event": "argument",
                            "data": json.dumps(
                                {
                                    "agent": agent_name,
                                    "round": round_num,
                                    "content": "[This argument could not be generated. The arena continues.]",
                                    "argument_id": f"error-{round_num}-{agent_name}",
                                    "impact_score": 0,
                                }
                            ),
                        }

                    await asyncio.sleep(PAUSE_BETWEEN_ARGS)

            logging.info("Generating moderator summary")
            try:
                summary = await loop.run_in_executor(
                    None,
                    lambda: agents.generate_moderator_summary(topic, all_arguments),
                )
            except Exception:
                logging.exception("Failed to generate moderator summary")
                summary = "The debate has concluded. Both sides made compelling arguments."

            yield {
                "event": "summary",
                "data": json.dumps({"content": summary}),
            }

            yield {
                "event": "done",
                "data": json.dumps({"debate_id": debate_id}),
            }

        finally:
            _active_streams.discard(debate_id)

    return EventSourceResponse(event_generator())


# ── Cast vote ─────────────────────────────────────────────────────────────────
@app.post("/vote")
async def cast_vote(request: VoteRequest):
    debate = database.get_debate(request.debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    valid_agents = {debate["agent_a"], debate["agent_b"]}
    if request.winner_agent not in valid_agents:
        raise HTTPException(
            status_code=400,
            detail=f"winner_agent must be one of {sorted(valid_agents)}",
        )

    vote = database.save_vote(request.debate_id, request.winner_agent, request.reason)
    return {"vote_id": vote["id"], "winner_agent": vote["winner_agent"]}


# ── Get debate ────────────────────────────────────────────────────────────────
@app.get("/debate/{debate_id}")
async def get_debate(debate_id: str):
    debate = database.get_debate(debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    args = database.get_arguments(debate_id)
    vote_feedback = database.get_vote_feedback(debate_id)

    return {
        "debate": debate,
        "arguments": args,
        "vote": vote_feedback or None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
