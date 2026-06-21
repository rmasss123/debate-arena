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
    model: "LLAMA-3-70B-INSTRUCT",
    bio: "Builds constructive arguments grounded in human potential, progress, and ethical synergy.",
  },
  {
    id: "Critic",
    emoji: "💀",
    tagline: "The Devil's Advocate",
    color: "#f43f5e",
    colorRgb: "244,63,94",
    style: "Skepticism · Logic",
    model: "MIXTRAL-8X22B",
    bio: "Exposes logical fallacies, uncovers hidden agendas, and demands empirical rigor.",
  },
  {
    id: "Philosopher",
    emoji: "👁️",
    tagline: "The Truth Seeker",
    color: "#8b5cf6",
    colorRgb: "139,92,246",
    style: "Dialectic · Synthesis",
    model: "CLAUDE-3.5-SONNET",
    bio: "Evaluates ethical implications, historical contexts, and existential truths.",
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
  opacity: visualValue(i, 6) * 0.15 + 0.04,
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
  const [loadingStep, setLoadingStep] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const fighterA = FIGHTERS.find((f) => f.id === agentA) ?? FIGHTERS[0];
  const fighterB = FIGHTERS.find((f) => f.id === agentB) ?? FIGHTERS[1];

  const topicPrompts = [
    "AI deserves legal rights",
    "Privacy is already dead",
    "Mars should be humanity's priority",
  ];

  useEffect(() => {
    if (!loading) return;
    const messages = [
      `[SYS] Connecting to ${API}...`,
      `[SYS] Loading ${fighterA.id} (${fighterA.model})`,
      `[SYS] Loading ${fighterB.id} (${fighterB.model})`,
      `[SYS] Topic locked: "${topic.trim()}"`,
      `[SYS] Priming Groq inference...`,
      `[SYS] Stream ready — launching debate`,
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
    <div className="min-h-screen flex flex-col overflow-x-hidden fade-in" style={{ background: "#050508" }}>
      <Particles />

      {/* ── Minimal nav ── */}
      <nav className="home-nav relative z-30">
        <span className="home-brand">Debate Arena</span>
        <div className="flex items-center gap-2">
          <span className="arena-live-dot" />
          <span className="text-[10px] font-mono text-rose-500 font-bold uppercase tracking-widest">Live</span>
          <span className="text-zinc-800 mx-1">·</span>
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Groq · 3 rounds</span>
        </div>
      </nav>

      {/* ── Hero image — full width, title overlaid ── */}
      <div className="fight-viewport relative z-10 mx-3 sm:mx-6 mt-4 rounded-[28px]">
        <div className="fight-image" aria-hidden />
        <div className="fight-vignette" aria-hidden />

        {/* Centered title */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
          <h1 className="arena-wordmark select-none" aria-label="Debate Arena">
            <span className="arena-wordmark-solid">DEBATE</span>
            <span className="arena-wordmark-outline">ARENA</span>
          </h1>
          <p className="mt-4 text-sm text-white/40 max-w-xs leading-relaxed hidden sm:block">
            Pit two AI minds against each other on any topic
          </p>
        </div>

        {/* Fighter HUDs */}
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
        <div className="fight-impact z-20" aria-hidden>
          <span className="fight-impact-ring fight-impact-ring-a" />
          <span className="fight-impact-ring fight-impact-ring-b" />
          <b className="font-mono">VS</b>
        </div>
        <div className="fight-readout z-20" aria-hidden>
          <span>{fighterA.model}</span><i /><span>{fighterB.model}</span>
        </div>
      </div>

      {/* ── Main form ── */}
      <main className="relative z-10 flex-1 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">

        {loading ? (
          /* Loading terminal */
          <div className="bg-[#030306] border border-zinc-900/80 rounded-2xl p-5 font-mono">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">Launching debate…</span>
            </div>
            <div className="space-y-1.5">
              {terminalLogs.map((log, i) => (
                <div key={i} className="loading-terminal-log text-xs">{log}</div>
              ))}
              {loadingStep < 5 && (
                <div className="loading-terminal-log text-xs flex items-center gap-1 text-emerald-400/50">
                  <span>&gt;_ connecting</span>
                  <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ── Topic input ── */}
            <div>
              <label htmlFor="debate-topic" className="block text-sm font-medium text-zinc-300 mb-3">
                What should they debate?
              </label>
              <textarea
                id="debate-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleStart(); }}
                placeholder="Drop a hot take, a hard question, or a controversial statement…"
                rows={3}
                className="home-textarea"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {topicPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => setTopic(prompt)}
                    className="home-suggestion">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Fighter picker ── */}
            <div>
              <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest mb-4">Choose your fighters</p>
              <div className="home-picker">

                {/* Side A */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-wider mb-2">Side A</p>
                  <div className="flex gap-2">
                    {FIGHTERS.map((f) => (
                      <button key={f.id} type="button"
                        onClick={() => { if (agentB !== f.id) setAgentA(f.id); }}
                        disabled={agentB === f.id}
                        aria-label={`Pick ${f.id} as fighter A`}
                        className={`home-fighter-btn ${agentA === f.id ? "home-fighter-btn-active" : ""}`}
                        style={{ "--chip-color": f.color } as React.CSSProperties}>
                        <span>{f.emoji}</span>
                        <span className="hidden sm:inline text-[11px]">{f.id}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-2 leading-snug">{fighterA.bio}</p>
                </div>

                <div className="home-vs-pip flex-shrink-0">VS</div>

                {/* Side B */}
                <div className="flex-1 min-w-0 flex flex-col items-end">
                  <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-wider mb-2">Side B</p>
                  <div className="flex gap-2">
                    {FIGHTERS.map((f) => (
                      <button key={f.id} type="button"
                        onClick={() => { if (agentA !== f.id) setAgentB(f.id); }}
                        disabled={agentA === f.id}
                        aria-label={`Pick ${f.id} as fighter B`}
                        className={`home-fighter-btn ${agentB === f.id ? "home-fighter-btn-active" : ""}`}
                        style={{ "--chip-color": f.color } as React.CSSProperties}>
                        <span>{f.emoji}</span>
                        <span className="hidden sm:inline text-[11px]">{f.id}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-2 text-right leading-snug">{fighterB.bio}</p>
                </div>
              </div>
            </div>

            {/* ── Start button ── */}
            <button type="button" onClick={handleStart} disabled={loading || !topic.trim()}
              className="home-start-btn">
              Start the debate →
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

      <footer className="relative z-10 text-center pb-6 text-[11px] text-zinc-800 font-mono">
        Powered by Groq · Live SSE streaming · 3 rounds per debate
      </footer>
    </div>
  );
}
