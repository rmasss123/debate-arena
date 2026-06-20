"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FIGHTERS = [
  {
    id: "Optimist",
    emoji: "☀️",
    tagline: "The Eternal Believer",
    color: "#10b981",
    dimBg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.3)",
  },
  {
    id: "Critic",
    emoji: "💀",
    tagline: "The Devil's Advocate",
    color: "#f43f5e",
    dimBg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.3)",
  },
  {
    id: "Philosopher",
    emoji: "👁️",
    tagline: "The Truth Seeker",
    color: "#8b5cf6",
    dimBg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.3)",
  },
] as const;

function visualValue(index: number, salt: number) {
  return ((index * 137 + salt * 271) % 997) / 997;
}

const HOME_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: visualValue(i, 1) * 100,
  size: visualValue(i, 2) * 1.5 + 0.5,
  duration: visualValue(i, 3) * 20 + 15,
  delay: visualValue(i, 4) * 15,
  drift: (visualValue(i, 5) - 0.5) * 80,
  opacity: visualValue(i, 6) * 0.2 + 0.05,
  color: ["#7c3aed", "#6d28d9", "#4f46e5"][Math.floor(visualValue(i, 7) * 3)],
}));

const Particles = React.memo(function Particles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {HOME_PARTICLES.map((p) => (
        <div key={p.id} className="absolute bottom-0 rounded-full"
          style={{
            left: `${p.x}%`, width: p.size, height: p.size,
            backgroundColor: p.color, opacity: p.opacity,
            animation: `particleRise ${p.duration}s ${p.delay}s linear infinite`,
            ["--drift" as string]: `${p.drift}px`,
          }} />
      ))}
    </div>
  );
});

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [agentA, setAgentA] = useState("Optimist");
  const [agentB, setAgentB] = useState("Critic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/debate/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), agent_a: agentA, agent_b: agentB }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Failed"); }
      const data = await res.json();
      sessionStorage.setItem(`debate-arena:new:${data.debate_id}`, "true");
      router.push(`/debate/${data.debate_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#050508" }}>
      <Particles />

      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
        <div className="absolute rounded-full"
          style={{ width: 700, height: 700, top: "-25%", left: "-20%", filter: "blur(80px)",
            background: "radial-gradient(circle, rgba(109,40,217,0.08) 0%, transparent 60%)",
            animation: "orbDrift1 18s ease-in-out infinite" }} />
        <div className="absolute rounded-full"
          style={{ width: 500, height: 500, bottom: "-15%", right: "-15%", filter: "blur(80px)",
            background: "radial-gradient(circle, rgba(67,56,202,0.06) 0%, transparent 60%)",
            animation: "orbDrift2 24s ease-in-out infinite" }} />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:py-24">
        <div className="w-full max-w-2xl flex flex-col gap-10 sm:gap-12">

          {/* Title */}
          <div className="text-center flex flex-col gap-4" style={{ animation: "fadeIn 0.7s ease both" }}>
            <div className="inline-flex items-center justify-center gap-2 mx-auto mb-2">
              <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-purple-500/70">
                AI · Real-time · Live
              </span>
            </div>
            <h1
              className="glitch-text font-extrabold text-white leading-none tracking-tight select-none"
              data-text="Debate Arena"
              style={{ fontSize: "clamp(3.5rem, 11vw, 7.5rem)", letterSpacing: "-0.04em",
                textShadow: "0 0 60px rgba(109,40,217,0.35)" }}
            >
              Debate Arena
            </h1>
            <p className="text-base sm:text-lg font-light max-w-md mx-auto leading-relaxed"
              style={{ color: "#a1a1aa", animation: "fadeUp 0.8s 0.3s ease both" }}>
              Two AI minds. One question. You decide who wins.
            </p>
            <div className="w-16 h-px mx-auto mt-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Fighter select */}
          <div className="flex flex-col gap-4" style={{ animation: "fadeUp 0.8s 0.5s ease both" }}>
            <p className="text-center text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-600">
              Choose your fighters
            </p>

            {/* Mobile: stacked. Desktop: 3 col */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_48px_1fr] gap-3 sm:gap-4 items-center">
              {/* Agent A */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-center text-zinc-600">Player 1</p>
                {FIGHTERS.map((f) => (
                  <button key={f.id} type="button"
                    onClick={() => { if (agentB !== f.id) setAgentA(f.id); }}
                    disabled={agentB === f.id}
                    className="w-full text-left rounded-xl px-4 py-3 transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
                    style={{
                      background: agentA === f.id ? f.dimBg : "rgba(255,255,255,0.02)",
                      border: `1px solid ${agentA === f.id ? f.border : "rgba(255,255,255,0.06)"}`,
                      boxShadow: agentA === f.id ? `0 0 20px ${f.dimBg}` : "none",
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{f.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{f.id}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#a1a1aa" }}>{f.tagline}</p>
                      </div>
                      {agentA === f.id && (
                        <span className="ml-auto text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                          style={{ background: f.color, color: "#000" }}>P1</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* VS */}
              <div className="flex items-center justify-center py-2 sm:py-0">
                <span className="text-zinc-700 font-black text-lg sm:text-xl tracking-wider">VS</span>
              </div>

              {/* Agent B */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-center text-zinc-600">Player 2</p>
                {FIGHTERS.map((f) => (
                  <button key={f.id} type="button"
                    onClick={() => { if (agentA !== f.id) setAgentB(f.id); }}
                    disabled={agentA === f.id}
                    className="w-full text-left rounded-xl px-4 py-3 transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
                    style={{
                      background: agentB === f.id ? f.dimBg : "rgba(255,255,255,0.02)",
                      border: `1px solid ${agentB === f.id ? f.border : "rgba(255,255,255,0.06)"}`,
                      boxShadow: agentB === f.id ? `0 0 20px ${f.dimBg}` : "none",
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{f.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{f.id}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#a1a1aa" }}>{f.tagline}</p>
                      </div>
                      {agentB === f.id && (
                        <span className="ml-auto text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                          style={{ background: f.color, color: "#000" }}>P2</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Topic input */}
          <div className="flex flex-col gap-3" style={{ animation: "fadeUp 0.8s 0.7s ease both" }}>
            <label className="text-sm font-medium" style={{ color: "#a1a1aa" }}>What should they debate?</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleStart(); }}
              placeholder="e.g. AI will ultimately benefit humanity more than it harms it"
              rows={3}
              className="w-full resize-none rounded-xl px-4 py-3.5 text-white text-[15px] leading-relaxed outline-none transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                caretColor: "#7c3aed",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(124,58,237,0.5)";
                e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.08)";
                e.target.style.boxShadow = "none";
              }}
            />
            {error && <p className="text-rose-400 text-sm">{error}</p>}
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3" style={{ animation: "fadeUp 0.8s 0.9s ease both" }}>
            <button
              type="button"
              onClick={handleStart}
              disabled={loading || !topic.trim()}
              className="w-full rounded-xl py-4 text-[15px] font-semibold text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
                boxShadow: topic.trim() && !loading ? "0 8px 32px rgba(124,58,237,0.35)" : "none",
              }}
              onMouseEnter={(e) => { if (!loading && topic.trim()) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(124,58,237,0.45)"; }}}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = topic.trim() && !loading ? "0 8px 32px rgba(124,58,237,0.35)" : "none"; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Starting debate…
                </span>
              ) : "Start Debate →"}
            </button>
            <p className="text-xs" style={{ color: "#71717a" }}>Powered by Groq · Arguments stream in real time · Press ⌘↵ to start</p>
          </div>

        </div>
      </main>
    </div>
  );
}
