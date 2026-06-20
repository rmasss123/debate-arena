import asyncio
import json
import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from models import StartDebateRequest, VoteRequest
import database
import agents

app = FastAPI(title="Debate Arena API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROUNDS = 3
PAUSE_BETWEEN_ARGS = 2  # seconds


@app.post("/debate/start")
async def start_debate(request: StartDebateRequest):
    if request.agent_a not in agents.AGENT_PERSONAS:
        raise HTTPException(status_code=400, detail=f"Unknown agent_a: {request.agent_a}")
    if request.agent_b not in agents.AGENT_PERSONAS:
        raise HTTPException(status_code=400, detail=f"Unknown agent_b: {request.agent_b}")

    debate = database.create_debate(request.topic, request.agent_a, request.agent_b)
    return {"debate_id": debate["id"], "topic": debate["topic"], "agent_a": debate["agent_a"], "agent_b": debate["agent_b"]}


@app.get("/debate/{debate_id}/stream")
async def stream_debate(debate_id: str):
    debate = database.get_debate(debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    async def event_generator():
        topic = debate["topic"]
        agent_a = debate["agent_a"]
        agent_b = debate["agent_b"]
        debate_agents = [agent_a, agent_b]
        all_arguments = []

        # Yield a start event
        yield {
            "event": "start",
            "data": json.dumps({"debate_id": debate_id, "topic": topic, "agents": debate_agents}),
        }

        for round_num in range(1, ROUNDS + 1):
            for agent_name in debate_agents:
                # Fetch latest vote feedback to adapt style
                vote_feedback = database.get_vote_feedback(debate_id)

                # Run blocking Groq call in thread pool to avoid blocking event loop
                content = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda a=agent_name, r=round_num, vf=vote_feedback: agents.generate_argument(
                        a, topic, r, all_arguments, vf
                    ),
                )

                saved = database.save_argument(debate_id, agent_name, content, round_num)
                all_arguments.append(saved)

                yield {
                    "event": "argument",
                    "data": json.dumps(
                        {
                            "agent": agent_name,
                            "round": round_num,
                            "content": content,
                            "argument_id": saved["id"],
                        }
                    ),
                }

                await asyncio.sleep(PAUSE_BETWEEN_ARGS)

        # Moderator summary
        summary = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: agents.generate_moderator_summary(topic, all_arguments),
        )

        yield {
            "event": "summary",
            "data": json.dumps({"content": summary}),
        }

        yield {
            "event": "done",
            "data": json.dumps({"debate_id": debate_id}),
        }

    return EventSourceResponse(event_generator())


@app.post("/vote")
async def cast_vote(request: VoteRequest):
    debate = database.get_debate(request.debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    valid_agents = {debate["agent_a"], debate["agent_b"]}
    if request.winner_agent not in valid_agents:
        raise HTTPException(
            status_code=400,
            detail=f"winner_agent must be one of {valid_agents}",
        )

    vote = database.save_vote(request.debate_id, request.winner_agent, request.reason)
    return {"vote_id": vote["id"], "winner_agent": vote["winner_agent"]}


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
