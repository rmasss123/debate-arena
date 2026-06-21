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
    dimBg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.3)",
    style: "RHETORIC / EMPATHY",
    model: "LLAMA-3-70B-INSTRUCT",
    stats: { logic: 82, rhetoric: 95, speed: 88, power: 91 },
    bio: "Unwavering commitment to constructive outcomes. Believes in human potential, technological progress, and ethical synergy."
  },
  {
    id: "Critic",
    emoji: "💀",
    tagline: "The Devil's Advocate",
    color: "#f43f5e",
    colorRgb: "244,63,94",
    dimBg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.3)",
    style: "SKEPTICISM / LOGIC",
    model: "MIXTRAL-8X22B",
    stats: { logic: 96, rhetoric: 84, speed: 92, power: 89 },
    bio: "Relentless critical thinker. Exposes logical fallacies, uncovers hidden agendas, and demands empirical rigor."
  },
  {
    id: "Philosopher",
    emoji: "👁️",
    tagline: "The Truth Seeker",
    color: "#8b5cf6",
    colorRgb: "139,92,246",
    dimBg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.3)",
    style: "DIALECTIC / SYNTHESIS",
    model: "CLAUDE-3.5-SONNET",
    stats: { logic: 92, rhetoric: 91, speed: 85, power: 96 },
    bio: "Rises above binary logic to evaluate ethical implications, historical contexts, and existential truths."
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
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const fighterA = FIGHTERS.find((fighter) => fighter.id === agentA) ?? FIGHTERS[0];
  const fighterB = FIGHTERS.find((fighter) => fighter.id === agentB) ?? FIGHTERS[1];

  const topicPrompts = [
    "AI deserves legal rights",
    "Privacy is already dead",
    "Mars should be humanity's priority",
  ];

  useEffect(() => {
    if (!loading) return;

    const messages = [
      `[SYS] CONNECTING TO INFRASTRUCTURE HOST: ${API}...`,
      `[SYS] ESTABLISHING PARALLEL SYNAPSE HANDSHAKE...`,
      `[SYS] MOUNTING CORE 01: ${fighterA.id.toUpperCase()} [${fighterA.model}]`,
      `[SYS] MOUNTING CORE 02: ${fighterB.id.toUpperCase()} [${fighterB.model}]`,
      `[SYS] CONFLICT MATRIX INJECTED: "${topic.trim()}"`,
      `[SYS] PRIMING GROQ INFERENCE SHARDS...`,
      `[SYS] STREAM PATHWAY CREATED. INITIALIZING NEURAL COMBUSTION FEED...`
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
    }, 450);

    return () => clearInterval(interval);
  }, [loading, fighterA, fighterB, topic]);

  async function handleStart() {
    if (!topic.trim() || loading) return;
    setLoadingStep(0);
    setTerminalLogs([`[SYS] CONNECTING TO INFRASTRUCTURE HOST: ${API}...`]);
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
    <div className="arena-home min-h-screen flex flex-col overflow-x-hidden fade-in" style={{ background: "#050508" }}>
      <Particles />

      {/* Top Broadcast Overlay Bar */}
      <div className="w-full border-b border-zinc-900/80 bg-black/60 backdrop-blur-md px-4 py-2 relative z-30 flex flex-wrap items-center justify-between gap-4 text-[9px] font-mono tracking-wider text-zinc-500 uppercase select-none">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
          </span>
          <span className="text-rose-500 font-bold tracking-widest">{"LIVE BROADCAST"}</span>
          <span className="text-zinc-700">|</span>
          <span>{"FEED: PRIMARY-US-EAST"}</span>
          <span className="text-zinc-700">|</span>
          <span className="text-[#a78bfa] font-semibold">{"SECURE_LINK: ACTIVE"}</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">{"FPS:"}</span>
            <span className="text-emerald-500 font-semibold">{"60.0"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">{"LATENCY:"}</span>
            <span className="text-emerald-500 font-semibold">{"14ms"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">{"SPECTATORS:"}</span>
            <span className="text-violet-400 font-semibold">{"184,912 ONLINE"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-600">{"EST_EPOCH:"}</span>
          <span className="text-zinc-400 font-mono">{"2026.06.21"}</span>
        </div>
      </div>

      <div className="arena-ticker relative z-20 overflow-hidden py-2 bg-gradient-to-r from-violet-950/20 via-rose-950/10 to-violet-950/20 border-b border-violet-900/20">
        <div className="arena-ticker-track text-[9px] font-bold tracking-[0.32em] uppercase text-violet-400">
          <span>{"// COGNITIVE SYNC COMPLETE"}</span><i>✦</i>
          <span>{"// MODEL TEMP: 0.75"}</span><i>✦</i>
          <span>{"// ALL SYSTEMS OPERATIONAL"}</span><i>✦</i>
          <span>{"// SELECTION BAY ARMED"}</span><i>✦</i>
          <span>{"// STANDBY FOR CONTROVERSY MATRIX"}</span><i>✦</i>
          <span>{"// ROUND THRESHOLD: 3 ROUNDS"}</span><i>✦</i>
          
          <span>{"// COGNITIVE SYNC COMPLETE"}</span><i>✦</i>
          <span>{"// MODEL TEMP: 0.75"}</span><i>✦</i>
          <span>{"// ALL SYSTEMS OPERATIONAL"}</span><i>✦</i>
          <span>{"// SELECTION BAY ARMED"}</span><i>✦</i>
          <span>{"// STANDBY FOR CONTROVERSY MATRIX"}</span><i>✦</i>
          <span>{"// ROUND THRESHOLD: 3 ROUNDS"}</span><i>✦</i>
        </div>
      </div>

      <main className="relative z-10 flex-1 px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="arena-hero relative text-center mb-8 sm:mb-12 px-4 py-8 rounded-3xl border border-zinc-900/50 bg-gradient-to-b from-zinc-950/30 to-transparent backdrop-blur-sm">
            <div className="arena-corner arena-corner-tl" /><div className="arena-corner arena-corner-tr" />
            <div className="arena-corner arena-corner-bl" /><div className="arena-corner arena-corner-br" />
            <div className="telemetry-grid-overlay opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="arena-live-dot" />
                <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-violet-400">{"COGNITIVE FEED READY // 3 CORES DETECTED"}</span>
              </div>
              <h1 className="arena-wordmark select-none tracking-tighter" aria-label="Debate Arena">
                <span className="arena-wordmark-solid font-black bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">DEBATE</span>
                <span className="arena-wordmark-outline font-black">ARENA</span>
              </h1>
              <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-zinc-400 font-sans">
                Witness the clash of artificial minds. Plug in a controversy, load your gladiators, and let the inference engine settle the score.
              </p>
            </div>
          </header>

          <section className="fight-viewport mb-8" aria-label={`${fighterA.id} versus ${fighterB.id}`}>
            <div className="fight-image" aria-hidden />
            <div className="fight-vignette" aria-hidden />
            <div className="telemetry-grid-overlay opacity-30" />
            
            {/* Cyber Brackets in corners */}
            <div className="absolute inset-4 pointer-events-none border border-white/5 opacity-60">
              <div className="arena-corner arena-corner-tl" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
              <div className="arena-corner arena-corner-tr" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
              <div className="arena-corner arena-corner-bl" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
              <div className="arena-corner arena-corner-br" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
            </div>

            {/* Top telemetry bar */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center text-[8px] font-mono tracking-wider text-white/40">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-pulse" />
                <span>{"CAMERA_A: BROAD_LENS"}</span>
              </div>
              <span className="hidden md:inline">{"SIGNAL COHERENCE: 100% // NO DELAY"}</span>
              <span>{"RESOLVING POWER: "}{((fighterA.stats.power + fighterB.stats.power)/2).toFixed(1)}{"GW"}</span>
            </div>

            {/* Left Fighter Telemetry */}
            <div className="fight-hud fight-hud-left z-20">
              <span className="fight-hud-index text-emerald-400 font-mono tracking-widest flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                {"CHALLENGER_01 // ONLINE"}
              </span>
              <strong>{fighterA.id}</strong>
              <div className="mt-2 hidden sm:flex flex-col gap-1 w-44">
                <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
                  <span>{"LOGIC CORE"}</span>
                  <span className="text-emerald-400">{fighterA.stats.logic}{"%"}</span>
                </div>
                <div className="stasis-bar-container">
                  <div className="stasis-bar-fill" style={{ width: `${fighterA.stats.logic}%`, "--bar-color": fighterA.color } as React.CSSProperties} />
                  <div className="stasis-bar-glow" />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase mt-1">
                  <span>{"RHETORIC FLUIDITY"}</span>
                  <span className="text-emerald-400">{fighterA.stats.rhetoric}{"%"}</span>
                </div>
                <div className="stasis-bar-container">
                  <div className="stasis-bar-fill" style={{ width: `${fighterA.stats.rhetoric}%`, "--bar-color": fighterA.color } as React.CSSProperties} />
                  <div className="stasis-bar-glow" />
                </div>
              </div>
              <small className="mt-1 font-sans" style={{ color: fighterA.color }}>{fighterA.tagline}</small>
            </div>

            {/* Right Fighter Telemetry */}
            <div className="fight-hud fight-hud-right z-20">
              <span className="fight-hud-index text-rose-400 font-mono tracking-widest flex items-center gap-1.5 justify-end">
                {"CHALLENGER_02 // ONLINE"}
                <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
              </span>
              <strong>{fighterB.id}</strong>
              <div className="mt-2 hidden sm:flex flex-col gap-1 w-44 items-end">
                <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase w-full">
                  <span>{"LOGIC CORE"}</span>
                  <span className="text-rose-400">{fighterB.stats.logic}{"%"}</span>
                </div>
                <div className="stasis-bar-container w-full">
                  <div className="stasis-bar-fill" style={{ width: `${fighterB.stats.logic}%`, "--bar-color": fighterB.color } as React.CSSProperties} />
                  <div className="stasis-bar-glow" />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase mt-1 w-full">
                  <span>{"RHETORIC FLUIDITY"}</span>
                  <span className="text-rose-400">{fighterB.stats.rhetoric}{"%"}</span>
                </div>
                <div className="stasis-bar-container w-full">
                  <div className="stasis-bar-fill" style={{ width: `${fighterB.stats.rhetoric}%`, "--bar-color": fighterB.color } as React.CSSProperties} />
                  <div className="stasis-bar-glow" />
                </div>
              </div>
              <small className="mt-1 font-sans" style={{ color: fighterB.color }}>{fighterB.tagline}</small>
            </div>

            <div className="fight-impact" aria-hidden>
              <span className="fight-impact-ring fight-impact-ring-a" />
              <span className="fight-impact-ring fight-impact-ring-b" />
              <b className="font-mono">{"VS"}</b>
            </div>
            
            <div className="fight-readout" aria-hidden>
              <span>{"INF_SHARD: "}{fighterA.model}{" VS "}{fighterB.model}</span><i /><span>{"STABLE NEURAL LINK // COHERENCE 100%"}</span>
            </div>
          </section>

          <section className="arena-stage relative rounded-[30px] p-3 sm:p-6 mb-8 border border-zinc-900/80 bg-zinc-950/20 backdrop-blur-md">
            <div className="arena-corner arena-corner-tl" /><div className="arena-corner arena-corner-tr" />
            <div className="arena-corner arena-corner-bl" /><div className="arena-corner arena-corner-br" />
            
            <div className="grid md:grid-cols-[1fr_100px_1fr] gap-4 sm:gap-6 items-stretch">
              {/* Left Challenger Bay */}
              <div className="fighter-bay fighter-bay-left rounded-2xl p-6 relative overflow-hidden transition-all duration-300 border border-zinc-800/80 bg-gradient-to-b from-zinc-950/60 to-zinc-950/10 flex flex-col justify-between"
                   style={{ "--fighter-color": fighterA.color, "--fighter-color-rgb": fighterA.colorRgb } as React.CSSProperties}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--fighter-color-rgb),0.05),transparent_60%)] pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[9px] font-mono font-black tracking-[0.25em] uppercase text-zinc-500" style={{ color: fighterA.color }}>
                      {"[ SLOT_01 // ACTIVE_CHALLENGER ]"}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800">
                      {"MODEL: "}{fighterA.model}
                    </span>
                  </div>
                  
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="fighter-emoji flex items-center justify-center w-14 h-14 rounded-full border border-zinc-800 bg-zinc-950/80 text-3xl mb-4 shadow-inner" style={{ textShadow: `0 0 12px ${fighterA.color}` }}>
                        {fighterA.emoji}
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase" style={{ textShadow: `0 0 20px rgba(255,255,255,0.05)` }}>
                        {fighterA.id}
                      </h2>
                      <p className="text-[10px] font-mono font-bold tracking-wider mt-1 uppercase" style={{ color: fighterA.color }}>
                        {fighterA.style}
                      </p>
                    </div>
                    <span className="fighter-number select-none">{"01"}</span>
                  </div>

                  {/* Character Bio */}
                  <p className="text-xs text-zinc-500 mb-6 leading-relaxed border-t border-zinc-900 pt-4 font-sans">
                    {fighterA.bio}
                  </p>

                  {/* Telemetry Stats Panel */}
                  <div className="space-y-3 mb-8 bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl font-mono text-left">
                    <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-2 font-bold">{"SYSTEM DIAGNOSTICS:"}</div>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <div className="flex justify-between text-zinc-500 mb-1">
                          <span>{"LOGIC:"}</span>
                          <span className="text-white font-semibold">{fighterA.stats.logic}{"%"}</span>
                        </div>
                        <div className="stasis-bar-container">
                          <div className="stasis-bar-fill" style={{ width: `${fighterA.stats.logic}%`, "--bar-color": fighterA.color } as React.CSSProperties} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-zinc-500 mb-1">
                          <span>{"RHETORIC:"}</span>
                          <span className="text-white font-semibold">{fighterA.stats.rhetoric}{"%"}</span>
                        </div>
                        <div className="stasis-bar-container">
                          <div className="stasis-bar-fill" style={{ width: `${fighterA.stats.rhetoric}%`, "--bar-color": fighterA.color } as React.CSSProperties} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-zinc-500 mb-1">
                          <span>{"SPEED:"}</span>
                          <span className="text-white font-semibold">{fighterA.stats.speed}{"%"}</span>
                        </div>
                        <div className="stasis-bar-container">
                          <div className="stasis-bar-fill" style={{ width: `${fighterA.stats.speed}%`, "--bar-color": fighterA.color } as React.CSSProperties} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-zinc-500 mb-1">
                          <span>{"POWER:"}</span>
                          <span className="text-white font-semibold">{fighterA.stats.power}{"%"}</span>
                        </div>
                        <div className="stasis-bar-container">
                          <div className="stasis-bar-fill" style={{ width: `${fighterA.stats.power}%`, "--bar-color": fighterA.color } as React.CSSProperties} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection Chips */}
                <div>
                  <div className="text-[9px] font-mono text-zinc-600 mb-3 tracking-widest uppercase">{"SWAP GLADIATOR SLOT 01:"}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {FIGHTERS.map((fighter) => (
                      <button key={fighter.id} type="button" aria-label={`Choose ${fighter.id} as challenger one`}
                        onClick={() => { if (agentB !== fighter.id) setAgentA(fighter.id); }} disabled={agentB === fighter.id}
                        className={`fighter-chip cursor-pointer py-1.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${agentA === fighter.id ? "fighter-chip-active" : ""} disabled:opacity-20 disabled:cursor-not-allowed`}
                        style={{ "--chip-color": fighter.color } as React.CSSProperties}>
                        <span className="text-sm">{fighter.emoji}</span>
                        <small className="font-mono text-[9px] font-bold">{fighter.id.toUpperCase()}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Versus Reactor */}
              <div className="versus-reactor flex md:flex-col items-center justify-center gap-3 py-4 select-none">
                <span className="versus-line bg-gradient-to-b from-transparent via-[#8b5cf6]/50 to-transparent" />
                <div className="versus-core w-16 h-16 rounded-full border border-[#8b5cf6]/30 bg-zinc-950 flex items-center justify-center relative shadow-[0_0_25px_rgba(139,92,246,0.15)]">
                  <div className="absolute inset-1 rounded-full border border-[#8b5cf6]/10 animate-ping opacity-25" />
                  <span className="text-lg font-black font-mono italic tracking-tighter text-white bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] w-12 h-12 rounded-full flex items-center justify-center shadow-lg">{"VS"}</span>
                </div>
                <span className="versus-line bg-gradient-to-b from-transparent via-[#8b5cf6]/50 to-transparent" />
              </div>

              {/* Right Challenger Bay */}
              <div className="fighter-bay fighter-bay-right rounded-2xl p-6 relative overflow-hidden transition-all duration-300 border border-zinc-800/80 bg-gradient-to-b from-zinc-950/60 to-zinc-950/10 flex flex-col justify-between"
                   style={{ "--fighter-color": fighterB.color, "--fighter-color-rgb": fighterB.colorRgb } as React.CSSProperties}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--fighter-color-rgb),0.05),transparent_60%)] pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800">
                      {"MODEL: "}{fighterB.model}
                    </span>
                    <span className="text-[9px] font-mono font-black tracking-[0.25em] uppercase text-zinc-500" style={{ color: fighterB.color }}>
                      {"[ SLOT_02 // ACTIVE_CHALLENGER ]"}
                    </span>
                  </div>
                  
                  <div className="flex items-start justify-between gap-4 mb-4 flex-row-reverse">
                    <div className="text-right">
                      <div className="fighter-emoji flex items-center justify-center w-14 h-14 rounded-full border border-zinc-800 bg-zinc-950/80 text-3xl mb-4 ml-auto shadow-inner" style={{ textShadow: `0 0 12px ${fighterB.color}` }}>
                        {fighterB.emoji}
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase" style={{ textShadow: `0 0 20px rgba(255,255,255,0.05)` }}>
                        {fighterB.id}
                      </h2>
                      <p className="text-[10px] font-mono font-bold tracking-wider mt-1 uppercase" style={{ color: fighterB.color }}>
                        {fighterB.style}
                      </p>
                    </div>
                    <span className="fighter-number select-none">{"02"}</span>
                  </div>

                  {/* Character Bio */}
                  <p className="text-xs text-zinc-500 mb-6 leading-relaxed border-t border-zinc-900 pt-4 text-left sm:text-right font-sans">
                    {fighterB.bio}
                  </p>

                  {/* Telemetry Stats Panel */}
                  <div className="space-y-3 mb-8 bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl font-mono text-left">
                    <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-2 font-bold">{"SYSTEM DIAGNOSTICS:"}</div>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <div className="flex justify-between text-zinc-500 mb-1">
                          <span>{"LOGIC:"}</span>
                          <span className="text-white font-semibold">{fighterB.stats.logic}{"%"}</span>
                        </div>
                        <div className="stasis-bar-container">
                          <div className="stasis-bar-fill" style={{ width: `${fighterB.stats.logic}%`, "--bar-color": fighterB.color } as React.CSSProperties} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-zinc-500 mb-1">
                          <span>{"RHETORIC:"}</span>
                          <span className="text-white font-semibold">{fighterB.stats.rhetoric}{"%"}</span>
                        </div>
                        <div className="stasis-bar-container">
                          <div className="stasis-bar-fill" style={{ width: `${fighterB.stats.rhetoric}%`, "--bar-color": fighterB.color } as React.CSSProperties} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-zinc-500 mb-1">
                          <span>{"SPEED:"}</span>
                          <span className="text-white font-semibold">{fighterB.stats.speed}{"%"}</span>
                        </div>
                        <div className="stasis-bar-container">
                          <div className="stasis-bar-fill" style={{ width: `${fighterB.stats.speed}%`, "--bar-color": fighterB.color } as React.CSSProperties} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-zinc-500 mb-1">
                          <span>{"POWER:"}</span>
                          <span className="text-white font-semibold">{fighterB.stats.power}{"%"}</span>
                        </div>
                        <div className="stasis-bar-container">
                          <div className="stasis-bar-fill" style={{ width: `${fighterB.stats.power}%`, "--bar-color": fighterB.color } as React.CSSProperties} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection Chips */}
                <div>
                  <div className="text-[9px] font-mono text-zinc-600 mb-3 tracking-widest uppercase text-left sm:text-right">{"SWAP GLADIATOR SLOT 02:"}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {FIGHTERS.map((fighter) => (
                      <button key={fighter.id} type="button" aria-label={`Choose ${fighter.id} as challenger two`}
                        onClick={() => { if (agentA !== fighter.id) setAgentB(fighter.id); }} disabled={agentA === fighter.id}
                        className={`fighter-chip cursor-pointer py-1.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${agentB === fighter.id ? "fighter-chip-active" : ""} disabled:opacity-20 disabled:cursor-not-allowed`}
                        style={{ "--chip-color": fighter.color } as React.CSSProperties}>
                        <span className="text-sm">{fighter.emoji}</span>
                        <small className="font-mono text-[9px] font-bold">{fighter.id.toUpperCase()}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="command-deck rounded-[30px] p-5 sm:p-6 border border-zinc-900 bg-zinc-950/40 backdrop-blur-md relative overflow-hidden">
            <div className="telemetry-grid-overlay opacity-25" />
            
            {loading ? (
              <div className="min-h-[160px] bg-[#030306] border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between font-mono">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">{"SYNAPSE INITIALIZATION SEQUENCE IN PROGRESS..."}</span>
                  </div>
                  {terminalLogs.map((log, i) => (
                    <div key={i} className="loading-terminal-log text-xs md:text-sm">
                      {log}
                    </div>
                  ))}
                  {loadingStep < 6 && (
                    <div className="loading-terminal-log text-xs md:text-sm animate-pulse flex items-center gap-1 text-emerald-400/60">
                      <span>{"&gt;_ PINGING_INFRASTRUCTURE_NODES"}</span>
                      <span className="inline-block w-1.5 h-3 bg-emerald-400" style={{ animation: "pulseAmber 1s infinite" }} />
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-[9px] text-zinc-600 border-t border-zinc-900/50 pt-3 mt-4">
                  <span>{"ESTIMATED LINK TIME: ~3.0 SEC"}</span>
                  <span>{"STATUS: "}{loadingStep >= 6 ? "REDIRECTING" : "ESTABLISHING CONNECTIVITY"}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 mb-4 px-1">
                  <label htmlFor="debate-topic" className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-zinc-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    {"INJECT MATRIX / CONTROVERSY PARAMETER"}
                  </label>
                  <span className="hidden sm:block text-[9px] font-mono text-zinc-600">{"CMD + ENTER TO DEPLOY STREAM"}</span>
                </div>
                
                <div className="grid lg:grid-cols-[1fr_240px] gap-4 items-stretch">
                  <div className="topic-terminal relative flex-1">
                    <span className="topic-prompt text-violet-500 font-black" aria-hidden>&gt;_</span>
                    <textarea id="debate-topic" value={topic} onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleStart(); }}
                      placeholder="Type an impossible question dangerous enough to split the room..." rows={3}
                      className="w-full resize-none rounded-2xl py-5 pl-14 pr-4 text-white text-[15px] leading-relaxed outline-none" />
                    <div className="topic-count font-mono">{topic.length.toString().padStart(3, "0")}{" / 200 CHARS"}</div>
                  </div>
                  
                  <button type="button" onClick={handleStart} disabled={loading || !topic.trim()} 
                    className="arena-launch cursor-pointer rounded-2xl flex flex-col justify-between p-5 text-left disabled:opacity-20 disabled:cursor-not-allowed group">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-rose-600 to-violet-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    <div className="w-full flex justify-between items-start">
                      <span className="text-[8px] font-mono tracking-widest text-white/40 uppercase bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        {"[ SYSTEM_DEPLOY ]"}
                      </span>
                      <span className="arena-launch-arrow text-2xl transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">{"↗"}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-mono text-zinc-300 uppercase tracking-widest mb-1">{"STATION BROADCAST:"}</span>
                      <span className="arena-launch-label block text-lg font-black tracking-tight uppercase leading-none">{"START CLASH"}</span>
                    </div>
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="text-[9px] font-mono text-zinc-600 mb-2.5 tracking-wider uppercase px-1">{"POPULAR NEURAL COMBAT SIMULATORS:"}</div>
                  <div className="flex flex-wrap gap-2">
                    {topicPrompts.map((prompt) => (
                      <button key={prompt} type="button" onClick={() => setTopic(prompt)} 
                        className="topic-suggestion cursor-pointer font-mono py-1.5 px-3.5 rounded-full text-[10px] text-zinc-400 border border-zinc-800 bg-zinc-950/40 hover:text-white hover:border-violet-500/50 hover:bg-violet-950/10 transition-all duration-200">
                        {"+ "}{prompt}
                      </button>
                    ))}
                  </div>
                </div>
                
                {error && (
                  <div className="text-rose-400 font-mono text-[11px] mt-4 p-3 rounded-lg border border-rose-950/30 bg-rose-950/10 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>{"ERROR: "}{error}</span>
                  </div>
                )}
              </>
            )}
          </section>

          <footer className="flex flex-wrap justify-center sm:justify-between gap-3 mt-6 px-2 text-[9px] font-mono tracking-wider text-zinc-700 uppercase">
            <span>{"Inference engine // Groq"}</span><span>{"Protocol // Live SSE"}</span><span>{"Audience controls outcome"}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}