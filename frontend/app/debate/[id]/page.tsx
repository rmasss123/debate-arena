"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

const API = "http://127.0.0.1:8000";

const FIGHTER_CONFIG: Record<
  string,
  { color: string; glow: string; dimBg: string; borderColor: string; emoji: string; tagline: string; neonClass: string }
> = {
  Optimist: {
    color: "#10b981", glow: "rgba(16,185,129,0.55)", dimBg: "rgba(16,185,129,0.07)",
    borderColor: "rgba(16,185,129,0.45)", emoji: "☀️", tagline: "The Eternal Believer", neonClass: "neon-emerald",
  },
  Critic: {
    color: "#f43f5e", glow: "rgba(244,63,94,0.55)", dimBg: "rgba(244,63,94,0.07)",
    borderColor: "rgba(244,63,94,0.45)", emoji: "💀", tagline: "The Devil's Advocate", neonClass: "neon-rose",
  },
  Philosopher: {
    color: "#8b5cf6", glow: "rgba(139,92,246,0.55)", dimBg: "rgba(139,92,246,0.07)",
    borderColor: "rgba(139,92,246,0.45)", emoji: "👁️", tagline: "The Truth Seeker", neonClass: "neon-violet",
  },
};

function getFighter(agent: string) {
  return FIGHTER_CONFIG[agent] ?? {
    color: "#a855f7", glow: "rgba(168,85,247,0.55)", dimBg: "rgba(168,85,247,0.07)",
    borderColor: "rgba(168,85,247,0.45)", emoji: "🤖", tagline: "Unknown", neonClass: "neon-purple",
  };
}

/* ─── Particles ─── */
function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i, x: Math.random() * 100, size: Math.random() * 2 + 0.8,
      duration: Math.random() * 20 + 14, delay: Math.random() * 14,
      drift: (Math.random() - 0.5) * 100,
      color: ["#a855f7", "#8b5cf6", "#10b981", "#f43f5e"][Math.floor(Math.random() * 4)],
    })), []
  );
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div key={p.id} className="absolute bottom-0 rounded-full"
          style={{ left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color, opacity: 0.22,
            animation: `particle-rise ${p.duration}s ${p.delay}s linear infinite`,
            ["--drift" as string]: `${p.drift}px` }} />
      ))}
    </div>
  );
}

/* ─── Gradient orbs ─── */
function GradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute rounded-full blur-3xl"
        style={{ width: 400, height: 400, top: "-10%", left: "-8%",
          background: "radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)",
          animation: "orb-drift-1 16s ease-in-out infinite" }} />
      <div className="absolute rounded-full blur-3xl"
        style={{ width: 350, height: 350, bottom: "-8%", right: "-6%",
          background: "radial-gradient(circle, rgba(244,63,94,0.11) 0%, transparent 70%)",
          animation: "orb-drift-2 20s ease-in-out infinite" }} />
    </div>
  );
}

/* ─── Round announcement ─── */
function RoundAnnouncement({ round, show }: { round: number; show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
      <div className="round-announce text-center">
        <p className="font-black uppercase tracking-[0.5em] mb-2"
          style={{ color: "#a855f7", fontSize: "clamp(0.7rem, 2vw, 1rem)", textShadow: "0 0 20px rgba(168,85,247,0.8)" }}>
          ⚔ Fight!
        </p>
        <p className="font-black text-white"
          style={{ fontSize: "clamp(5rem, 18vw, 12rem)", lineHeight: 1,
            textShadow: "0 0 60px rgba(168,85,247,0.7), 0 0 120px rgba(168,85,247,0.3)", letterSpacing: "-0.03em" }}>
          ROUND {round}
        </p>
      </div>
    </div>
  );
}

/* ─── Thinking dots ─── */
function ThinkingDots({ agentName }: { agentName: string }) {
  const f = getFighter(agentName);
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: f.dimBg, border: `1px solid ${f.borderColor}` }}>
      <span className="text-lg">{f.emoji}</span>
      <span className="text-sm font-bold" style={{ color: f.color }}>{agentName}</span>
      <span className="text-zinc-500 text-sm">is thinking</span>
      <div className="flex gap-1 ml-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full"
            style={{ backgroundColor: f.color, animation: `thinking-dot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
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
  return <span>{displayed}{!done && <span className="opacity-70">▌</span>}</span>;
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

  return (
    <div className={`${side === "left" ? "slide-left" : "slide-right"} ${f.neonClass} rounded-2xl overflow-hidden`}
      style={{ border: `1px solid ${f.borderColor}`, background: f.dimBg }}>

      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${f.borderColor}`, background: f.dimBg }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
            style={{ border: `2px solid ${f.color}`, background: f.dimBg, boxShadow: `0 0 12px ${f.glow}` }}>
            {f.emoji}
          </div>
          <div>
            <p className="font-black text-sm tracking-wide text-white">{arg.agent.toUpperCase()}</p>
            <p className="text-[11px]" style={{ color: f.color }}>{f.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded"
            style={{ background: `${f.color}22`, color: f.color, border: `1px solid ${f.borderColor}` }}>
            R{arg.round}
          </span>

          {canVote && !voted && (
            <button
              onClick={() => { onVote(arg.agent); setVoted(true); }}
              disabled={voteLoading}
              className="text-[11px] font-black px-3 py-1 rounded-full transition-all active:scale-90 disabled:opacity-40"
              style={{ background: `${f.color}22`, color: f.color, border: `1px solid ${f.borderColor}` }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 14px ${f.glow}`)}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
              👍 VOTE
            </button>
          )}
          {voted && (
            <span className="count-pop text-[11px] font-black px-3 py-1 rounded-full"
              style={{ background: f.color, color: "#000" }}>
              ✓ VOTED
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <p className="text-zinc-200 leading-relaxed text-[15px]">
          <TypewriterText text={arg.content} speed={16} />
        </p>
      </div>
    </div>
  );
}

/* ─── Confetti ─── */
function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i, x: Math.random() * 100,
      color: ["#a855f7","#ec4899","#f59e0b","#10b981","#3b82f6","#f43f5e","#fbbf24","#6366f1"][Math.floor(Math.random() * 8)],
      size: Math.random() * 10 + 5, duration: Math.random() * 2.5 + 1.8, delay: Math.random() * 1.8,
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

  // Round announcement
  const [announcedRound, setAnnouncedRound] = useState(0);
  const [showRoundAnnounce, setShowRoundAnnounce] = useState(false);
  const [announceRoundNum, setAnnounceRoundNum] = useState(1);

  const [copied, setCopied] = useState(false);

  // Total votes cast (for showing final prompt)
  const [totalVotes, setTotalVotes] = useState(0);

  const [voteLoading, setVoteLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [args, summary]);

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

  // SSE
  useEffect(() => {
    if (!id) return;
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
      setTotalVotes((v) => v + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
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

  const roundGroups: ArgData[][] = [];
  for (const arg of args) {
    const ri = arg.round - 1;
    if (!roundGroups[ri]) roundGroups[ri] = [];
    roundGroups[ri].push(arg);
  }

  return (
    <div className="scanlines min-h-screen flex flex-col relative" style={{ background: "#08080d" }}>
      <Particles />
      <GradientOrbs />

      {/* Scanline sweep */}
      <div className="fixed left-0 right-0 h-12 pointer-events-none z-10"
        style={{ background: "linear-gradient(transparent, rgba(255,255,255,0.012), transparent)",
          animation: "scanline-sweep 12s linear infinite" }} />

      {/* Overlays */}
      <RoundAnnouncement round={announceRoundNum} show={showRoundAnnounce} />
      {showConfetti && <Confetti />}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-20 backdrop-blur-md"
          style={{ borderBottom: "1px solid rgba(168,85,247,0.15)", background: "rgba(8,8,13,0.93)" }}>
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">

            <button onClick={() => router.push("/")}
              className="text-xs font-bold tracking-widest uppercase transition-all"
              style={{ color: "#6b7280" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#a855f7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
              ← New Debate
            </button>

            <span className="font-black text-sm tracking-widest uppercase"
              style={{ color: "#a855f7", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
              ⚔ DEBATE ARENA
            </span>

            {/* Right side: share + status */}
            <div className="flex items-center gap-3">
              {/* Share button */}
              <button onClick={copyShareLink}
                className="text-[11px] font-black px-2.5 py-1 rounded-lg tracking-wide uppercase transition-all"
                style={{ background: "rgba(168,85,247,0.12)", color: copied ? "#10b981" : "#a855f7",
                  border: "1px solid rgba(168,85,247,0.25)" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 12px rgba(168,85,247,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                {copied ? "✓ Copied!" : "📡 Share"}
              </button>

              {status === "streaming" && (
                <div className="flex items-center gap-1.5">
                  <div className="live-dot w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                  <span className="text-xs font-bold text-red-400 tracking-widest uppercase">
                    LIVE · R{currentRound || "—"}/3
                  </span>
                </div>
              )}
              {status === "done" && (
                <span className="text-xs font-bold tracking-widest uppercase text-emerald-400">✓ COMPLETE</span>
              )}
              {status === "error" && (
                <span className="text-xs font-bold text-rose-400">DISCONNECTED</span>
              )}
            </div>
          </div>
        </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 py-8 flex flex-col gap-6">

        {/* Topic */}
        {topic && (
          <div className="animate-fade-in rounded-2xl px-6 py-5 neon-purple"
            style={{ border: "1px solid rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.06)" }}>
            <p className="text-[10px] font-black tracking-[0.4em] uppercase text-purple-400 mb-2">▶ Debate Topic</p>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-snug"
              style={{ textShadow: "0 0 30px rgba(168,85,247,0.3)" }}>
              &ldquo;{topic}&rdquo;
            </h1>
            {agents.length === 2 && (
              <div className="flex items-center gap-3 mt-4">
                {agents.map((a, i) => {
                  const f = getFighter(a);
                  return (
                    <div key={a} className="flex items-center gap-2">
                      {i > 0 && <span className="text-zinc-600 font-black text-sm">VS</span>}
                      <span className="text-xs font-black px-3 py-1 rounded-full"
                        style={{ background: f.dimBg, color: f.color, border: `1px solid ${f.borderColor}` }}>
                        {f.emoji} {a.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
                <span className="text-zinc-600 text-xs ml-1">· 3 ROUNDS</span>
              </div>
            )}
          </div>
        )}

        {/* Initial loading */}
        {status === "streaming" && args.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(168,85,247,0.2)", borderTopColor: "#a855f7" }} />
            <p className="text-sm font-bold tracking-widest uppercase" style={{ color: "#a855f7" }}>
              Initializing Debate…
            </p>
          </div>
        )}

        {/* Rounds */}
        {roundGroups.map((group, ri) => (
          <div key={ri} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px" style={{ background: "rgba(168,85,247,0.2)" }} />
              <span className="text-[11px] font-black tracking-[0.4em] uppercase px-3 py-1 rounded-full"
                style={{ color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)" }}>
                ROUND {ri + 1}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(168,85,247,0.2)" }} />
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

        {/* Thinking */}
        {status === "streaming" && nextSpeaker && args.length > 0 && (
          <ThinkingDots agentName={nextSpeaker} />
        )}

        {/* Summary */}
        {summary && (
          <div className="animate-fade-in rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.05)" }}>
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.06)" }}>
              <span className="text-xl" style={{ animation: "float-slow 3s ease-in-out infinite" }}>👑</span>
              <div>
                <p className="text-[10px] font-black tracking-[0.4em] uppercase text-amber-400">Final Verdict</p>
                <p className="text-xs text-amber-500/60">Moderator Summary</p>
              </div>
            </div>
            <div className="px-5 py-5">
              <p className="text-zinc-200 leading-relaxed text-[15px]">
                <TypewriterText text={summary} speed={22} />
              </p>
            </div>
          </div>
        )}

        {/* Final vote prompt (only if no votes cast yet) */}
        {status === "done" && totalVotes === 0 && agents.length === 2 && (
          <div className="animate-fade-in rounded-2xl px-5 py-6 text-center"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
            <p className="font-black text-white text-sm tracking-widest uppercase mb-1">⚔ Who Won?</p>
            <p className="text-zinc-500 text-xs mb-5">Vote on any argument card above, or pick an overall winner</p>
            <div className="flex items-center justify-center gap-4">
              {agents.map((a) => {
                const f = getFighter(a);
                return (
                  <button key={a} onClick={() => castVote(a)} disabled={voteLoading}
                    className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black tracking-wide uppercase transition-all active:scale-95 disabled:opacity-40"
                    style={{ background: f.dimBg, color: f.color, border: `1px solid ${f.borderColor}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 20px ${f.glow}`)}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                    {f.emoji} {a}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Post-vote summary */}
        {totalVotes > 0 && (
          <div className="animate-fade-in rounded-2xl px-5 py-4 text-center"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
            <p className="text-zinc-400 text-sm">
              <span className="font-black text-white">{totalVotes}</span> vote{totalVotes !== 1 ? "s" : ""} cast.{" "}
              <span className="text-zinc-400">Keep voting on argument cards above.</span>
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-rose-400 text-sm"
            style={{ border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.05)" }}>
            ⚠ {error}
          </div>
        )}

        {status === "done" && (
          <div className="flex justify-center pt-4 pb-8">
            <button onClick={() => router.push("/")}
              className="px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all active:scale-95"
              style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 20px rgba(168,85,247,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
              ⚡ Start a New Debate
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </main>
    </div>
  );
}
