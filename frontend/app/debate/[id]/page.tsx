"use client";

import { useEffect, useRef, useState, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FIGHTER_CONFIG: Record<
  string,
  { color: string; dimBg: string; borderColor: string; emoji: string; tagline: string }
> = {
  Optimist: {
    color: "#10b981", dimBg: "rgba(16,185,129,0.08)",
    borderColor: "rgba(16,185,129,0.3)", emoji: "☀️", tagline: "The Eternal Believer",
  },
  Critic: {
    color: "#f43f5e", dimBg: "rgba(244,63,94,0.08)",
    borderColor: "rgba(244,63,94,0.3)", emoji: "💀", tagline: "The Devil's Advocate",
  },
  Philosopher: {
    color: "#8b5cf6", dimBg: "rgba(139,92,246,0.08)",
    borderColor: "rgba(139,92,246,0.3)", emoji: "👁️", tagline: "The Truth Seeker",
  },
};

function getFighter(agent: string) {
  return FIGHTER_CONFIG[agent] ?? {
    color: "#7c3aed", dimBg: "rgba(124,58,237,0.08)",
    borderColor: "rgba(124,58,237,0.3)", emoji: "🤖", tagline: "Unknown",
  };
}

/* ─── Particles ─── */
const Particles = memo(function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i, x: Math.random() * 100, size: Math.random() * 0.8 + 0.5,
      duration: Math.random() * 22 + 16, delay: Math.random() * 16,
      drift: (Math.random() - 0.5) * 80,
      color: ["#7c3aed", "#6d28d9", "#a78bfa"][Math.floor(Math.random() * 3)],
    })), []
  );
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div key={p.id} className="absolute bottom-0 rounded-full"
          style={{ left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color, opacity: 0.1,
            animation: `particle-rise ${p.duration}s ${p.delay}s linear infinite`,
            ["--drift" as string]: `${p.drift}px` }} />
      ))}
    </div>
  );
});

/* ─── Gradient orbs ─── */
const GradientOrbs = memo(function GradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute rounded-full blur-3xl"
        style={{ width: 500, height: 500, top: "-15%", left: "-10%",
          background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)",
          animation: "orb-drift-1 18s ease-in-out infinite" }} />
      <div className="absolute rounded-full blur-3xl"
        style={{ width: 400, height: 400, bottom: "-12%", right: "-8%",
          background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)",
          animation: "orb-drift-2 24s ease-in-out infinite" }} />
    </div>
  );
});

/* ─── Round announcement ─── */
function RoundAnnouncement({ round, show }: { round: number; show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
      style={{ background: "rgba(5,5,8,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="round-announce text-center px-4">
        <p className="font-semibold uppercase tracking-[0.5em] mb-3 text-xs"
          style={{ color: "#a78bfa" }}>
          Fight!
        </p>
        <p className="font-black text-white"
          style={{ fontSize: "clamp(4rem, 16vw, 11rem)", lineHeight: 1,
            textShadow: "0 0 80px rgba(124,58,237,0.6)", letterSpacing: "-0.04em" }}>
          Round {round}
        </p>
      </div>
    </div>
  );
}

/* ─── Thinking indicator ─── */
function ThinkingDots({ agentName }: { agentName: string }) {
  const f = getFighter(agentName);
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <span className="text-sm">{f.emoji}</span>
      <span className="text-sm text-zinc-500">{agentName} is thinking</span>
      <div className="flex gap-1 ml-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600"
            style={{ animation: `thinking-dot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Typewriter ─── */
function TypewriterText({ text, speed = 18 }: { text: string; speed?: number }) {
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
  return <span>{displayed}{!done && <span className="text-zinc-700">▌</span>}</span>;
}

/* ─── Argument card ─── */
interface ArgData {
  argument_id: string;
  agent: string;
  round: number;
  content: string;
}

function ArgumentCard({
  arg, side, canVote, onVote, voteLoading,
}: {
  arg: ArgData; side: "left" | "right"; canVote: boolean; onVote: (agent: string) => void; voteLoading: boolean;
}) {
  const f = getFighter(arg.agent);
  const [voted, setVoted] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`${side === "left" ? "slide-left" : "slide-right"} rounded-2xl overflow-hidden transition-all duration-300`}
      style={{
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        transform: hovered ? "translateY(-1px)" : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card header */}
      <div className={`flex items-center gap-3 px-4 sm:px-5 py-3 ${side === "right" ? "flex-row-reverse" : ""}`}
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>

        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {f.emoji}
        </div>

        <div className={`flex-1 min-w-0 ${side === "right" ? "text-right" : ""}`}>
          <p className="font-bold text-sm text-white tracking-tight">{arg.agent}</p>
          <p className="text-[11px] text-zinc-600">{f.tagline}</p>
        </div>

        <div className={`flex items-center gap-2 flex-shrink-0 ${side === "right" ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", color: "#52525b", border: "1px solid rgba(255,255,255,0.06)" }}>
            R{arg.round}
          </span>

          {canVote && !voted && (
            <button
              onClick={() => { onVote(arg.agent); setVoted(true); }}
              disabled={voteLoading}
              className="text-[11px] font-medium px-3 py-1 rounded-full transition-all duration-200 disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.04)", color: "#71717a", border: "1px solid rgba(255,255,255,0.07)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = `${f.color}60`; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
              Vote
            </button>
          )}
          {voted && (
            <span className="count-pop text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ background: f.dimBg, color: f.color, border: `1px solid ${f.borderColor}` }}>
              ✓ Voted
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`px-4 sm:px-5 py-4 ${side === "right" ? "text-right" : ""}`}>
        <p className="text-zinc-300 leading-[1.7] text-[15px]">
          <TypewriterText text={arg.content} speed={16} />
        </p>
      </div>
    </div>
  );
}

/* ─── Confetti ─── */
function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i, x: Math.random() * 100,
      color: ["#a855f7","#ec4899","#f59e0b","#10b981","#3b82f6","#f43f5e","#fbbf24","#6366f1"][Math.floor(Math.random() * 8)],
      size: Math.random() * 8 + 4, duration: Math.random() * 2.5 + 1.8, delay: Math.random() * 1.8,
      isRect: Math.random() > 0.4, rotate: Math.random() * 360,
    })), []
  );
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div key={p.id} className="absolute top-0"
          style={{ left: `${p.x}%`, width: p.size, height: p.isRect ? p.size * 2.5 : p.size,
            backgroundColor: p.color, borderRadius: p.isRect ? "2px" : "50%",
            transform: `rotate(${p.rotate}deg)`, animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards` }} />
      ))}
    </div>
  );
}

/* ============================================================
   DEBATE PAGE
   ============================================================ */
export default function DebatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [agents, setAgents] = useState<string[]>([]);
  const [args, setArgs] = useState<ArgData[]>([]);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const [announcedRound, setAnnouncedRound] = useState(0);
  const [showRoundAnnounce, setShowRoundAnnounce] = useState(false);
  const [announceRoundNum, setAnnounceRoundNum] = useState(1);

  const [copied, setCopied] = useState(false);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const streamStarted = useRef(false);

  // Auto-scroll on new arguments
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [args.length]);

  // Detect new rounds
  useEffect(() => {
    if (args.length === 0) return;
    const latestRound = args[args.length - 1].round;
    if (latestRound > announcedRound) {
      setAnnouncedRound(latestRound);
      setAnnounceRoundNum(latestRound);
      setShowRoundAnnounce(true);
      const t = setTimeout(() => setShowRoundAnnounce(false), 2200);
      return () => clearTimeout(t);
    }
  }, [args, announcedRound]);

  // SSE — ref guard prevents double connection in React StrictMode
  useEffect(() => {
    if (!id) return;
    if (streamStarted.current) return;
    streamStarted.current = true;

    setStatus("streaming");
    const es = new EventSource(`${API}/debate/${id}/stream`);

    es.addEventListener("start", (e) => {
      const data = JSON.parse(e.data);
      setTopic(data.topic);
      setAgents(data.agents);
    });
    es.addEventListener("argument", (e) => {
      const data = JSON.parse(e.data);
      setArgs((prev) => [...prev, data]);
    });
    es.addEventListener("summary", (e) => {
      const data = JSON.parse(e.data);
      setSummary(data.content);
    });
    es.addEventListener("done", () => { setStatus("done"); es.close(); });
    es.onerror = () => { setError("Stream disconnected."); setStatus("error"); es.close(); };

    return () => es.close();
  }, [id]);

  async function castVote(winnerAgent: string) {
    if (voteLoading) return;
    setVoteLoading(true);
    try {
      const res = await fetch(`${API}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debate_id: id, winner_agent: winnerAgent }),
      });
      if (!res.ok) throw new Error("Vote failed");
      setVotedFor(winnerAgent);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    } catch {
      // silently ignore
    } finally {
      setVoteLoading(false);
    }
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getNextSpeaker(): string | null {
    if (args.length === 0 && agents.length > 0) return agents[0];
    if (args.length === 0) return null;
    const last = args[args.length - 1];
    const lastIdx = agents.indexOf(last.agent);
    if (lastIdx === 0) return agents[1];
    const nextRound = last.round + 1;
    if (nextRound > 3) return null;
    return agents[0];
  }

  const nextSpeaker = status === "streaming" ? getNextSpeaker() : null;
  const currentRound = args.length > 0 ? args[args.length - 1].round : 0;

  const roundGroups = useMemo(() => {
    const groups: ArgData[][] = [];
    for (const arg of args) {
      const ri = arg.round - 1;
      if (!groups[ri]) groups[ri] = [];
      groups[ri].push(arg);
    }
    return groups;
  }, [args]);

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "#050508" }}>
      <Particles />
      <GradientOrbs />

      {/* Overlays */}
      <RoundAnnouncement round={announceRoundNum} show={showRoundAnnounce} />
      {showConfetti && <Confetti />}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-20 backdrop-blur-xl"
        style={{ height: 52, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,8,0.9)" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between h-full px-4">

          <button onClick={() => router.push("/")}
            className="text-sm font-medium transition-colors duration-200 flex-shrink-0"
            style={{ color: "#52525b" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e4e4e7")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
            <span className="hidden sm:inline">← Arena</span>
            <span className="sm:hidden">←</span>
          </button>

          {/* Topic in header */}
          <div className="flex-1 min-w-0 px-4 text-center">
            {topic && (
              <p className="text-sm font-medium text-zinc-400 truncate">{topic}</p>
            )}
          </div>

          {/* Right: share + status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button onClick={copyShareLink}
              className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.04)", color: copied ? "#10b981" : "#52525b",
                border: "1px solid rgba(255,255,255,0.07)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e4e4e7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = copied ? "#10b981" : "#52525b")}>
              {copied ? "✓ Copied" : "Share"}
            </button>

            {status === "streaming" && (
              <div className="flex items-center gap-1.5">
                <div className="live-dot w-2 h-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                <span className="text-[10px] sm:text-xs font-medium text-red-500 tracking-wide uppercase">
                  R{currentRound || "–"}/3
                </span>
              </div>
            )}
            {status === "done" && (
              <span className="text-[10px] sm:text-xs font-medium text-emerald-500 tracking-wide uppercase">Complete</span>
            )}
            {status === "error" && (
              <span className="text-[10px] sm:text-xs font-medium text-rose-500">Error</span>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-3 sm:px-4 py-6 sm:py-8 flex flex-col gap-4 sm:gap-6 overflow-x-hidden">

        {/* Agent matchup (shown once topic loads) */}
        {agents.length === 2 && (
          <div className="fade-up flex items-center justify-center gap-3 py-2">
            {agents.map((a, i) => {
              const f = getFighter(a);
              return (
                <div key={a} className="flex items-center gap-3">
                  {i > 0 && (
                    <span className="text-zinc-700 font-bold text-sm">vs</span>
                  )}
                  <span className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full"
                    style={{ background: f.dimBg, color: f.color, border: `1px solid ${f.borderColor}` }}>
                    {f.emoji} {a}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Initial loading */}
        {status === "streaming" && args.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(124,58,237,0.15)", borderTopColor: "#7c3aed" }} />
            <p className="text-sm text-zinc-600">Initializing debate…</p>
          </div>
        )}

        {/* Rounds */}
        {roundGroups.map((group, ri) => (
          <div key={ri} className="flex flex-col gap-3 sm:gap-4">
            {/* Round divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
              <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-700">
                Round {ri + 1}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>

            {group.map((arg) => {
              const side = agents.indexOf(arg.agent) === 0 ? "left" : "right";
              return (
                <ArgumentCard
                  key={arg.argument_id}
                  arg={arg}
                  side={side}
                  canVote={status === "done"}
                  onVote={castVote}
                  voteLoading={voteLoading}
                />
              );
            })}
          </div>
        ))}

        {/* Thinking — only while streaming and before summary */}
        {status === "streaming" && nextSpeaker && args.length > 0 && !summary && (
          <ThinkingDots agentName={nextSpeaker} />
        )}

        {/* Moderator summary */}
        {summary && (
          <div className="fade-up rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.04)" }}>
            <div className="px-4 sm:px-5 py-3 flex items-center gap-2.5"
              style={{ borderBottom: "1px solid rgba(251,191,36,0.1)" }}>
              <span className="text-lg">👑</span>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-amber-600">Final Verdict</p>
                <p className="text-xs text-zinc-600">Moderator Summary</p>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-4 sm:py-5">
              <p className="text-zinc-300 leading-[1.7] text-[15px]">
                <TypewriterText text={summary} speed={20} />
              </p>
            </div>
          </div>
        )}

        {/* Final vote prompt */}
        {status === "done" && votedFor === null && agents.length === 2 && (
          <div className="fade-up rounded-2xl px-4 sm:px-6 py-5 sm:py-6 text-center"
            style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <p className="font-semibold text-white text-sm mb-1">Who won the debate?</p>
            <p className="text-zinc-600 text-xs mb-5">Vote on individual cards above, or pick an overall winner</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {agents.map((a) => {
                const f = getFighter(a);
                return (
                  <button key={a} onClick={() => castVote(a)} disabled={voteLoading}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-30"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#71717a", border: "1px solid rgba(255,255,255,0.08)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = f.color; e.currentTarget.style.background = f.dimBg; e.currentTarget.style.borderColor = f.borderColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                    {f.emoji} {a}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Post-vote */}
        {votedFor !== null && (
          <div className="fade-up rounded-2xl px-4 sm:px-5 py-4 text-center"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <p className="text-sm text-zinc-400">
              You voted for{" "}
              <span className="font-semibold" style={{ color: getFighter(votedFor).color }}>
                {getFighter(votedFor).emoji} {votedFor}
              </span>
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-rose-500 text-sm"
            style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.04)" }}>
            {error}
          </div>
        )}

        {status === "done" && (
          <div className="flex justify-center pt-2 pb-8">
            <button onClick={() => router.push("/")}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: "#52525b" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e4e4e7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
              Start a new debate →
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </main>
    </div>
  );
}
