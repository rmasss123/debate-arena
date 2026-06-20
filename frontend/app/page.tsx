"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FIGHTERS = [
  {
    id: "Optimist",
    emoji: "☀️",
    tagline: "The Eternal Believer",
    color: "#10b981",
    glow: "rgba(16,185,129,0.5)",
    dimBg: "rgba(16,185,129,0.06)",
    neonClass: "neon-emerald",
  },
  {
    id: "Critic",
    emoji: "💀",
    tagline: "The Devil's Advocate",
    color: "#f43f5e",
    glow: "rgba(244,63,94,0.5)",
    dimBg: "rgba(244,63,94,0.06)",
    neonClass: "neon-rose",
  },
  {
    id: "Philosopher",
    emoji: "👁️",
    tagline: "The Truth Seeker",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.5)",
    dimBg: "rgba(139,92,246,0.06)",
    neonClass: "neon-violet",
  },
] as const;

/* ---------- Particles ---------- */
const Particles = memo(function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 2.5 + 0.8,
        duration: Math.random() * 18 + 12,
        delay: Math.random() * 12,
        drift: (Math.random() - 0.5) * 120,
        opacity: Math.random() * 0.45 + 0.1,
        color: ["#a855f7", "#8b5cf6", "#6366f1", "#ec4899", "#10b981"][Math.floor(Math.random() * 5)],
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
          width: 500, height: 500,
          top: "-15%", left: "-10%",
          background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)",
          animation: "orb-drift-1 14s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 420, height: 420,
          bottom: "-10%", right: "-8%",
          background: "radial-gradient(circle, rgba(244,63,94,0.14) 0%, transparent 70%)",
          animation: "orb-drift-2 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 340, height: 340,
          top: "40%", left: "55%",
          background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
          animation: "orb-drift-3 22s ease-in-out infinite",
        }}
      />
    </div>
  );
});

/* ---------- Typewriter ---------- */
function TypewriterText({ text, speed = 40 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); setDone(true); }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="text-purple-400 opacity-80">|</span>}
    </span>
  );
}

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
  const [shaking, setShaking] = useState(false);

  function handleClick() {
    if (isDisabled || isSelected) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 550);
    onSelect();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`w-full text-left rounded-xl border transition-all duration-300 p-3 relative overflow-hidden
        ${shaking ? "fighter-shake" : ""}
        ${isDisabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}
        ${!isDisabled && !isSelected ? "hover:scale-[1.02]" : ""}
      `}
      style={{
        borderColor: isSelected ? fighter.color : isDisabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)",
        background: isSelected ? fighter.dimBg : "rgba(255,255,255,0.02)",
        boxShadow: isSelected
          ? `0 0 20px ${fighter.glow}, 0 0 40px ${fighter.glow.replace("0.5", "0.25")}`
          : "none",
      }}
    >
      {/* Flash overlay on select */}
      {shaking && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ background: `${fighter.color}22`, animation: "vs-flash 0.15s ease 2" }}
        />
      )}

      <div className="flex items-center gap-3">
        {/* Avatar circle */}
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl flex-shrink-0 transition-all duration-300"
          style={{
            border: `2px solid ${isSelected ? fighter.color : "rgba(255,255,255,0.1)"}`,
            background: `radial-gradient(circle, ${fighter.dimBg} 0%, transparent 70%)`,
            boxShadow: isSelected ? `0 0 14px ${fighter.glow}` : "none",
          }}
        >
          {fighter.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs sm:text-sm text-white tracking-wide">{fighter.id.toUpperCase()}</p>
          <p
            className="text-[10px] sm:text-xs mt-0.5 truncate transition-colors duration-300"
            style={{ color: isSelected ? fighter.color : "#6b7280" }}
          >
            {fighter.tagline}
          </p>
        </div>

        {isSelected && (
          <div
            className="text-[10px] font-black px-2 py-0.5 rounded tracking-widest flex-shrink-0"
            style={{ background: fighter.color, color: "#000" }}
          >
            {slot}
          </div>
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
  const [btnHover, setBtnHover] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="scanlines min-h-screen flex flex-col relative" style={{ background: "#08080d" }}>
      <Particles />
      <GradientOrbs />

      {/* Scanline sweep */}
      <div
        className="fixed left-0 right-0 h-16 pointer-events-none z-10"
        style={{
          background: "linear-gradient(transparent, rgba(255,255,255,0.015), transparent)",
          animation: "scanline-sweep 10s linear infinite",
        }}
      />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16 overflow-x-hidden">
        <div className="w-full max-w-3xl flex flex-col gap-8 sm:gap-10">

          {/* ── TITLE ── */}
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.3em] sm:tracking-[0.4em] text-purple-500 uppercase mb-4 sm:mb-5">
              ⚡ AI-Powered · Real-Time · Live Voting
            </p>
            <h1
              className="glitch-text font-black text-white leading-none select-none mb-4 sm:mb-6"
              data-text="DEBATE ARENA"
              style={{
                fontSize: "clamp(2.5rem, 10vw, 7rem)",
                letterSpacing: "-0.02em",
                textShadow: "0 0 40px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.15)",
              }}
            >
              DEBATE ARENA
            </h1>
            <p className="text-zinc-400 text-base sm:text-xl min-h-[1.8em]">
              <TypewriterText
                text="Two AI minds. One topic. You decide who wins."
                speed={45}
              />
            </p>
          </div>

          {/* ── FIGHTER SELECT ── */}
          <div>
            <p
              className="text-center text-xs font-black tracking-[0.25em] sm:tracking-[0.35em] uppercase mb-4 sm:mb-5"
              style={{
                color: "#a855f7",
                textShadow: "0 0 20px rgba(168,85,247,0.6)",
              }}
            >
              ⚔ SELECT YOUR FIGHTERS ⚔
            </p>

            {/* Mobile: stack vertically. sm+: 3-column grid */}
            <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:items-start">
              {/* Agent A column */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-black tracking-widest text-center uppercase text-emerald-400 mb-1">
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
              <div className="flex items-center justify-center py-2 sm:pt-8 sm:py-0 px-2">
                <span
                  className="vs-flash font-black text-2xl sm:text-3xl select-none"
                  style={{ color: "#a855f7", letterSpacing: "0.05em" }}
                >
                  VS
                </span>
              </div>

              {/* Agent B column */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-black tracking-widest text-center uppercase text-rose-400 mb-1">
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
            <label className="text-[11px] font-black tracking-[0.3em] uppercase text-purple-400">
              ▶ Enter Debate Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g.  AI will ultimately benefit humanity more than it harms it…"
              rows={3}
              className="w-full resize-none rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none transition-all duration-300 text-[15px] leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(168,85,247,0.2)",
                boxShadow: topic ? "0 0 0 1px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.1)" : "none",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(168,85,247,0.7)";
                e.target.style.boxShadow = "0 0 0 1px rgba(168,85,247,0.4), 0 0 25px rgba(168,85,247,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(168,85,247,0.2)";
                e.target.style.boxShadow = topic ? "0 0 0 1px rgba(168,85,247,0.3)" : "none";
              }}
            />
          </div>

          {error && (
            <p className="text-rose-400 text-sm text-center -mt-2"
               style={{ textShadow: "0 0 10px rgba(244,63,94,0.5)" }}>
              ⚠ {error}
            </p>
          )}

          {/* ── START BUTTON ── */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !topic.trim()}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              className="w-full rounded-xl py-4 sm:py-5 text-sm sm:text-base font-black tracking-widest uppercase text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #dc2626 100%)",
                animation: !loading && topic.trim() ? "btn-pulse 2s ease-in-out infinite" : "none",
                transform: btnHover && !loading ? "scale(1.015)" : "scale(1)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Initializing Combat…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ⚡ START DEBATE ⚡
                </span>
              )}
            </button>
            <p className="text-zinc-600 text-xs tracking-wider text-center">
              Powered by Groq AI — arguments generated in real time
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
