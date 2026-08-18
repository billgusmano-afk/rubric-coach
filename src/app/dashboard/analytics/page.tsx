// Score band -> background chip color. Text stays black (text-ink) per the
// brand rule (text/icons black or white only); the color lives in the
// background instead.
function scoreBg(score: number): string {
  if (score >= 80) return "bg-green/15";
  if (score >= 50) return "bg-gold/15";
  return "bg-red/15";
}

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-[960px]">
      <div className="mb-7">
        <h1 className="font-serif text-[26px] text-ink">Team Analytics</h1>
        <p className="text-ink-3 text-sm">Performance across all reps and frameworks</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Team Avg", value: "71", delta: "\u2191 +4 this month", color: "text-green" },
          { label: "Active Reps", value: "12", delta: "of 14 licensed", color: "text-ink-3" },
          { label: "Sessions / Rep", value: "6.2", delta: "\u2191 Target: 8", color: "text-green" },
          { label: "Top Score", value: "94", delta: "Jordan M.", color: "text-ink-3" },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-[12px] p-4 shadow-card">
            <div className="text-[11px] text-ink-3 font-medium tracking-wide uppercase mb-1.5">{m.label}</div>
            <div className="text-[28px] font-semibold text-ink leading-none">{m.value}</div>
            <div className={`text-xs mt-1 ${m.color}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
        <div className="font-semibold text-sm mb-4">Rep Performance Leaderboard</div>

        <div className="grid gap-2">
          <div className="grid grid-cols-[24px_1fr_80px_80px_80px] gap-3 items-center px-2 text-[11px] text-ink-3 font-semibold uppercase tracking-wide">
            <span>#</span><span>Rep</span><span>Avg Score</span><span>Sessions</span><span>Trend</span>
          </div>
          {[
            { rank: 1, name: "Jordan Mitchell", team: "Enterprise \u00b7 West", score: 94, sessions: 14, trend: "\u2191 +11" },
            { rank: 2, name: "Alex Rivera", team: "Enterprise \u00b7 East", score: 74, sessions: 18, trend: "\u2191 +6" },
            { rank: 3, name: "Sam Torres", team: "Mid-Market", score: 68, sessions: 9, trend: "\u2193 -2" },
            { rank: 4, name: "Casey Kim", team: "SMB", score: 51, sessions: 5, trend: "\u2191 +8" },
          ].map((r) => (
            <div key={r.name} className="grid grid-cols-[24px_1fr_80px_80px_80px] gap-3 items-center p-2.5 bg-surface rounded-sm">
              <span className="font-bold text-ink">{r.rank}</span>
              <div>
                <div className="font-medium text-[13px]">{r.name}</div>
                <div className="text-[11px] text-ink-3">{r.team}</div>
              </div>
              <span className={`font-bold text-lg text-ink text-center px-2 py-0.5 rounded-full w-fit ${scoreBg(r.score)}`}>{r.score}</span>
              <span className="text-ink-3">{r.sessions}</span>
              <span className="text-ink-3">{r.trend}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
