"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FIGHTERS = [
  {
    id: "Optimist",
    emoji: "☀️",
    tagline: "The Eternal Believer",
    color: "#10b981",
    colorRgb: "16,185,129",
    style: "Rhetoric · Empathy",
    bio: "Finds opportunity in every obstacle. Argues from hope, progress, and the best of humanity.",
  },
  {
    id: "Critic",
    emoji: "💀",
    tagline: "The Devil's Advocate",
    color: "#f43f5e",
    colorRgb: "244,63,94",
    style: "Skepticism · Logic",
    bio: "Tears apart assumptions. Exposes logical gaps, unintended consequences, and hard truths.",
  },
  {
    id: "Philosopher",
    emoji: "👁️",
    tagline: "The Truth Seeker",
    color: "#8b5cf6",
    colorRgb: "139,92,246",
    style: "Dialectic · Synthesis",
    bio: "Reframes the question itself. Operates from first principles, ethics, and existential clarity.",
  },
] as const;

function visualValue(index: number, salt: number) {
  return ((index * 137 + salt * 271) % 997) / 997;
}

const HOME_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: visualValue(i, 1) * 100,
  size: visualValue(i, 2) * 2 + 0.5,
  duration: visualValue(i, 3) * 22 + 14,
  delay: visualValue(i, 4) * 16,
  drift: (visualValue(i, 5) - 0.5) * 90,
  opacity: visualValue(i, 6) * 0.12 + 0.03,
  color: ["#7c3aed", "#6d28d9", "#4f46e5", "#db2777"][Math.floor(visualValue(i, 7) * 4)],
}));

const TOPIC_PROMPTS = [
  "AI deserves legal rights",
  "Privacy is already dead",
  "Social media does more harm than good",
  "Mars colonization should be humanity's priority",
  "Universal basic income will save us",
];

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

function FighterCard({
  fighter,
  selected,
  disabled,
  side,
  onClick,
}: {
  fighter: typeof FIGHTERS[number];
  selected: boolean;
  disabled: boolean;
  side: "A" | "B";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Pick ${fighter.id} as fighter ${side}`}
      className="fighter-card"
      style={{
        "--fc-color": fighter.color,
        "--fc-rgb": fighter.colorRgb,
        opacity: disabled ? 0.22 : 1,
      } as React.CSSProperties}
      data-selected={selected}
    >
      {selected && <div className="fighter-card-selected-ring" aria-hidden />}
      <div className="fighter-card-emoji">{fighter.emoji}</div>
      <div className="fighter-card-name">{fighter.id}</div>
      <div className="fighter-card-tagline" style={{ color: fighter.color }}>{fighter.tagline}</div>
      <div className="fighter-card-bio">{fighter.bio}</div>
      <div className="fighter-card-style">{fighter.style}</div>
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [agentA, setAgentA] = useState<string>("Optimist");
  const [agentB, setAgentB] = useState<string>("Critic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const fighterA = FIGHTERS.find((f) => f.id === agentA) ?? FIGHTERS[0];
  const fighterB = FIGHTERS.find((f) => f.id === agentB) ?? FIGHTERS[1];

  const charCount = topic.length;
  const charOver = charCount > 480;

  useEffect(() => {
    if (!loading) return;
    const messages = [
      `[SYS] Connecting to ${API}...`,
      `[CORE_01] Loading ${fighterA.id} — STATUS: READY`,
      `[CORE_02] Loading ${fighterB.id} — STATUS: READY`,
      `[LOCK] Topic: "${topic.trim()}"`,
      `[GROQ] Priming inference shards...`,
      `[ARENA] Stream ready — launching debate`,
    ];
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        const next = prev + 1;
        if (next < messages.length) {
          setTerminalLogs((logs) => [...logs, messages[next]]);
          return next;
        }
        clearInterval(interval);
        return prev;
      });
    }, 480);
    return () => clearInterval(interval);
  }, [loading, fighterA, fighterB, topic]);

  async function handleStart() {
    if (!topic.trim() || loading) return;
    setLoadingStep(0);
    setTerminalLogs([`[SYS] Connecting to ${API}...`]);
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
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: "#050508" }}>
      <Particles />

      {/* Background orbs */}
      <div aria-hidden className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="home-orb home-orb-a" />
        <div className="home-orb home-orb-b" />
        <div className="home-orb home-orb-c" />
      </div>

      {/* Nav */}
      <nav className="home-nav relative z-30">
        <span className="home-brand">Debate Arena</span>
        <div className="flex items-center gap-3">
          <span className="arena-live-dot" />
          <span className="text-[10px] font-mono text-rose-500 font-bold uppercase tracking-widest">Live</span>
          <span className="home-nav-sep" />
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Groq · 3 rounds</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 text-center pt-14 pb-8 px-4">
        <div className="home-eyebrow">
          <span className="home-eyebrow-dot" />
          AI Debate Engine
        </div>
        <h1 className="home-title">
          Let AI<br />
          <span className="home-title-accent">settle it.</span>
        </h1>
        <p className="home-subtitle">
          Pick two AI minds, give them a topic, watch them clash.
        </p>
      </div>

      {/* Main form */}
      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-4 pb-16 flex flex-col gap-10">

        {loading ? (
          /* Loading terminal */
          <div className="home-terminal">
            <div className="home-terminal-header">
              <span className="home-terminal-dot" style={{ background: "#ef4444" }} />
              <span className="home-terminal-dot" style={{ background: "#f59e0b" }} />
              <span className="home-terminal-dot" style={{ background: "#10b981" }} />
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-500 uppercase ml-2">
                Launching arena…
              </span>
            </div>
            <div className="space-y-1.5 mt-4">
              {terminalLogs.map((log, i) => (
                <div key={i} className="loading-terminal-log">{log}</div>
              ))}
              {loadingStep < 5 && (
                <div className="loading-terminal-log flex items-center gap-1 text-emerald-400/40">
                  <span>&gt;_ connecting</span>
                  <span className="inline-block w-1.5 h-3.5 bg-emerald-500 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Topic input */}
            <div className="home-topic-section">
              <label htmlFor="debate-topic" className="home-section-label">
                What should they debate?
              </label>
              <div className="home-topic-wrap">
                <textarea
                  id="debate-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleStart(); }}
                  placeholder="Drop a hot take, a hard question, or a controversial statement…"
                  rows={3}
                  maxLength={500}
                  className="home-textarea"
                />
                <div className="home-topic-footer">
                  <div className="flex flex-wrap gap-2">
                    {TOPIC_PROMPTS.map((prompt) => (
                      <button key={prompt} type="button" onClick={() => setTopic(prompt)}
                        className="home-suggestion">
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <span className={`home-char-count ${charOver ? "home-char-count-warn" : ""}`}>
                    {charCount}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Fighter picker */}
            <div>
              <p className="home-section-label mb-5">Choose your fighters</p>
              <div className="home-matchup">

                {/* Side A */}
                <div className="home-side">
                  <p className="home-side-label">Side A</p>
                  <div className="home-fighter-grid">
                    {FIGHTERS.map((f) => (
                      <FighterCard
                        key={f.id}
                        fighter={f}
                        selected={agentA === f.id}
                        disabled={agentB === f.id}
                        side="A"
                        onClick={() => { if (agentB !== f.id) setAgentA(f.id); }}
                      />
                    ))}
                  </div>
                </div>

                {/* VS divider */}
                <div className="home-vs-divider" aria-hidden>
                  <div className="home-vs-line" />
                  <div className="home-vs-core">VS</div>
                  <div className="home-vs-line" />
                </div>

                {/* Side B */}
                <div className="home-side">
                  <p className="home-side-label">Side B</p>
                  <div className="home-fighter-grid">
                    {FIGHTERS.map((f) => (
                      <FighterCard
                        key={f.id}
                        fighter={f}
                        selected={agentB === f.id}
                        disabled={agentA === f.id}
                        side="B"
                        onClick={() => { if (agentA !== f.id) setAgentB(f.id); }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected matchup summary */}
              <div className="home-matchup-summary">
                <span style={{ color: fighterA.color }}>{fighterA.emoji} {fighterA.id}</span>
                <span className="text-zinc-700 mx-2 font-mono font-black italic">vs</span>
                <span style={{ color: fighterB.color }}>{fighterB.emoji} {fighterB.id}</span>
              </div>
            </div>

            {/* Start button */}
            <div>
              <button type="button" onClick={handleStart} disabled={loading || !topic.trim()}
                className="home-start-btn">
                <span>Start the debate</span>
                <span className="home-start-arrow">→</span>
              </button>
              <p className="text-center text-[10px] font-mono text-zinc-700 mt-3 tracking-wider uppercase">
                ⌘ + Enter to launch
              </p>
            </div>

            {error && (
              <div className="text-rose-400 text-sm p-3 rounded-xl border border-rose-950/30 bg-rose-950/10 flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                {error}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="relative z-10 text-center pb-6">
        <div className="home-feature-strip">
          <span>Live SSE Streaming</span>
          <span className="home-feature-dot" />
          <span>Groq Inference</span>
          <span className="home-feature-dot" />
          <span>3 Rounds</span>
          <span className="home-feature-dot" />
          <span>Argument Scoring</span>
        </div>
      </footer>
    </div>
  );
}
