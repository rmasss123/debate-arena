"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FIGHTER_CONFIG: Record<string, { color: string; glow: string; dimBg: string; border: string; emoji: string; tagline: string }> = {
  Optimist: { color: "#10b981", glow: "rgba(16,185,129,0.4)", dimBg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.25)", emoji: "☀️", tagline: "The Eternal Believer" },
  Critic:   { color: "#f43f5e", glow: "rgba(244,63,94,0.4)",  dimBg: "rgba(244,63,94,0.06)",  border: "rgba(244,63,94,0.25)",  emoji: "💀", tagline: "The Devil's Advocate" },
  Philosopher: { color: "#8b5cf6", glow: "rgba(139,92,246,0.4)", dimBg: "rgba(139,92,246,0.06)", border: "rgba(139,92,246,0.25)", emoji: "👁️", tagline: "The Truth Seeker" },
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
  return FIGHTER_CONFIG[agent] ?? { color: "#7c3aed", glow: "rgba(124,58,237,0.4)", dimBg: "rgba(124,58,237,0.06)", border: "rgba(124,58,237,0.25)", emoji: "🤖", tagline: "Unknown" };
}

const Particles = React.memo(function Particles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {DEBATE_PARTICLES.map((p) => (
        <div key={p.id} className="absolute bottom-0 rounded-full"
          style={{ left:`${p.x}%`, width:p.size, height:p.size, backgroundColor:p.color, opacity:0.12,
            animation:`particleRise ${p.duration}s ${p.delay}s linear infinite`,
            ["--drift" as string]:`${p.drift}px` }} />
      ))}
    </div>
  );
});

function RoundOverlay({ round, show }: { round: number; show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ background: "rgba(5,5,8,0.5)" }}>
      <div className="round-announce text-center">
        <p className="text-xs font-bold tracking-[0.5em] uppercase mb-2"
          style={{ color: "#7c3aed" }}>Round</p>
        <p className="font-black text-white"
          style={{ fontSize: "clamp(6rem, 20vw, 14rem)", lineHeight: 1, letterSpacing: "-0.04em",
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

function ArgCard({ arg, side, canVote, onVote, voteLoading }: {
  arg: ArgData; side: "left" | "right"; canVote: boolean; onVote: (a: string) => void; voteLoading: boolean;
}) {
  const f = getFighter(arg.agent);
  const [voted, setVoted] = useState(false);

  return (
    <div className={`${side === "left" ? "slide-left" : "slide-right"} rounded-2xl overflow-hidden transition-all duration-300 max-w-full`}
      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.11)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
            style={{ background: f.dimBg, border: `1px solid ${f.border}` }}>
            {f.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-none" style={{ color: "#ffffff" }}>{arg.agent}</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: f.color }}>{f.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", color: "#71717a" }}>R{arg.round}</span>
          {canVote && !voted && (
            <button onClick={() => { onVote(arg.agent); setVoted(true); }} disabled={voteLoading}
              className="text-[11px] font-medium px-3 py-1 rounded-full transition-all duration-200 disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.05)", color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = f.border; e.currentTarget.style.boxShadow = `0 0 12px ${f.glow}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}>
              👍 Vote
            </button>
          )}
          {voted && (
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ background: f.dimBg, color: f.color, border: `1px solid ${f.border}` }}>
              ✓ Voted
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        <p style={{ color: "#e4e4e7", fontSize: "15px", lineHeight: "1.75" }}>
          {arg.content}
        </p>
      </div>
    </div>
  );
}

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {CONFETTI_PIECES.map((p) => (
        <div key={p.id} className="absolute top-0"
          style={{ left:`${p.x}%`, width:p.size, height:p.isRect?p.size*2.5:p.size,
            backgroundColor:p.color, borderRadius:p.isRect?"2px":"50%",
            transform:`rotate(${p.rotate}deg)`,
            animation:`confettiFall ${p.duration}s ${p.delay}s ease-in forwards` }} />
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
  const [status, setStatus] = useState<"idle"|"streaming"|"done"|"restored"|"error">("idle");
  const [sessionMode, setSessionMode] = useState<"checking"|"prompt"|"live"|"restored">("checking");
  const [savedDebate, setSavedDebate] = useState<SavedDebate | null>(null);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [voteLoading, setVoteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showRound, setShowRound] = useState(false);
  const [roundNum, setRoundNum] = useState(1);

  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionChecked = useRef(false);
  const streamStarted = useRef(false);
  const announcedRound = useRef(0);
  const roundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto scroll only when new arg arrives
  const argsLen = args.length;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [argsLen, summary]);

  // A newly created debate starts immediately. Existing URLs and reloads ask
  // whether the user wants the persisted session or a clean debate.
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

  // SSE with StrictMode guard
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

  const truncatedTopic = topic.length > 55 ? topic.slice(0, 52) + "…" : topic;

  if (sessionMode === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050508" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(124,58,237,0.2)", borderTopColor: "#7c3aed" }} />
      </div>
    );
  }

  if (sessionMode === "prompt") {
    const savedArguments = savedDebate?.arguments.length ?? 0;
    const savedRounds = new Set(savedDebate?.arguments.map((argument) => argument.round_number)).size;
    const savedTopic = savedDebate?.debate.topic ?? "Your previous debate";

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
              style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}>
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
                <p className="text-sm text-zinc-200 line-clamp-2">“{savedTopic}”</p>
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#050508" }}>
      <Particles />

      {/* Overlays */}
      <RoundOverlay round={roundNum} show={showRound} />
      {showConfetti && <Confetti />}

      {/* Header */}
      <header className="sticky top-0 z-20 flex-shrink-0"
        style={{ background: "rgba(5,5,8,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3 gap-4">
          <button onClick={() => router.push("/")}
            className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
            style={{ fontSize: "13px" }}>
            ← <span className="hidden sm:inline">Arena</span>
          </button>

          {topic && (
            <p className="text-sm font-medium truncate min-w-0 flex-1 text-center px-2"
              style={{ color: "#d4d4d8" }} title={topic}>&ldquo;{truncatedTopic}&rdquo;</p>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={copyLink}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all duration-200 hidden sm:block"
              style={{ background: "rgba(255,255,255,0.04)", color: copied ? "#10b981" : "#71717a", border: "1px solid rgba(255,255,255,0.07)" }}>
              {copied ? "✓ Copied" : "Share"}
            </button>
            {status === "streaming" && (
              <div className="flex items-center gap-1.5">
                <div className="live-dot w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                <span className="text-[11px] font-medium text-red-500 hidden sm:block">Live</span>
              </div>
            )}
            {status === "done" && (
              <span className="text-[11px] font-medium text-emerald-500">Done</span>
            )}
            {status === "restored" && (
              <span className="text-[11px] font-medium text-purple-400">Restored</span>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-8 flex flex-col gap-5 overflow-x-hidden">

        {/* Loading */}
        {status === "streaming" && args.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(124,58,237,0.2)", borderTopColor: "#7c3aed" }} />
            <p className="text-sm" style={{ color: "#a1a1aa" }}>Generating arguments…</p>
          </div>
        )}

        {/* Rounds */}
        {roundGroups.map((group, ri) => (
          <div key={ri} className="flex flex-col gap-4">
            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
              <span className="text-[10px] font-medium tracking-[0.3em] uppercase" style={{ color: "#71717a" }}>Round {ri + 1}</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>

            {group.map((arg) => (
              <ArgCard
                key={arg.argument_id}
                arg={arg}
                side={agents.indexOf(arg.agent) === 0 ? "left" : "right"}
                canVote={status === "done"}
                onVote={castVote}
                voteLoading={voteLoading}
              />
            ))}
          </div>
        ))}

        {/* Thinking */}
        {nextSpeaker && args.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <span className="text-sm">{getFighter(nextSpeaker).emoji}</span>
            <span className="text-sm" style={{ color: "#a1a1aa" }}>{nextSpeaker} is thinking</span>
            <div className="flex gap-1 ml-1">
              {[0,1,2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full thinking-dot-anim"
                  style={{ background: "#52525b", animationDelay: `${i*0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="fade-in rounded-2xl overflow-hidden"
            style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)" }}>
            <div className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(251,191,36,0.1)" }}>
              <span className="text-lg">👑</span>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-amber-500/80">Final Verdict</p>
                <p className="text-[11px] text-amber-600/50">Moderator Summary</p>
              </div>
            </div>
            <div className="px-4 py-4">
              <p style={{ color: "#e4e4e7", fontSize: "15px", lineHeight: "1.75" }}>
                {summary}
              </p>
            </div>
          </div>
        )}

        {/* Vote CTA */}
        {status === "done" && totalVotes === 0 && agents.length === 2 && (
          <div className="fade-in rounded-2xl px-4 py-5 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white font-semibold text-sm mb-1">Who made the stronger case?</p>
            <p className="text-xs mb-4" style={{ color: "#a1a1aa" }}>Vote on individual arguments above, or pick an overall winner</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {agents.map((a) => {
                const f = getFighter(a);
                return (
                  <button key={a} onClick={() => castVote(a)} disabled={voteLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40"
                    style={{ background: f.dimBg, color: f.color, border: `1px solid ${f.border}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 20px ${f.glow}`)}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                    {f.emoji} {a}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Post vote */}
        {totalVotes > 0 && (
          <div className="fade-in text-center py-2">
            <p className="text-sm" style={{ color: "#a1a1aa" }}>
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""} cast · thanks for participating
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-rose-400 text-sm"
            style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)" }}>
            {error}
          </div>
        )}

        {/* New debate */}
        {(status === "done" || status === "restored") && (
          <div className="flex justify-center pt-4 pb-8">
            <button onClick={() => router.push("/")}
              className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.03)", color: "#71717a", border: "1px solid rgba(255,255,255,0.07)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
              Start a new debate →
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </main>
    </div>
  );
}
