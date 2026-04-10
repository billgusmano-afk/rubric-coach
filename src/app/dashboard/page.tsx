import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="p-8 max-w-[960px]">
      <div className="mb-7">
        <h1 className="font-serif text-[26px] text-ink">Good morning, {name}</h1>
        <p className="text-ink-3 text-sm">You have 3 sessions this week &middot; keep up the momentum</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Avg Score", value: "74", sub: "/100", delta: "\u2191 +6 this week", color: "" },
          { label: "Sessions", value: "18", sub: "", delta: "\u2191 +3 vs last week", color: "" },
          { label: "Frameworks", value: "2", sub: "", delta: "Active", color: "text-ink-3" },
          { label: "Top Skill", value: "Discovery", sub: "", delta: "\u2191 88 score", color: "", valueClass: "text-lg" },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-[12px] p-4 shadow-card">
            <div className="text-[11px] text-ink-3 font-medium tracking-wide uppercase mb-1.5">{m.label}</div>
            <div className={`text-[28px] font-semibold text-ink leading-none ${m.valueClass || ""}`}>
              {m.value}
              {m.sub && <span className="text-sm text-ink-3">{m.sub}</span>}
            </div>
            <div className={`text-xs mt-1 ${m.color || "text-green"}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Performance + Recent Sessions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
          <div className="font-semibold text-sm text-ink mb-1">Performance by Framework</div>
          <div className="text-xs text-ink-3 mb-4">Scored against your rubrics</div>
          {[
            { name: "Human Edge \u2014 Commercial Selling", score: 82, color: "bg-green" },
            { name: "Financial Acumen Framework", score: 67, color: "bg-gold" },
            { name: "Strategic Management", score: 58, color: "bg-red" },
          ].map((f) => (
            <div key={f.name} className="mb-2">
              <div className="flex justify-between text-xs text-ink-3 mb-1">
                <span>{f.name}</span>
                <span className="font-semibold text-ink">{f.score}</span>
              </div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.score}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
          <div className="font-semibold text-sm text-ink mb-1">Recent Sessions</div>
          <div className="text-xs text-ink-3 mb-4">Last 3 roleplays</div>
          <div className="flex flex-col gap-2.5">
            {[
              { title: "CFO Discovery Call", when: "Today \u00b7 22 min", score: 78, color: "text-accent" },
              { title: "VP Sales Objection Handling", when: "Yesterday \u00b7 18 min", score: 65, color: "text-gold" },
              { title: "Enterprise Demo Close", when: "2 days ago \u00b7 31 min", score: 84, color: "text-green" },
            ].map((s) => (
              <div key={s.title} className="flex justify-between items-center p-2.5 bg-surface rounded-sm">
                <div>
                  <div className="font-medium text-[13px]">{s.title}</div>
                  <div className="text-[11px] text-ink-3">{s.when}</div>
                </div>
                <div className={`text-xl font-bold ${s.color}`}>{s.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Coaching Insights */}
      <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
        <div className="font-semibold text-sm text-ink mb-1">AI Coaching Insights</div>
        <div className="text-xs text-ink-3 mb-4">Based on your last 5 sessions</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 border border-green/20 rounded-sm bg-green/[0.04]">
            <div className="text-[11px] text-green font-semibold mb-1.5">{"\u2713"} STRENGTH</div>
            <div className="font-medium text-[13px]">Financial language fluency</div>
            <div className="text-xs text-ink-3 mt-1">You consistently tie solutions to revenue impact and cost reduction &mdash; clients find this compelling.</div>
          </div>
          <div className="p-3.5 border border-gold/20 rounded-sm bg-gold/[0.04]">
            <div className="text-[11px] text-gold font-semibold mb-1.5">{"\u25CE"} DEVELOP</div>
            <div className="font-medium text-[13px]">Strategic alignment questions</div>
            <div className="text-xs text-ink-3 mt-1">Ask more about the client&apos;s 3-year plan before jumping to solutions. Your rubric scores low here.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
