"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AGENTS = [
  {
    id: "Optimist",
    emoji: "🌟",
    label: "Optimist",
    description: "Champions the positive, highlights opportunities and best outcomes",
    color: "border-emerald-500 bg-emerald-500/10 text-emerald-300",
    activeRing: "ring-2 ring-emerald-500",
  },
  {
    id: "Critic",
    emoji: "🔍",
    label: "Critic",
    description: "Questions assumptions, exposes risks and overlooked downsides",
    color: "border-rose-500 bg-rose-500/10 text-rose-300",
    activeRing: "ring-2 ring-rose-500",
  },
  {
    id: "Philosopher",
    emoji: "🦉",
    label: "Philosopher",
    description: "Seeks deeper truths through ethics, logic, and first principles",
    color: "border-violet-500 bg-violet-500/10 text-violet-300",
    activeRing: "ring-2 ring-violet-500",
  },
];

function AgentSelector({
  label,
  value,
  onChange,
  disabledId,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  disabledId: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">{label}</p>
      <div className="flex flex-col gap-2">
        {AGENTS.map((agent) => {
          const isSelected = value === agent.id;
          const isDisabled = disabledId === agent.id;
          return (
            <button
              key={agent.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(agent.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150
                ${isDisabled ? "cursor-not-allowed opacity-30 border-white/10 bg-white/5" : "cursor-pointer hover:scale-[1.01]"}
                ${isSelected && !isDisabled ? `${agent.color} ${agent.activeRing}` : !isDisabled ? "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10" : ""}
              `}
            >
              <span className="text-xl">{agent.emoji}</span>
              <div>
                <p className="font-semibold text-sm">{agent.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{agent.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [agentA, setAgentA] = useState("Optimist");
  const [agentB, setAgentB] = useState("Critic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/debate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), agent_a: agentA, agent_b: agentB }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to start debate");
      }

      const data = await res.json();
      router.push(`/debate/${data.debate_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.12) 0%, #0c0c10 60%)" }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 mb-6">
            ⚔️ AI Debate Arena
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white mb-4">
            Let the{" "}
            <span className="bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
              debate
            </span>{" "}
            begin
          </h1>
          <p className="text-zinc-400 text-lg">
            Pick a topic, choose your combatants, and watch AI agents clash in real time.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Topic */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-widest text-purple-400">
              Debate Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI will ultimately benefit humanity more than it harms it"
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Agent selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AgentSelector
              label="Agent A"
              value={agentA}
              onChange={setAgentA}
              disabledId={agentB}
            />
            <AgentSelector
              label="Agent B"
              value={agentB}
              onChange={setAgentB}
              disabledId={agentA}
            />
          </div>

          {error && (
            <p className="text-rose-400 text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full rounded-xl bg-purple-600 py-4 text-base font-semibold text-white transition-all hover:bg-purple-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                Starting debate…
              </span>
            ) : (
              "Start Debate ⚔️"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
