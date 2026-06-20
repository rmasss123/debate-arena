"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FIGHTER_CONFIG: Record<string, { color: string; glow: string; dimBg: string; border: string; emoji: string; tagline: string }> = {
  Optimist: { color: "#10b981", glow: "rgba(16,185,129,0.4)", dimBg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.25)", emoji: "☀️", tagline: "The Eternal Believer" },
  Critic:   { color: "#f43f5e", glow: "rgba(244,63,94,0.4)",  dimBg: "rgba(244,63,94,0.06)",  border: "rgba(244,63,94,0.25)",  emoji: "💀", tagline: "The Devil's Advocate" },
  Philosopher: { color: "#8b5cf6", glow: "rgba(139,92,246,0.4)", dimBg: "rgba(139,92,246,0.06)", border: "rgba(139,92,246,0.25)", emoji: "👁️", tagline: "The Truth Seeker" },
};

function getFighter(agent: string) {
  return FIGHTER_CONFIG[agent] ?? { color: "#7c3aed", glow: "rgba(124,58,237,0.4)", dimBg: "rgba(124,58,237,0.06)", border: "rgba(124,58,237,0.25)", emoji: "🤖", tagline: "Unknown" };
}

const Particles = React.memo(function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i, x: Math.random() * 100, size: Math.random() * 1.5 + 0.5,
      duration: Math.random() * 22 + 16, delay: Math.random() * 16,
      drift: (Math.random() - 0.5) * 60, color: ["#7c3aed","#4f46e5"][Math.floor(Math.random()*2)],
    })), []
  );
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {particles.map((p) => (
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
      style={{ background: "rgba(5,5,8,0.5)", backdropFilter: "blur(2px)" }}>
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

function TypewriterText({ text, speed = 14 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    if (!text) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); setDone(true); }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return <span>{displayed}{!done && <span className="opacity-30">▌</span>}</span>;
}

interface ArgData { argument_id: string; agent: string; round: number; content: string; }

function ArgCard({ arg, side, canVote, onVote, voteLoading }: {
  arg: ArgData; side: "left" | "right"; canVote: boolean; onVote: (a: string) => void; voteLoading: boolean;
}) {
  const f = getFighter(arg.agent);
  const [voted, setVoted] = useState(false);

  return (
    <div className={`${side === "left" ? "slide-left" : "slide-right"} rounded-2xl overflow-hidden transition-all duration-300 max-w-full`}
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
            style={{ background: f.dimBg, border: `1px solid ${f.border}` }}>
            {f.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-none">{arg.agent}</p>
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
        <p className="text-zinc-300 text-[15px] leading-[1.75]">
          <TypewriterText text={arg.content} speed={14} />
        </p>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i, x: Math.random() * 100,
      color: ["#7c3aed","#ec4899","#f59e0b","#10b981","#3b82f6","#f43f5e"][Math.floor(Math.random()*6)],
      size: Math.random() * 8 + 4, duration: Math.random() * 2 + 2, delay: Math.random() * 1.5,
      isRect: Math.random() > 0.4, rotate: Math.random() * 360,
    })), []
  );
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
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
  const [status, setStatus] = useState<"idle"|"streaming"|"done"|"error">("idle");
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [voteLoading, setVoteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [announcedRound, setAnnouncedRound] = useState(0);
  const [showRound, setShowRound] = useState(false);
  const [roundNum, setRoundNum] = useState(1);

  const bottomRef = useRef<HTMLDivElement>(null);
  const streamStarted = useRef(false);

  // Auto scroll only when new arg arrives
  const argsLen = args.length;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [argsLen, summary]);

  // Round announcement
  useEffect(() => {
    if (args.length === 0) return;
    const latest = args[args.length - 1].round;
    if (latest > announcedRound) {
      setAnnouncedRound(latest);
      setRoundNum(latest);
      setShowRound(true);
      const t = setTimeout(() => setShowRound(false), 2400);
      return () => clearTimeout(t);
    }
  }, [args, announcedRound]);

  // SSE with StrictMode guard
  useEffect(() => {
    if (!id || streamStarted.current) return;
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
    });

    es.addEventListener("summary", (e) => {
      const d = JSON.parse(e.data);
      setSummary(d.content);
    });

    es.addEventListener("done", () => { setStatus("done"); es.close(); });
    es.onerror = () => { setError("Connection lost."); setStatus("error"); es.close(); };

    return () => es.close();
  }, [id]);

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

  const currentRound = args.length > 0 ? args[args.length - 1].round : 0;
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
            <p className="text-zinc-400 text-sm font-medium truncate min-w-0 flex-1 text-center px-2"
              title={topic}>&ldquo;{truncatedTopic}&rdquo;</p>
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
            <p className="text-zinc-600 text-sm">Generating arguments…</p>
          </div>
        )}

        {/* Rounds */}
        {roundGroups.map((group, ri) => (
          <div key={ri} className="flex flex-col gap-4">
            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
              <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-zinc-700">Round {ri + 1}</span>
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
            <span className="text-zinc-600 text-sm">{nextSpeaker} is thinking</span>
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
              <p className="text-zinc-300 text-[15px] leading-[1.75]">
                <TypewriterText text={summary} speed={20} />
              </p>
            </div>
          </div>
        )}

        {/* Vote CTA */}
        {status === "done" && totalVotes === 0 && agents.length === 2 && (
          <div className="fade-in rounded-2xl px-4 py-5 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white font-semibold text-sm mb-1">Who made the stronger case?</p>
            <p className="text-zinc-600 text-xs mb-4">Vote on individual arguments above, or pick an overall winner</p>
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
            <p className="text-zinc-600 text-sm">
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
        {status === "done" && (
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
