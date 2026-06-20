"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FIGHTERS = [
  {
    id: "Optimist",
    emoji: "☀️",
    tagline: "The Eternal Believer",
  },
  {
    id: "Critic",
    emoji: "💀",
    tagline: "The Devil's Advocate",
  },
  {
    id: "Philosopher",
    emoji: "👁️",
    tagline: "The Truth Seeker",
  },
] as const;

/* ---------- Particles ---------- */
const Particles = memo(function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 0.8 + 0.6,
        duration: Math.random() * 24 + 18,
        delay: Math.random() * 16,
        drift: (Math.random() - 0.5) * 80,
        opacity: Math.random() * 0.12 + 0.04,
        color: ["#7c3aed", "#6d28d9", "#a78bfa", "#4f46e5"][Math.floor(Math.random() * 4)],
      })),
    []
  );
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
            animation: `particle-rise ${p.duration}s ${p.delay}s linear infinite`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
});

/* ---------- Gradient orbs ---------- */
const GradientOrbs = memo(function GradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 600, height: 600,
          top: "-20%", left: "-15%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)",
          animation: "orb-drift-1 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 500, height: 500,
          bottom: "-15%", right: "-12%",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)",
          animation: "orb-drift-2 24s ease-in-out infinite",
        }}
      />
    </div>
  );
});

/* ---------- Fighter card ---------- */
function FighterCard({
  fighter,
  isSelected,
  isDisabled,
  onSelect,
  slot,
}: {
  fighter: typeof FIGHTERS[number];
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
  slot: "P1" | "P2";
}) {
  return (
    <button
      type="button"
      onClick={() => { if (!isDisabled && !isSelected) onSelect(); }}
      disabled={isDisabled}
      className="w-full text-left rounded-2xl p-4 relative transition-all duration-300"
      style={{
        background: isSelected ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${isSelected ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: isSelected ? "0 0 0 1px rgba(124,58,237,0.15), 0 8px 32px rgba(124,58,237,0.12)" : "none",
        opacity: isDisabled ? 0.25 : 1,
        cursor: isDisabled ? "not-allowed" : isSelected ? "default" : "pointer",
        transform: isSelected ? "none" : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${isSelected ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          {fighter.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-white tracking-tight">{fighter.id}</p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{fighter.tagline}</p>
        </div>
        {isSelected && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(124,58,237,0.25)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            {slot}
          </span>
        )}
      </div>
    </button>
  );
}

/* ============================================================
   HOME PAGE
   ============================================================ */
export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [agentA, setAgentA] = useState("Optimist");
  const [agentB, setAgentB] = useState("Critic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit() {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/debate/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), agent_a: agentA, agent_b: agentB }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to start debate");
      }
      const data = await res.json();
      router.push(`/debate/${data.debate_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "#050508" }}>
      <Particles />
      <GradientOrbs />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16 overflow-x-hidden">
        <div
          className="w-full max-w-2xl flex flex-col gap-10 sm:gap-12"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          {/* ── TITLE ── */}
          <div className="text-center flex flex-col items-center gap-4">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium tracking-widest uppercase"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
              AI-Powered Debates · Beta
            </div>

            {/* Main title */}
            <h1
              className="font-extrabold text-white leading-none select-none breathe"
              style={{
                fontSize: "clamp(3.5rem, 12vw, 8rem)",
                letterSpacing: "-0.04em",
                textShadow: "0 0 60px rgba(124,58,237,0.3)",
              }}
            >
              Debate Arena
            </h1>

            <p className="text-zinc-400 text-base sm:text-lg font-light max-w-sm">
              Two AI minds. One question. You decide.
            </p>

            <div
              className="w-20 h-px mt-1"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>

          {/* ── FIGHTER SELECT ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs text-zinc-600 tracking-widest uppercase text-center font-medium">
              Choose your fighters
            </p>

            {/* Mobile: stack. sm+: 3-column */}
            <div className="flex flex-col gap-5 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:items-start">
              {/* Agent A */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-center text-zinc-600">
                  Player 1
                </p>
                {FIGHTERS.map((f) => (
                  <FighterCard
                    key={f.id}
                    fighter={f}
                    isSelected={agentA === f.id}
                    isDisabled={agentB === f.id}
                    onSelect={() => setAgentA(f.id)}
                    slot="P1"
                  />
                ))}
              </div>

              {/* VS */}
              <div className="flex items-center justify-center py-1 sm:pt-10 sm:py-0 px-3">
                <span
                  className="font-black text-xl sm:text-2xl select-none"
                  style={{ color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}
                >
                  VS
                </span>
              </div>

              {/* Agent B */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-center text-zinc-600">
                  Player 2
                </p>
                {FIGHTERS.map((f) => (
                  <FighterCard
                    key={f.id}
                    fighter={f}
                    isSelected={agentB === f.id}
                    isDisabled={agentA === f.id}
                    onSelect={() => setAgentB(f.id)}
                    slot="P2"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── TOPIC ── */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400 font-medium">
              What should they debate?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI will benefit humanity more than it harms it…"
              rows={3}
              className="w-full resize-none rounded-2xl px-4 py-3.5 text-white placeholder-zinc-700 outline-none transition-all duration-200 text-[15px] leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(124,58,237,0.4)";
                e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(255,255,255,0.08)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <p className="text-rose-400 text-sm text-center -mt-4">
              {error}
            </p>
          )}

          {/* ── START BUTTON ── */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !topic.trim()}
              className="w-full rounded-2xl text-sm font-semibold tracking-wide text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"
              style={{
                height: 56,
                background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
                boxShadow: (!loading && topic.trim()) ? "0 8px 32px rgba(124,58,237,0.3)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!loading && topic.trim()) {
                  e.currentTarget.style.filter = "brightness(1.1)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(124,58,237,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "";
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = (!loading && topic.trim()) ? "0 8px 32px rgba(124,58,237,0.3)" : "none";
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Starting debate…
                </span>
              ) : (
                "Start Debate →"
              )}
            </button>
            <p className="text-zinc-700 text-xs text-center">
              Powered by Groq · Arguments stream in real time
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
