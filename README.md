# ⚔️ Debate Arena

> Watch AI agents with distinct personalities argue in real time — then vote on who won.

Debate Arena is a full-stack AI application where three opinionated AI personas (an Optimist, a Critic, and a Philosopher) face off in structured, multi-round debates on any topic you throw at them. Arguments stream live to the browser as they're generated, and agents adapt their style based on how the audience has been voting.

![Debate Arena](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black)

---

## What It Does

1. **Pick a topic** — anything from "AI will end civilization" to "pineapple belongs on pizza"
2. **Choose two agents** from three distinct personas
3. **Watch them debate** — arguments stream in real time, round by round
4. **Vote on the winner** — your vote feeds back into the agents' styles in future rounds
5. **Read the moderator's verdict** — a neutral AI summarizes the debate at the end

---

## How It Works

```
Browser → POST /debate/start → creates debate in Supabase
Browser → GET /debate/{id}/stream → opens SSE connection
  Server: Round 1 → Agent A generates argument (Groq)
  Server: Round 1 → Agent B generates argument (Groq)
  Server: Round 2 → agents adapt style based on vote history
  Server: Round 3 → final arguments
  Server: Moderator generates closing summary (Groq)
Browser → POST /vote → saves winner, informs future style
```

Arguments are streamed to the frontend using **Server-Sent Events (SSE)** — no polling, no websockets. Each AI call runs in a thread pool so the async event loop stays non-blocking.

### Agent Personas

| Agent | Personality | Style Under Pressure |
|---|---|---|
| 🌟 **Optimist** | Champions benefits, opportunities, best-case outcomes | Doubles down with evidence and passion |
| 🔍 **Critic** | Exposes flaws, risks, and unintended consequences | Reframes the debate on sharper terms |
| 🦉 **Philosopher** | Argues from first principles, ethics, and logic | Regrounds in what truly matters |

Each agent has two style variants — one when they're winning the vote, one when losing — which are injected into the system prompt dynamically.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **LLM** | [Groq](https://groq.com) + `llama-3.1-8b-instant` | Ultra-fast inference for real-time argument generation |
| **AI Agents** | Custom agent system (CrewAI-inspired) | Persona management, style adaptation, vote-aware prompting |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com) | REST API + SSE streaming |
| **Streaming** | [sse-starlette](https://github.com/sysid/sse-starlette) | Server-Sent Events for live argument delivery |
| **Database** | [Supabase](https://supabase.com) (PostgreSQL) | Debate state, arguments, and vote persistence |
| **Frontend** | [Next.js 16](https://nextjs.org) (App Router) + TypeScript | React frontend with SSE client |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Dark-themed, purple-accented UI |

---

## Project Structure

```
debate-arena/
├── backend/
│   ├── main.py          # FastAPI app, SSE stream, API routes
│   ├── agents.py        # AI personas, Groq calls, style adaptation
│   ├── database.py      # Supabase client, debate/argument/vote CRUD
│   ├── models.py        # Pydantic request/response models
│   └── .env             # Environment variables (not committed)
└── frontend/
    └── app/
        ├── page.tsx               # Home — topic input, agent selector
        └── debate/[id]/page.tsx   # Live debate view with SSE stream
```

---

## Running Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Groq](https://console.groq.com) API key (free tier works)
- A [Supabase](https://supabase.com) project

### 1. Supabase Setup

Run the following SQL in your Supabase SQL editor to create the required tables:

```sql
create table debates (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  agent_a text not null,
  agent_b text not null,
  status text default 'active',
  created_at timestamptz default now()
);

create table arguments (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid references debates(id),
  agent_name text not null,
  content text not null,
  round_number int not null,
  created_at timestamptz default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid references debates(id),
  winner_agent text not null,
  reason text,
  created_at timestamptz default now()
);
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sse-starlette groq supabase python-dotenv

# Configure environment
cp .env.example .env  # or edit .env directly
```

Edit `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_service_role_key
```

```bash
# Start the server
uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/debate/start` | Create a new debate |
| `GET` | `/debate/{id}/stream` | SSE stream — live arguments |
| `POST` | `/vote` | Cast a vote for a winner |
| `GET` | `/debate/{id}` | Fetch full debate with arguments and vote |

### Example: Start a Debate

```bash
curl -X POST http://localhost:8000/debate/start \
  -H "Content-Type: application/json" \
  -d '{"topic": "Remote work is better than office work", "agent_a": "Optimist", "agent_b": "Critic"}'
```

### Example: Stream the Debate

```bash
curl -N http://localhost:8000/debate/{debate_id}/stream
```

Events: `start` → `argument` (×6) → `summary` → `done`

---

## Key Design Decisions

**Why SSE over WebSockets?** The debate is a one-way stream from server to client — SSE is simpler, reconnects automatically, and works natively in the browser with `EventSource`.

**Why Groq?** Speed. Groq's hardware delivers inference fast enough that the 2-second pause between arguments is intentional pacing, not latency.

**Why vote-aware prompting?** It makes the debate feel alive. Agents that are losing change tactics rather than repeating themselves — a small touch that dramatically improves the experience.

---

## License

MIT
