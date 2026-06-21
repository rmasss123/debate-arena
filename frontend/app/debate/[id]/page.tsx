"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FIGHTER_CONFIG: Record<string, { color: string; colorRgb: string; glow: string; dimBg: string; border: string; emoji: string; tagline: string }> = {
  Optimist:    { color: "#10b981", colorRgb: "16,185,129",  glow: "rgba(16,185,129,0.4)",  dimBg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.25)",  emoji: "☀️", tagline: "The Eternal Believer" },
  Critic:      { color: "#f43f5e", colorRgb: "244,63,94",   glow: "rgba(244,63,94,0.4)",   dimBg: "rgba(244,63,94,0.06)",   border: "rgba(244,63,94,0.25)",   emoji: "💀", tagline: "The Devil's Advocate" },
  Philosopher: { color: "#8b5cf6", colorRgb: "139,92,246",  glow: "rgba(139,92,246,0.4)",  dimBg: "rgba(139,92,246,0.06)",  border: "rgba(139,92,246,0.25)",  emoji: "👁️", tagline: "The Truth Seeker" },
};

function visualValue(index: number, salt: number) {
  return ((index * 137 + salt * 271) % 997) / 997;
}

const DEBATE_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: visualValue(i, 1) * 100,
  size: visualValue(i, 2) * 1.5 + 0.5,
  duration: visualValue(i, 3) * 22 + 16,
  delay: visualValue(i, 4) * 16,
  drift: (visualValue(i, 5) - 0.5) * 60,
  color: ["#7c3aed", "#4f46e5"][Math.floor(visualValue(i, 6) * 2)],
}));

const CONFETTI_PIECES = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: visualValue(i, 7) * 100,
  color: ["#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#f43f5e"][Math.floor(visualValue(i, 8) * 6)],
  size: visualValue(i, 9) * 8 + 4,
  duration: visualValue(i, 10) * 2 + 2,
  delay: visualValue(i, 11) * 1.5,
  isRect: visualValue(i, 12) > 0.4,
  rotate: visualValue(i, 13) * 360,
}));

function getFighter(agent: string) {
  return FIGHTER_CONFIG[agent] ?? {
    color: "#7c3aed", colorRgb: "124,58,237", glow: "rgba(124,58,237,0.4)",
    dimBg: "rgba(124,58,237,0.06)", border: "rgba(124,58,237,0.25)", emoji: "🤖", tagline: "Unknown",
  };
}

const Particles = React.memo(function Particles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {DEBATE_PARTICLES.map((p) => (
        <div key={p.id} className="absolute bottom-0 rounded-full"
          style={{ left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color, opacity: 0.12,
            animation: `particleRise ${p.duration}s ${p.delay}s linear infinite`,
            ["--drift" as string]: `${p.drift}px` }} />
      ))}
    </div>
  );
});

function RoundOverlay({ round, show }: { round: number; show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ background: "rgba(5,5,8,0.55)" }}>
      <div className="round-announce text-center">
        <p className="text-xs font-bold tracking-[0.5em] uppercase mb-2" style={{ color: "#7c3aed" }}>Round</p>
        <p className="font-black text-white"
          style={{ fontSize: "clamp(6rem,20vw,14rem)", lineHeight: 1, letterSpacing: "-0.04em",
            textShadow: "0 0 80px rgba(124,58,237,0.6)" }}>
          {round}
        </p>
      </div>
    </div>
  );
}

interface ArgData { argument_id: string; agent: string; round: number; content: string; }

interface SavedDebate {
  debate: { topic: string; agent_a: string; agent_b: string };
  arguments: Array<{ id: string; agent_name: string; round_number: number; content: string }>;
  vote: { winner_agent: string } | null;
}

function BootLoader({ agents }: { agents: string[] }) {
  const lines = [
    "[ARENA] STREAM ESTABLISHED — COGNITIVE FEED ACTIVE",
    agents[0] ? `[CORE_01] MOUNTING: ${agents[0].toUpperCase()} — STATUS: READY` : "[CORE_01] DETECTING GLADIATOR PROFILE...",
    agents[1] ? `[CORE_02] MOUNTING: ${agents[1].toUpperCase()} — STATUS: READY` : "[CORE_02] DETECTING GLADIATOR PROFILE...",
    "[MATRIX] CONFLICT TOPOLOGY INITIALIZED",
    "[GROQ] INFERENCE SHARDS PRIMED — AWAITING FIRST TRANSMISSION...",
  ];
  return (
    <div className="debate-boot">
      <div className="boot-terminal">
        <div className="boot-header">
          <span className="boot-dot" style={{ background: "#ef4444" }} />
          <span className="boot-dot" style={{ background: "#f59e0b" }} />
          <span className="boot-dot" style={{ background: "#10b981" }} />
          <span className="boot-title">ARENA BOOT SEQUENCE</span>
        </div>
        {lines.map((line, i) => (
          <div key={i} className="boot-line" style={{ animationDelay: `${i * 0.35}s` }}>{line}</div>
        ))}
        <div className="mt-3"><span className="boot-cursor" /></div>
      </div>
    </div>
  );
}

function RoundBanner({ round }: { round: number }) {
  return (
    <div className="round-banner">
      <div className="round-banner-line" />
      <div className="round-banner-track">
        <span className="round-banner-label">ROUND</span>
        <span className="round-banner-num">{String(round).padStart(2, "0")}</span>
        <span className="round-banner-of">{"/ 03"}</span>
      </div>
      <div className="round-banner-line round-banner-line-right" />
    </div>
  );
}

function ArgCard({ arg, side, canVote, onVote, voteLoading }: {
  arg: ArgData; side: "left" | "right"; canVote: boolean; onVote: (a: string) => void; voteLoading: boolean;
}) {
  const f = getFighter(arg.agent);
  const [voted, setVoted] = useState(false);

  return (
    <div className={`arg-card arg-card-${side}`}
      style={{
        "--arg-color": f.color,
        "--arg-color-rgb": f.colorRgb,
        "--arg-glow": f.glow,
        "--arg-dimbg": f.dimBg,
        "--arg-border": f.border,
        "--slam-x": side === "left" ? "-32px" : "32px",
        animation: "argSlam 0.5s cubic-bezier(0.16,1,0.3,1) both",
      } as React.CSSProperties}>

      {/* Ambient glow */}
      <div className="arg-card-glow"
        style={{ background: `radial-gradient(ellipse at ${side === "left" ? "0% 0%" : "100% 0%"}, rgba(${f.colorRgb},0.1), transparent 60%)` }} />

      {/* Header */}
      <div className="arg-card-header">
        <div className="arg-fighter-avatar">{f.emoji}</div>
        <div className="arg-fighter-info">
          <div className="arg-fighter-name">{arg.agent}</div>
          <div className="arg-fighter-tag" style={{ color: f.color }}>{f.tagline}</div>
        </div>
        <div className="arg-round-badge">R{arg.round}</div>
      </div>

      {/* Body */}
      <div className="arg-card-body">{arg.content}</div>

      {/* Vote footer */}
      {canVote && (
        <div className="arg-card-footer">
          {!voted ? (
            <button className="arg-vote-btn" disabled={voteLoading}
              onClick={() => { onVote(arg.agent); setVoted(true); }}>
              ↑ VOTE THIS ARGUMENT
            </button>
          ) : (
            <span className="arg-voted-badge">✓ VOTED</span>
          )}
        </div>
      )}
    </div>
  );
}

function ClashGrid({ group, agents, canVote, onVote, voteLoading }: {
  group: ArgData[];
  agents: string[];
  canVote: boolean;
  onVote: (a: string) => void;
  voteLoading: boolean;
}) {
  const leftArgs  = group.filter((a) => agents.indexOf(a.agent) === 0);
  const rightArgs = group.filter((a) => agents.indexOf(a.agent) === 1);

  return (
    <>
      {/* Mobile: chronological single column */}
      <div className="flex flex-col gap-4 md:hidden">
        {group.map((arg) => (
          <ArgCard key={arg.argument_id} arg={arg}
            side={agents.indexOf(arg.agent) === 0 ? "left" : "right"}
            canVote={canVote} onVote={onVote} voteLoading={voteLoading} />
        ))}
      </div>

      {/* Desktop: split columns */}
      <div className="clash-grid hidden md:grid">
        <div className="flex flex-col gap-5">
          {leftArgs.map((arg) => (
            <ArgCard key={arg.argument_id} arg={arg} side="left"
              canVote={canVote} onVote={onVote} voteLoading={voteLoading} />
          ))}
        </div>
        <div className="clash-spine">
          <div className="clash-spine-line" />
          <div className="clash-spine-pip" />
          <div className="clash-spine-line" />
        </div>
        <div className="flex flex-col gap-5">
          {rightArgs.map((arg) => (
            <ArgCard key={arg.argument_id} arg={arg} side="right"
              canVote={canVote} onVote={onVote} voteLoading={voteLoading} />
          ))}
        </div>
      </div>
    </>
  );
}

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {CONFETTI_PIECES.map((p) => (
        <div key={p.id} className="absolute top-0"
          style={{ left: `${p.x}%`, width: p.size, height: p.isRect ? p.size * 2.5 : p.size,
            backgroundColor: p.color, borderRadius: p.isRect ? "2px" : "50%",
            transform: `rotate(${p.rotate}deg)`,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards` }} />
      ))}
    </div>
  );
}

export default function DebatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [agents, setAgents] = useState<string[]>([]);
  const [args, setArgs] = useState<ArgData[]>([]);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "restored" | "error">("idle");
  const [sessionMode, setSessionMode] = useState<"checking" | "prompt" | "live" | "restored">("checking");
  const [savedDebate, setSavedDebate] = useState<SavedDebate | null>(null);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [voteLoading, setVoteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRound, setShowRound] = useState(false);
  const [roundNum, setRoundNum] = useState(1);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const sessionChecked = useRef(false);
  const streamStarted  = useRef(false);
  const announcedRound = useRef(0);
  const roundTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const argsLen = args.length;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [argsLen, summary]);

  useEffect(() => {
    if (!id || sessionChecked.current) return;
    sessionChecked.current = true;

    async function inspectSession() {
      try {
        await Promise.resolve();
        const newSessionKey = `debate-arena:new:${id}`;
        if (sessionStorage.getItem(newSessionKey)) {
          sessionStorage.removeItem(newSessionKey);
          sessionStorage.setItem(`debate-arena:seen:${id}`, "true");
          setSessionMode("live");
          return;
        }
        const response = await fetch(`${API}/debate/${id}`);
        if (!response.ok) throw new Error("Debate not found");
        const data: SavedDebate = await response.json();
        const wasOpened = sessionStorage.getItem(`debate-arena:seen:${id}`) === "true";
        if (wasOpened || data.arguments.length > 0) {
          setSavedDebate(data);
          setSessionMode("prompt");
        } else {
          sessionStorage.setItem(`debate-arena:seen:${id}`, "true");
          setSessionMode("live");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load debate");
        setStatus("error");
        setSessionMode("restored");
      }
    }
    void inspectSession();
  }, [id]);

  useEffect(() => {
    if (!id || sessionMode !== "live" || streamStarted.current) return;
    streamStarted.current = true;
    setStatus("streaming");
    const es = new EventSource(`${API}/debate/${id}/stream`);

    es.addEventListener("start", (e) => {
      const d = JSON.parse(e.data);
      setTopic(d.topic);
      setAgents(d.agents);
    });

    es.addEventListener("argument", (e) => {
      const d = JSON.parse(e.data);
      setArgs((prev) => [...prev, d]);
      if (d.round > announcedRound.current) {
        announcedRound.current = d.round;
        setRoundNum(d.round);
        setShowRound(true);
        if (roundTimer.current) clearTimeout(roundTimer.current);
        roundTimer.current = setTimeout(() => setShowRound(false), 2400);
      }
    });

    es.addEventListener("summary", (e) => {
      const d = JSON.parse(e.data);
      setSummary(d.content);
      sessionStorage.setItem(`debate-arena:summary:${id}`, d.content);
    });

    es.addEventListener("done", () => { setStatus("done"); es.close(); });
    es.onerror = () => { setError("Connection lost."); setStatus("error"); es.close(); };

    return () => {
      es.close();
      if (roundTimer.current) clearTimeout(roundTimer.current);
    };
  }, [id, sessionMode]);

  function continuePreviousSession() {
    if (!savedDebate) return;
    streamStarted.current = true;
    setTopic(savedDebate.debate.topic);
    setAgents([savedDebate.debate.agent_a, savedDebate.debate.agent_b]);
    setArgs(savedDebate.arguments.map((argument) => ({
      argument_id: argument.id,
      agent: argument.agent_name,
      round: argument.round_number,
      content: argument.content,
    })));
    setSummary(sessionStorage.getItem(`debate-arena:summary:${id}`) ?? "");
    setTotalVotes(savedDebate.vote ? 1 : 0);
    setStatus("restored");
    setSessionMode("restored");
  }

  const castVote = useCallback(async (winner: string) => {
    if (voteLoading) return;
    setVoteLoading(true);
    try {
      const res = await fetch(`${API}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debate_id: id, winner_agent: winner }),
      });
      if (!res.ok) throw new Error("Vote failed");
      setTotalVotes((v) => v + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    } catch { /* silent */ }
    finally { setVoteLoading(false); }
  }, [id, voteLoading]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getNextSpeaker() {
    if (args.length === 0) return agents[0] ?? null;
    const last = args[args.length - 1];
    const idx = agents.indexOf(last.agent);
    if (idx === 0) return agents[1];
    if (last.round >= 3) return null;
    return agents[0];
  }

  const nextSpeaker = status === "streaming" && !summary ? getNextSpeaker() : null;

  const roundGroups = useMemo(() => {
    const groups: ArgData[][] = [];
    for (const arg of args) {
      const ri = arg.round - 1;
      if (!groups[ri]) groups[ri] = [];
      groups[ri].push(arg);
    }
    return groups;
  }, [args]);

  const truncatedTopic = topic.length > 60 ? topic.slice(0, 57) + "…" : topic;
  const fighterA = agents[0] ? getFighter(agents[0]) : null;
  const fighterB = agents[1] ? getFighter(agents[1]) : null;

  /* ── CHECKING ── */
  if (sessionMode === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050508" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(124,58,237,0.2)", borderTopColor: "#7c3aed" }} />
      </div>
    );
  }

  /* ── TIMELINE FORK ── */
  if (sessionMode === "prompt") {
    const savedArguments = savedDebate?.arguments.length ?? 0;
    const savedRounds    = new Set(savedDebate?.arguments.map((a) => a.round_number)).size;
    const savedTopic     = savedDebate?.debate.topic ?? "Your previous debate";

    return (
      <div className="timeline-fork min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden" style={{ background: "#050508" }}>
        <Particles />
        <div className="timeline-orb timeline-orb-left" aria-hidden />
        <div className="timeline-orb timeline-orb-right" aria-hidden />

        <main className="relative z-10 w-full max-w-5xl">
          <div className="text-center mb-8 sm:mb-12 fade-up">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5"
              style={{ color: "#a78bfa", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <span className="timeline-signal h-1.5 w-1.5 rounded-full" />
              <span className="text-[10px] font-bold tracking-[0.28em] uppercase">Timeline anomaly detected</span>
            </div>
            <h1 className="font-black text-white tracking-[-0.05em] leading-[0.9]"
              style={{ fontSize: "clamp(3rem,8vw,6.5rem)" }}>
              Choose your<br /><span className="timeline-gradient">reality.</span>
            </h1>
            <p className="mt-5 text-sm sm:text-base" style={{ color: "#71717a" }}>
              A previous arena state is still alive. Pick a timeline to enter.
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
            <button type="button" onClick={continuePreviousSession}
              className="timeline-card timeline-card-continue group relative overflow-hidden rounded-[28px] p-6 sm:p-8 text-left min-h-[330px] flex flex-col">
              <div className="timeline-scan" aria-hidden />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2" style={{ color: "#a78bfa" }}>Timeline 01</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">Resume the clash</h2>
                </div>
                <span className="timeline-icon">↺</span>
              </div>

              <div className="relative z-10 my-7 rounded-2xl p-4"
                style={{ background: "rgba(0,0,0,0.28)", border: "1px solid rgba(167,139,250,0.15)" }}>
                <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: "#71717a" }}>Recovered topic</p>
                <p className="text-sm text-zinc-200 line-clamp-2">&ldquo;{savedTopic}&rdquo;</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div><strong className="block text-lg text-white">{savedArguments}</strong><span className="text-[9px] uppercase tracking-wider text-zinc-600">Arguments</span></div>
                  <div><strong className="block text-lg text-white">{savedRounds}</strong><span className="text-[9px] uppercase tracking-wider text-zinc-600">Rounds</span></div>
                  <div><strong className="block text-lg text-emerald-400">Safe</strong><span className="text-[9px] uppercase tracking-wider text-zinc-600">No replay</span></div>
                </div>
              </div>

              <div className="relative z-10 mt-auto flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Enter saved arena</span>
                <span className="timeline-arrow">→</span>
              </div>
            </button>

            <div className="hidden md:flex flex-col items-center justify-center gap-3" aria-hidden>
              <div className="w-px flex-1 timeline-divider" />
              <span className="text-[9px] font-black tracking-[0.25em] text-zinc-700">OR</span>
              <div className="w-px flex-1 timeline-divider" />
            </div>

            <button type="button" onClick={() => router.replace("/")}
              className="timeline-card timeline-card-new group relative overflow-hidden rounded-[28px] p-6 sm:p-8 text-left min-h-[330px] flex flex-col">
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2" style={{ color: "#fb7185" }}>Timeline 02</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">Burn the script</h2>
                </div>
                <span className="timeline-icon timeline-icon-new">✦</span>
              </div>

              <div className="relative z-10 flex-1 flex items-center justify-center py-7">
                <div className="fresh-core">
                  <span className="fresh-ring fresh-ring-one" />
                  <span className="fresh-ring fresh-ring-two" />
                  <span className="relative z-10 text-4xl">⚡</span>
                </div>
              </div>

              <p className="relative z-10 text-xs leading-relaxed mb-5" style={{ color: "#71717a" }}>
                Leave this timeline untouched and return to an empty arena with new fighters and a new topic.
              </p>
              <div className="relative z-10 mt-auto flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Create new reality</span>
                <span className="timeline-arrow timeline-arrow-new">→</span>
              </div>
            </button>
          </div>

          <p className="text-center mt-7 text-[10px] tracking-[0.16em] uppercase" style={{ color: "#3f3f46" }}>
            Your saved timeline will not be overwritten
          </p>
        </main>
      </div>
    );
  }

  /* ── LIVE / RESTORED ── */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#050508" }}>
      <Particles />
      <RoundOverlay round={roundNum} show={showRound} />
      {showConfetti && <Confetti />}

      {/* Broadcast header */}
      <header className="debate-broadcast sticky top-0 z-20">
        <div className="debate-broadcast-inner">
          <button onClick={() => router.push("/")} className="debate-back">
            <span>←</span>
            <span className="hidden sm:inline">ARENA</span>
          </button>

          {topic && (
            <p className="flex-1 min-w-0 text-center px-4 text-sm font-medium truncate"
              style={{ color: "#a1a1aa" }}>
              &ldquo;{truncatedTopic}&rdquo;
            </p>
          )}

          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={copyLink} className="debate-share-btn hidden sm:block">
              {copied ? "✓ COPIED" : "SHARE"}
            </button>
            {status === "streaming" && (
              <div className="flex items-center gap-2">
                <span className="arena-live-dot" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-rose-500 uppercase hidden sm:block">LIVE</span>
              </div>
            )}
            {status === "done"     && <span className="debate-status-badge" style={{ color: "#10b981" }}>FINAL</span>}
            {status === "restored" && <span className="debate-status-badge" style={{ color: "#8b5cf6" }}>RESTORED</span>}
          </div>
        </div>

        {/* Fighter matchup strip */}
        {fighterA && fighterB && (
          <div className="debate-fighter-strip">
            <div className="fighter-tag-pill" style={{ color: fighterA.color, borderColor: fighterA.border, background: fighterA.dimBg }}>
              <span>{fighterA.emoji}</span>
              <span className="font-mono font-black tracking-wider uppercase text-[11px]">{agents[0]}</span>
            </div>
            <div className="clash-vs-pip">VS</div>
            <div className="fighter-tag-pill fighter-tag-pill-right" style={{ color: fighterB.color, borderColor: fighterB.border, background: fighterB.dimBg }}>
              <span className="font-mono font-black tracking-wider uppercase text-[11px]">{agents[1]}</span>
              <span>{fighterB.emoji}</span>
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8 flex flex-col gap-6 overflow-x-hidden">

        {/* Boot loader */}
        {status === "streaming" && args.length === 0 && <BootLoader agents={agents} />}

        {/* Rounds */}
        {roundGroups.map((group, ri) => (
          <div key={ri}>
            <RoundBanner round={ri + 1} />
            <ClashGrid
              group={group}
              agents={agents}
              canVote={status === "done"}
              onVote={castVote}
              voteLoading={voteLoading}
            />
          </div>
        ))}

        {/* Thinking stream */}
        {nextSpeaker && args.length > 0 && (() => {
          const f = getFighter(nextSpeaker);
          return (
            <div className="thinking-stream">
              <div className="thinking-avatar" style={{ background: f.dimBg, border: `1px solid ${f.border}` }}>
                {f.emoji}
              </div>
              <span className="thinking-text">{nextSpeaker} IS PROCESSING</span>
              <div className="thinking-dots">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="thinking-dot" style={{ background: f.color, animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest hidden sm:block">NEURAL LINK ACTIVE</span>
            </div>
          );
        })()}

        {/* Verdict */}
        {summary && (
          <div className="verdict-card">
            <div className="verdict-header">
              <span className="verdict-crown">👑</span>
              <div>
                <div className="verdict-title">FINAL VERDICT</div>
                <div className="verdict-sub">Moderator Summary</div>
              </div>
            </div>
            <div className="verdict-body">{summary}</div>
          </div>
        )}

        {/* Vote CTA */}
        {status === "done" && totalVotes === 0 && agents.length === 2 && (
          <div className="vote-cta">
            <p className="text-white font-bold text-sm mb-1">Who made the stronger case?</p>
            <p className="text-[10px] font-mono tracking-widest uppercase mb-6" style={{ color: "#52525b" }}>
              VOTE ON ARGUMENTS ABOVE OR PICK AN OVERALL WINNER
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {agents.map((a) => {
                const f = getFighter(a);
                return (
                  <button key={a} onClick={() => castVote(a)} disabled={voteLoading}
                    className="vote-fighter-btn disabled:opacity-40"
                    style={{ background: f.dimBg, color: f.color, border: `1px solid ${f.border}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 28px ${f.glow}, 0 8px 30px rgba(0,0,0,0.4)`)}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                    {f.emoji} {a}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Post-vote */}
        {totalVotes > 0 && (
          <div className="fade-in text-center py-2">
            <p className="text-[11px] font-mono tracking-widest uppercase" style={{ color: "#3f3f46" }}>
              {totalVotes} VOTE{totalVotes !== 1 ? "S" : ""} CAST // THANKS FOR PARTICIPATING
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 font-mono text-sm"
            style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)", color: "#f87171" }}>
            [ERROR] {error}
          </div>
        )}

        {/* New debate */}
        {(status === "done" || status === "restored") && (
          <div className="flex justify-center pt-4 pb-8">
            <button onClick={() => router.push("/")} className="new-arena-btn">
              ↩ NEW ARENA
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </main>
    </div>
  );
}
