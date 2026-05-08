"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Session {
  id: string;
  company_name: string | null;
  client_contact: string | null;
  meeting_type: string | null;
  disc_profile: string | null;
  overall_score: number | null;
  duration_seconds: number | null;
  summary: string | null;
  created_at: string;
  ended_at: string | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function scoreColor(score: number | null): string {
  if (!score) return "text-ink-3";
  if (score >= 80) return "text-green";
  if (score >= 65) return "text-accent";
  if (score >= 50) return "text-gold";
  return "text-red";
}


export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("sessions")
        .select(
          "id, company_name, client_contact, meeting_type, disc_profile, overall_score, duration_seconds, summary, created_at, ended_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);
      setSessions(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-ink-3 text-sm">Loading history...</div>
      </div>
    );
  }

  const latest = sessions[0] ?? null;
  const rest = sessions.slice(1);

  return (
    <div className="p-8 max-w-[960px]">
      <div className="mb-7">
        <h1 className="font-serif text-[26px] text-ink">Session History</h1>
        <p className="text-ink-3 text-sm">Review past sessions, transcripts, and scorecards</p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-[12px] p-12 shadow-card text-center">
          <div className="text-3xl mb-3">🎯</div>
          <div className="font-semibold text-ink mb-1">No sessions yet</div>
          <div className="text-sm text-ink-3 mb-5">Complete your first roleplay to see results here.</div>
          <button
            onClick={() => router.push("/dashboard/roleplay")}
            className="px-5 py-2 bg-accent text-white rounded-sm text-sm font-medium hover:bg-[#4a3ce0] transition-colors"
          >
            Start a session
          </button>
        </div>
      ) : (
        <>
          {/* Featured latest session */}
          {latest && (
            <button
              onClick={() => router.push(`/dashboard/history/${latest.id}`)}
              className="w-full text-left rounded-[12px] p-5 mb-4 text-white border-none hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #5b4cf5 0%, #8b5cf6 100%)" }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] opacity-80 uppercase tracking-wider mb-1">
                    Latest Session · {formatDate(latest.created_at)}
                  </div>
                  <div className="font-serif text-xl mb-1 truncate">
                    {latest.meeting_type || "Session"} · {latest.company_name || "Unknown company"}
                  </div>
                  {latest.client_contact && (
                    <div className="text-xs opacity-70 mb-1">{latest.client_contact}</div>
                  )}
                  <div className="text-xs opacity-70">
                    {formatDuration(latest.duration_seconds)} · DISC: {latest.disc_profile || "D"}
                    {latest.ended_at ? "" : " · In progress"}
                  </div>
                  {latest.summary && (
                    <div className="mt-2 text-xs opacity-80 leading-relaxed line-clamp-2">
                      {latest.summary}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="text-4xl font-bold">
                    {latest.overall_score ?? "—"}
                  </div>
                  <div className="text-xs opacity-80">Overall Score</div>
                  <div className="mt-2 text-[10px] opacity-60 underline">View transcript →</div>
                </div>
              </div>
            </button>
          )}

          {/* Session list */}
          {rest.length > 0 && (
            <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
              <div className="font-semibold text-sm mb-4">All Sessions</div>
              <div className="flex flex-col gap-2">
                {rest.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/dashboard/history/${s.id}`)}
                    className="flex justify-between items-center p-3 bg-surface rounded-sm hover:bg-border/40 transition-colors text-left w-full"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[13px] truncate">
                        {s.meeting_type || "Session"} · {s.company_name || "Unknown"}
                      </div>
                      <div className="text-[11px] text-ink-3">
                        {formatDate(s.created_at)} · {formatDuration(s.duration_seconds)} · DISC: {s.disc_profile || "D"}
                      </div>
                    </div>
                    <div className={`text-xl font-bold ml-4 shrink-0 ${scoreColor(s.overall_score)}`}>
                      {s.overall_score ?? "—"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
