export default function HistoryPage() {
  return (
    <div className="p-8 max-w-[960px]">
      <div className="mb-7">
        <h1 className="font-serif text-[26px] text-ink">Session History</h1>
        <p className="text-ink-3 text-sm">Review past sessions and scorecards</p>
      </div>

      {/* Featured latest session */}
      <div className="rounded-[12px] p-5 mb-4 text-white border-none"
        style={{ background: "linear-gradient(135deg, #5b4cf5 0%, #8b5cf6 100%)" }}>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[11px] opacity-80 uppercase tracking-wider mb-1">Latest Session &middot; Today</div>
            <div className="font-serif text-xl mb-2">CFO Discovery Call &middot; Acme Corp</div>
            <div className="text-xs opacity-80">22 min &middot; Discovery Call &middot; Human Edge + Financial Acumen</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">78</div>
            <div className="text-xs opacity-80">Overall Score</div>
          </div>
        </div>
      </div>

      {/* Session list */}
      <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
        <div className="font-semibold text-sm mb-4">All Sessions</div>
        <div className="flex flex-col gap-2">
          {[
            { title: "VP Sales Objection Handling", date: "Yesterday", duration: "18 min", framework: "Human Edge", score: 65, color: "text-gold" },
            { title: "Enterprise Demo Close", date: "Apr 7", duration: "31 min", framework: "Financial Acumen", score: 84, color: "text-green" },
            { title: "SMB Discovery Call", date: "Apr 5", duration: "14 min", framework: "Human Edge", score: 71, color: "text-accent" },
            { title: "Renewal Pitch - Globex", date: "Apr 3", duration: "26 min", framework: "Strategic Mgmt", score: 59, color: "text-red" },
          ].map((s) => (
            <div key={s.title} className="flex justify-between items-center p-3 bg-surface rounded-sm">
              <div className="flex-1">
                <div className="font-medium text-[13px]">{s.title}</div>
                <div className="text-[11px] text-ink-3">{s.date} &middot; {s.duration} &middot; {s.framework}</div>
              </div>
              <div className={`text-xl font-bold ${s.color}`}>{s.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
