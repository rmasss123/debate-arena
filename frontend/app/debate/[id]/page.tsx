"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API = "http://127.0.0.1:8000";

const AGENT_STYLES: Record<string, { border: string; bg: string; label: string; badge: string; emoji: string }> = {
  Optimist: {
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/8",
    label: "text-emerald-300",
    badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    emoji: "🌟",
  },
  Critic: {
    border: "border-rose-500/50",
    bg: "bg-rose-500/8",
    label: "text-rose-300",
    badge: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
    emoji: "🔍",
  },
  Philosopher: {
    border: "border-violet-500/50",
    bg: "bg-violet-500/8",
    label: "text-violet-300",
    badge: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
    emoji: "🦉",
  },
};

function getStyle(agent: string) {
  return (
    AGENT_STYLES[agent] ?? {
      border: "border-white/10",
      bg: "bg-white/5",
      label: "text-zinc-300",
      badge: "bg-white/10 text-zinc-300 border border-white/10",
      emoji: "🤖",
    }
  );
}

interface ArgumentCard {
  id: string;
  agent: string;
  round: number;
  content: string;
  argument_id: string;
}

type StreamStatus = "idle" | "streaming" | "done" | "error";

export default function DebatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [agents, setAgents] = useState<string[]>([]);
  const [args, setArgs] = useState<ArgumentCard[]>([]);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState("");
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as new arguments arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [args, summary]);

  useEffect(() => {
    if (!id) return;

    setStatus("streaming");
    const es = new EventSource(`${API}/debate/${id}/stream`);

    es.addEventListener("start", (e) => {
      const data = JSON.parse(e.data);
      setTopic(data.topic);
      setAgents(data.agents);
    });

    es.addEventListener("argument", (e) => {
      const data = JSON.parse(e.data);
      setArgs((prev) => [...prev, { id: data.argument_id, ...data }]);
    });

    es.addEventListener("summary", (e) => {
      const data = JSON.parse(e.data);
      setSummary(data.content);
    });

    es.addEventListener("done", () => {
      setStatus("done");
      es.close();
    });

    es.onerror = () => {
      setError("Connection lost. The debate may have already completed.");
      setStatus("error");
      es.close();
    };

    return () => es.close();
  }, [id]);

  async function castVote(winnerAgent: string) {
    if (votedFor || voteLoading) return;
    setVoteLoading(true);
    try {
      const res = await fetch(`${API}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debate_id: id, winner_agent: winnerAgent }),
      });
      if (!res.ok) throw new Error("Vote failed");
      setVotedFor(winnerAgent);
    } catch {
      // silently ignore
    } finally {
      setVoteLoading(false);
    }
  }

  const currentRound = args.length > 0 ? args[args.length - 1].round : 0;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.10) 0%, #0c0c10 55%)" }}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0c0c10]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition"
          >
            ← New Debate
          </button>
          <span className="text-sm font-medium text-purple-400">⚔️ Debate Arena</span>
          {status === "streaming" && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse-glow" />
              Live · Round {currentRound || "—"}/3
            </span>
          )}
          {status === "done" && (
            <span className="text-xs text-emerald-400">✓ Complete</span>
          )}
          {status === "error" && (
            <span className="text-xs text-rose-400">Disconnected</span>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 flex flex-col gap-6">
        {/* Topic */}
        {topic && (
          <div className="animate-fade-slide-in rounded-2xl border border-purple-500/20 bg-purple-500/5 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">Topic</p>
            <h1 className="text-xl font-semibold text-white leading-snug">{topic}</h1>
            {agents.length === 2 && (
              <div className="flex items-center gap-2 mt-3">
                {agents.map((a) => {
                  const s = getStyle(a);
                  return (
                    <span key={a} className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.badge}`}>
                      {s.emoji} {a}
                    </span>
                  );
                })}
                <span className="text-zinc-600 text-xs">· 3 rounds</span>
              </div>
            )}
          </div>
        )}

        {/* Streaming placeholder */}
        {status === "streaming" && args.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
            <span className="h-6 w-6 rounded-full border-2 border-purple-500/40 border-t-purple-500 animate-spin" />
            <p className="text-sm">Generating arguments…</p>
          </div>
        )}

        {/* Argument cards */}
        <div className="flex flex-col gap-4">
          {args.map((arg, i) => {
            const s = getStyle(arg.agent);
            return (
              <div
                key={arg.argument_id}
                className={`animate-fade-slide-in rounded-2xl border ${s.border} ${s.bg} px-5 py-5`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.badge}`}>
                      {s.emoji} {arg.agent}
                    </span>
                    <span className="text-xs text-zinc-500">Round {arg.round}</span>
                  </div>

                  {/* Vote button */}
                  {status === "done" && !votedFor && (
                    <button
                      onClick={() => castVote(arg.agent)}
                      disabled={voteLoading}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                        ${s.badge} hover:opacity-80 active:scale-95 disabled:opacity-50`}
                    >
                      👍 Vote
                    </button>
                  )}
                  {votedFor === arg.agent && (
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${s.badge}`}>
                      ✓ You voted
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="text-zinc-200 leading-relaxed text-[15px]">{arg.content}</p>
              </div>
            );
          })}
        </div>

        {/* Streaming indicator between rounds */}
        {status === "streaming" && args.length > 0 && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
            <span className="h-4 w-4 rounded-full border-2 border-purple-500/40 border-t-purple-500 animate-spin" />
            Generating next argument…
          </div>
        )}

        {/* Moderator summary */}
        {summary && (
          <div className="animate-fade-slide-in rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3">
              ⚖️ Moderator Summary
            </p>
            <p className="text-zinc-200 leading-relaxed text-[15px]">{summary}</p>
          </div>
        )}

        {/* Vote prompt */}
        {status === "done" && !votedFor && agents.length === 2 && (
          <div className="animate-fade-slide-in rounded-2xl border border-white/10 bg-white/5 px-5 py-5 text-center">
            <p className="text-zinc-300 font-medium mb-4">Who won the debate?</p>
            <div className="flex items-center justify-center gap-3">
              {agents.map((a) => {
                const s = getStyle(a);
                return (
                  <button
                    key={a}
                    onClick={() => castVote(a)}
                    disabled={voteLoading}
                    className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all
                      hover:scale-105 active:scale-95 disabled:opacity-50 ${s.badge}`}
                  >
                    {s.emoji} {a}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Post-vote message */}
        {votedFor && (
          <div className="animate-fade-slide-in rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center">
            <p className="text-zinc-300 text-sm">
              You voted for <span className={`font-semibold ${getStyle(votedFor).label}`}>{votedFor}</span>. Thanks for voting!
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </main>
    </div>
  );
}
