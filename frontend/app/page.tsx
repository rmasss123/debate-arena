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
    bio: "Finds opportunity in every obstacle. Argues from hope, progress, and the best of humanity.",
  },
  {
    id: "Critic",
    emoji: "💀",
    tagline: "The Devil's Advocate",
    color: "#f43f5e",
    colorRgb: "244,63,94",
    bio: "Tears apart assumptions. Exposes logical gaps, unintended consequences, and hard truths.",
  },
  {
    id: "Philosopher",
    emoji: "👁️",
    tagline: "The Truth Seeker",
    color: "#8b5cf6",
    colorRgb: "139,92,246",
    bio: "Reframes the question itself. Operates from first principles, ethics, and existential clarity.",
  },
] as const;

function visualValue(index: number, salt: number) {
  return ((index * 137 + salt * 271) % 997) / 997;
}

const HOME_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: visualValue(i, 1) * 100,
  size: visualValue(i, 2) * 1.5 + 0.5,
  duration: visualValue(i, 3) * 20 + 15,
  delay: visualValue(i, 4) * 15,
  drift: (visualValue(i, 5) - 0.5) * 80,
  opacity: visualValue(i, 6) * 0.12 + 0.03,
  color: ["#7c3aed", "#6d28d9", "#4f46e5"][Math.floor(visualValue(i, 7) * 3)],
}));

const TOPIC_PROMPTS = [
  "AI deserves legal rights",
  "Privacy is already dead",
  "Social media does more harm than good",
  "Mars should be humanity's priority",
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

      {/* Nav */}
      <nav className="home-nav relative z-30">
        <span className="home-brand">Debate Arena</span>
        <div className="flex items-center gap-2">
          <span className="arena-live-dot" />
          <span className="text-[10px] font-mono text-rose-500 font-bold uppercase tracking-widest">Live</span>
          <span className="text-zinc-800 mx-1">·</span>
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Groq · 3 rounds</span>
        </div>
      </nav>

      {/* Hero image */}
      <div className="fight-viewport relative z-10 mx-3 sm:mx-6 mt-4 rounded-[28px]">
        <div className="fight-image" aria-hidden />
        <div className="fight-vignette" aria-hidden />

        {/* Title overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <h1 className="arena-wordmark select-none" aria-label="Debate Arena">
            <span className="arena-wordmark-solid">DEBATE</span>
            <span className="arena-wordmark-outline">ARENA</span>
          </h1>
          <p className="mt-3 text-xs text-white/35 hidden sm:block tracking-wide">
            Two AI minds. One topic. No mercy.
          </p>
        </div>

        {/* Fighter name HUDs */}
        <div className="fight-hud fight-hud-left z-20">
          <span className="fight-hud-index text-emerald-400 font-mono tracking-widest flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </span>
          <strong>{fighterA.emoji} {fighterA.id}</strong>
          <small className="mt-1 font-sans" style={{ color: fighterA.color }}>{fighterA.tagline}</small>
        </div>
        <div className="fight-hud fight-hud-right z-20">
          <span className="fight-hud-index text-rose-400 font-mono tracking-widest flex items-center gap-1.5 justify-end">
            ONLINE
            <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
          </span>
          <strong>{fighterB.id} {fighterB.emoji}</strong>
          <small className="mt-1 font-sans" style={{ color: fighterB.color }}>{fighterB.tagline}</small>
        </div>

        {/* VS */}
        <div className="fight-impact z-20" aria-hidden>
          <span className="fight-impact-ring fight-impact-ring-a" />
          <span className="fight-impact-ring fight-impact-ring-b" />
          <b className="font-mono">VS</b>
        </div>
      </div>

      {/* Main form */}
      <main className="relative z-10 flex-1 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">

        {loading ? (
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
            {/* Topic */}
            <div>
              <label htmlFor="debate-topic" className="block text-sm font-semibold text-zinc-300 mb-3">
                What should they debate?
              </label>
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
              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-wrap gap-2">
                  {TOPIC_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => setTopic(prompt)}
                      className="home-suggestion">
                      {prompt}
                    </button>
                  ))}
                </div>
                <span className={`text-[10px] font-mono flex-shrink-0 ml-3 transition-colors ${charCount > 480 ? "text-amber-500" : "text-zinc-700"}`}>
                  {charCount}/500
                </span>
              </div>
            </div>

            {/* Fighter picker */}
            <div>
              <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest mb-4">Choose your fighters</p>

              <div className="home-picker-grid">
                {/* Side A */}
                <div>
                  <p className="home-side-tag">Side A</p>
                  <div className="flex flex-col gap-2">
                    {FIGHTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        disabled={agentB === f.id}
                        onClick={() => { if (agentB !== f.id) setAgentA(f.id); }}
                        aria-label={`Pick ${f.id} as fighter A`}
                        className="hp-fighter-btn"
                        data-active={agentA === f.id}
                        data-disabled={agentB === f.id}
                        style={{ "--fc": f.color, "--fc-rgb": f.colorRgb } as React.CSSProperties}
                      >
                        <span className="hp-fighter-emoji">{f.emoji}</span>
                        <div className="hp-fighter-text">
                          <span className="hp-fighter-name">{f.id}</span>
                          <span className="hp-fighter-tagline" style={{ color: f.color }}>{f.tagline}</span>
                        </div>
                        {agentA === f.id && <span className="hp-check">✓</span>}
                      </button>
                    ))}
                  </div>
                  {/* Selected bio */}
                  <p className="hp-bio mt-3">{fighterA.bio}</p>
                </div>

                {/* Divider */}
                <div className="home-vs-col" aria-hidden>
                  <div className="home-vs-line" />
                  <div className="home-vs-core">VS</div>
                  <div className="home-vs-line" />
                </div>

                {/* Side B */}
                <div>
                  <p className="home-side-tag text-right">Side B</p>
                  <div className="flex flex-col gap-2">
                    {FIGHTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        disabled={agentA === f.id}
                        onClick={() => { if (agentA !== f.id) setAgentB(f.id); }}
                        aria-label={`Pick ${f.id} as fighter B`}
                        className="hp-fighter-btn"
                        data-active={agentB === f.id}
                        data-disabled={agentA === f.id}
                        style={{ "--fc": f.color, "--fc-rgb": f.colorRgb } as React.CSSProperties}
                      >
                        <span className="hp-fighter-emoji">{f.emoji}</span>
                        <div className="hp-fighter-text">
                          <span className="hp-fighter-name">{f.id}</span>
                          <span className="hp-fighter-tagline" style={{ color: f.color }}>{f.tagline}</span>
                        </div>
                        {agentB === f.id && <span className="hp-check">✓</span>}
                      </button>
                    ))}
                  </div>
                  <p className="hp-bio mt-3 text-right">{fighterB.bio}</p>
                </div>
              </div>
            </div>

            {/* Start */}
            <button type="button" onClick={handleStart} disabled={loading || !topic.trim()}
              className="home-start-btn">
              <span>Start the debate</span>
              <span className="home-start-arrow">→</span>
            </button>

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
          <span>Live Streaming</span>
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
