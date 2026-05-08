"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Score {
  id: string;
  criterion_id: string;
  score: number;
  ai_feedback: string | null;
  // Supabase returns joined one-to-one as array when using select()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  criteria: any;
}

interface SessionDetail {
  id: string;
  company_name: string | null;
  client_contact: string | null;
  meeting_type: string | null;
  disc_profile: string | null;
  disc_blend: string | null;
  overall_score: number | null;
  duration_seconds: number | null;
  summary: string | null;
  created_at: string;
  ended_at: string | null;
  partner_name: string | null;
  partner_role: string | null;
  partner_solution: string | null;
  relationship_stage: string | null;
  proposal: string | null;
  objective: string | null;
  expected_objection: string | null;
}

function formatDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function scoreColor(score: number | null): string {
  if (!score) return "text-ink-3";
  if (score >= 80) return "text-green";
  if (score >= 65) return "text-accent";
  if (score >= 50) return "text-gold";
  return "text-red";
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"transcript" | "scorecard" | "briefing">("transcript");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [{ data: sess }, { data: msgs }, { data: scrs }] = await Promise.all([
        supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single(),
        supabase
          .from("session_messages")
          .select("id, role, content, created_at")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true }),
        supabase
          .from("session_scores")
          .select("id, criterion_id, score, ai_feedback, criteria(name, weight_percent)")
          .eq("session_id", sessionId),
      ]);

      if (!sess) { setNotFound(true); setLoading(false); return; }
      setSession(sess);
      setMessages(msgs ?? []);
      setScores(scrs ?? []);
      setLoading(false);
    }
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-ink-3 text-sm">Loading session...</div>
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="p-8 text-center">
        <div className="text-ink-3 text-sm mb-4">Session not found.</div>
        <button onClick={() => router.push("/dashboard/history")} className="text-accent text-sm underline">
          ← Back to history
        </button>
      </div>
    );
  }

  const hasBriefing = session.proposal || session.objective || session.expected_objection ||
    session.partner_name || session.relationship_stage;

  return (
    <div className="p-8 max-w-[1000px]">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/history")}
        className="text-xs text-ink-3 hover:text-ink mb-5 inline-flex items-center gap-1 transition-colors"
      >
        ← Session History
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[24px] text-ink leading-tight">
            {session.meeting_type || "Session"} · {session.company_name || "Unknown"}
          </h1>
          {session.client_contact && (
            <div className="text-sm text-ink-3 mt-0.5">{session.client_contact}</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-semibold rounded-full">
              DISC: {session.disc_profile}
              {session.disc_blend && session.disc_blend !== "single" ? ` (${session.disc_blend})` : ""}
            </span>
            <span className="inline-flex px-2 py-0.5 bg-surface text-ink-3 text-[10px] font-semibold rounded-full border border-border">
              {formatDateTime(session.created_at)}
            </span>
            <span className="inline-flex px-2 py-0.5 bg-surface text-ink-3 text-[10px] font-semibold rounded-full border border-border">
              {formatDuration(session.duration_seconds)}
            </span>
            {!session.ended_at && (
              <span className="inline-flex px-2 py-0.5 bg-gold/10 text-[#92400e] text-[10px] font-semibold rounded-full">
                Incomplete
              </span>
            )}
          </div>
        </div>

        {/* Score badge */}
        <div className={`text-center ml-6 shrink-0`}>
          <div className={`text-5xl font-bold ${scoreColor(session.overall_score)}`}>
            {session.overall_score ?? "—"}
          </div>
          <div className="text-[11px] text-ink-3 mt-0.5">Overall Score</div>
        </div>
      </div>

      {/* Coach summary */}
      {session.summary && (
        <div className="bg-card border border-border rounded-[12px] p-5 shadow-card mb-5">
          <div className="font-semibold text-sm mb-2">🤖 AI Coach Summary</div>
          <div className="text-sm text-ink-2 leading-relaxed">{session.summary}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        {(["transcript", "scorecard", ...(hasBriefing ? ["briefing"] : [])] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-accent text-accent"
                : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transcript tab */}
      {activeTab === "transcript" && (
        <div className="flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="text-sm text-ink-3 italic">No messages recorded for this session.</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    msg.role === "assistant" ? "bg-ink text-white" : "bg-accent text-white"
                  }`}
                >
                  {msg.role === "assistant" ? "AI" : "You"}
                </div>
                <div
                  className={`max-w-[72%] px-4 py-3 rounded-[12px] text-[13px] leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-white border border-border text-ink"
                      : "bg-accent text-white"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Scorecard tab */}
      {activeTab === "scorecard" && (
        <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
          {scores.length === 0 ? (
            <div className="text-sm text-ink-3 italic">
              Criterion-level scores are saved for custom frameworks. Preset framework scores (Human Edge, Challenger, etc.) are shown as the overall score above.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {scores.map((sc) => {
                const pct = ((sc.score - 1) / 4) * 100;
                return (
                  <div key={sc.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-ink">
                        {(Array.isArray(sc.criteria) ? sc.criteria[0]?.name : sc.criteria?.name) ?? "Criterion"}
                      </span>
                      <span className={`text-sm font-bold ${scoreColor(sc.score * 20)}`}>
                        {sc.score} / 5
                      </span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {sc.ai_feedback && (
                      <div className="text-xs text-ink-3 leading-relaxed">{sc.ai_feedback}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Briefing tab */}
      {activeTab === "briefing" && hasBriefing && (
        <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Scenario */}
            <div>
              <div className="font-semibold text-xs text-ink-3 uppercase tracking-wide mb-3">Scenario</div>
              <div className="space-y-2 text-sm text-ink-2">
                {session.relationship_stage && (
                  <div><span className="font-semibold text-ink-3">Stage: </span>{session.relationship_stage}</div>
                )}
                {session.proposal && (
                  <div><span className="font-semibold text-ink-3">Proposing: </span>{session.proposal}</div>
                )}
                {session.objective && (
                  <div><span className="font-semibold text-ink-3">Goal: </span>{session.objective}</div>
                )}
                {session.expected_objection && (
                  <div><span className="font-semibold text-ink-3">Expected objection: </span>{session.expected_objection}</div>
                )}
              </div>
            </div>

            {/* Partner */}
            {session.partner_name && (
              <div>
                <div className="font-semibold text-xs text-ink-3 uppercase tracking-wide mb-3">Partner</div>
                <div className="space-y-1 text-sm text-ink-2">
                  <div className="font-semibold text-ink">{session.partner_name}</div>
                  {session.partner_role && <div className="text-ink-3">{session.partner_role}</div>}
                  {session.partner_solution && <div>{session.partner_solution}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
