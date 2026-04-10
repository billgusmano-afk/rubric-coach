"use client";

import { useState, useEffect, useRef } from "react";

interface CompanyResearch {
  company_name: string;
  revenue: string;
  industry: string;
  business_model: string;
  key_contacts: string;
  pain_points: string;
  recent_news: string;
}

interface Framework {
  id: string;
  name: string;
  criteria: { id: string; name: string; weight_percent: number; description: string }[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CriterionScore {
  criterion_id: string;
  criterion_name: string;
  score: number;
  feedback: string;
}

const SCENARIO_TYPES = [
  "Discovery Call",
  "Demo / Pitch",
  "Objection Handling",
  "Closing",
  "Renewal / Upsell",
];

export default function RoleplayPage() {
  // Setup state
  const [companyInput, setCompanyInput] = useState("");
  const [research, setResearch] = useState<CompanyResearch | null>(null);
  const [researching, setResearching] = useState(false);
  const [userRole, setUserRole] = useState("Enterprise Account Executive");
  const [clientContact, setClientContact] = useState("");
  const [scenarioType, setScenarioType] = useState("Discovery Call");
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  // Session state
  const [inSession, setInSession] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userMsg, setUserMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [turns, setTurns] = useState(0);
  const [criteriaScores, setCriteriaScores] = useState<CriterionScore[]>([]);
  const [nudges, setNudges] = useState<string[]>([]);
  const [ending, setEnding] = useState(false);
  const [sessionSummary, setSessionSummary] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load frameworks on mount
  useEffect(() => {
    async function loadFrameworks() {
      try {
        const res = await fetch("/api/frameworks");
        if (res.ok) {
          const data = await res.json();
          setFrameworks(data);
          if (data.length > 0) {
            setSelectedFrameworkIds([data[0].id]);
          }
        }
      } catch { /* ignore */ }
    }
    loadFrameworks();
  }, []);

  // Timer
  useEffect(() => {
    if (inSession && !sessionEnded) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [inSession, sessionEnded]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function researchClient() {
    if (!companyInput.trim()) return;
    setResearching(true);
    setResearch(null);
    try {
      const res = await fetch("/api/research-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: companyInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setResearch(data);
        if (data.key_contacts) {
          setClientContact(data.key_contacts.split(",")[0]?.trim() || "");
        }
      }
    } catch { /* ignore */ }
    finally { setResearching(false); }
  }

  function toggleFramework(id: string) {
    setSelectedFrameworkIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  async function startSession() {
    setStarting(true);
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: research?.company_name || companyInput,
          client_contact: clientContact,
          scenario_type: scenarioType,
          framework_ids: selectedFrameworkIds,
          company_research: research,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        setSystemPrompt(data.system_prompt);
        setMessages([{ role: "assistant", content: data.opening_message }]);
        setInSession(true);
        setTimer(0);
        setTurns(0);
        setOverallScore(0);
        setCriteriaScores([]);
        setNudges([]);
      }
    } catch { /* ignore */ }
    finally { setStarting(false); }
  }

  async function sendMessage() {
    if (!userMsg.trim() || sending) return;
    const msg = userMsg;
    setUserMsg("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setSending(true);

    try {
      const res = await fetch("/api/session/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: msg,
          system_prompt: systemPrompt,
          framework_ids: selectedFrameworkIds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.ai_response }]);
        setTurns((t) => t + 1);
        if (data.overall_score) setOverallScore(data.overall_score);
        if (data.scores) setCriteriaScores(data.scores);
        if (data.nudge) setNudges((prev) => [data.nudge, ...prev].slice(0, 5));
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  async function endSession() {
    setEnding(true);
    try {
      const res = await fetch("/api/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          duration_seconds: timer,
          final_scores: criteriaScores.map((cs) => ({
            criterion_id: cs.criterion_id,
            score: cs.score,
            feedback: cs.feedback,
          })),
          framework_ids: selectedFrameworkIds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOverallScore(data.overall_score);
        setSessionSummary(data.summary);
        setSessionEnded(true);
      }
    } catch { /* ignore */ }
    finally { setEnding(false); }
  }

  // Get all criteria from selected frameworks
  const allCriteria = frameworks
    .filter((f) => selectedFrameworkIds.includes(f.id))
    .flatMap((f) => f.criteria || []);

  // =====================
  // RENDER: Setup Screen
  // =====================
  if (!inSession) {
    return (
      <div className="p-8 max-w-[960px]">
        <div className="mb-7">
          <h1 className="font-serif text-[26px] text-ink">Start a Roleplay</h1>
          <p className="text-ink-3 text-sm">Set up your scenario, then practice with live AI coaching</p>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          {/* Client Setup */}
          <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
            <div className="font-semibold text-sm mb-4">{"\u2460"} Client Profile</div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-ink-3 mb-1.5">Company name or website</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                  placeholder="e.g. Acme Corp or acmecorp.com"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && researchClient()}
                />
                <button
                  onClick={researchClient}
                  disabled={researching || !companyInput.trim()}
                  className="px-3 py-1.5 bg-accent text-white rounded-sm text-xs font-medium hover:bg-[#4a3ce0] transition-colors disabled:opacity-50"
                >
                  {researching ? "..." : "Research \u2197"}
                </button>
              </div>
            </div>

            {research && (
              <>
                <div className="h-px bg-border my-4" />
                <div className="grid grid-cols-[60px_1fr] gap-4 items-start">
                  <div className="w-[60px] h-[60px] bg-gradient-to-br from-accent to-accent-2 rounded-full flex items-center justify-center text-xl font-bold text-white">
                    {research.company_name?.substring(0, 2).toUpperCase() || "CO"}
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">{research.company_name}</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="inline-flex px-2.5 py-0.5 bg-surface text-ink-3 text-[11px] font-semibold rounded-full">{research.revenue}</span>
                      <span className="inline-flex px-2.5 py-0.5 bg-surface text-ink-3 text-[11px] font-semibold rounded-full">{research.industry}</span>
                      <span className="inline-flex px-2.5 py-0.5 bg-surface text-ink-3 text-[11px] font-semibold rounded-full">{research.business_model}</span>
                    </div>
                    <div className="text-xs text-ink-3 leading-relaxed">{research.pain_points}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Scenario Setup */}
          <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
            <div className="font-semibold text-sm mb-4">{"\u2461"} Selling Scenario</div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-ink-3 mb-1.5">Your role</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-ink-3 mb-1.5">Client contact</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                placeholder="CFO — Sarah Chen"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-3 mb-1.5">Scenario type</label>
              <div className="flex flex-wrap gap-2">
                {SCENARIO_TYPES.map((s) => (
                  <span
                    key={s}
                    onClick={() => setScenarioType(s)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 bg-surface border rounded-full text-xs cursor-pointer transition-all ${
                      scenarioType === s
                        ? "border-accent bg-accent/[0.06] text-accent"
                        : "border-border text-ink hover:border-accent hover:text-accent"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Framework selection */}
        <div className="bg-card border border-border rounded-[12px] p-5 shadow-card mb-5">
          <div className="font-semibold text-sm mb-4">{"\u2462"} Evaluation Frameworks</div>
          {frameworks.length === 0 ? (
            <div className="text-ink-3 text-sm">No frameworks yet. Build one in the Rubric Builder first.</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {frameworks.map((fw) => {
                const selected = selectedFrameworkIds.includes(fw.id);
                return (
                  <div
                    key={fw.id}
                    onClick={() => toggleFramework(fw.id)}
                    className={`bg-card rounded-[12px] p-4 cursor-pointer transition-all ${
                      selected
                        ? "border-2 border-accent shadow-card"
                        : "border border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="font-semibold text-sm">{fw.name}</div>
                    <div className="text-xs text-ink-3 mt-1">
                      {fw.criteria?.length || 0} criteria &middot;{" "}
                      {fw.criteria?.map((c) => c.name).join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={startSession}
            disabled={starting || !companyInput.trim()}
            className="px-4 py-2.5 bg-accent text-white rounded-sm text-sm font-medium hover:bg-[#4a3ce0] transition-colors disabled:opacity-50"
          >
            {starting ? "Starting..." : "\u25B6 Start Roleplay Session"}
          </button>
        </div>
      </div>
    );
  }

  // =====================
  // RENDER: Live Session
  // =====================
  return (
    <div className="p-8 max-w-[1100px]">
      <div className="grid grid-cols-[1fr_340px] gap-5">
        {/* Chat area */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              {!sessionEnded ? (
                <span className="inline-flex px-2.5 py-0.5 bg-green/10 text-green text-[11px] font-semibold rounded-full">{"\u25CF"} LIVE</span>
              ) : (
                <span className="inline-flex px-2.5 py-0.5 bg-surface text-ink-3 text-[11px] font-semibold rounded-full">ENDED</span>
              )}
              <span className="text-xs text-ink-3">{formatTime(timer)}</span>
            </div>
            {!sessionEnded && (
              <button
                onClick={endSession}
                disabled={ending}
                className="px-3 py-1.5 bg-white text-accent border border-border rounded-sm text-xs font-medium hover:border-accent transition-colors disabled:opacity-50"
              >
                {ending ? "Ending..." : "End Session"}
              </button>
            )}
          </div>

          <div
            ref={chatRef}
            className="flex flex-col gap-3 p-5 bg-surface rounded-[12px] min-h-[350px] max-h-[450px] overflow-y-auto"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-accent/10 text-accent"
                      : "bg-accent text-white"
                  }`}
                >
                  {msg.role === "assistant" ? "AI" : "You"}
                </div>
                <div
                  className={`max-w-[72%] px-3.5 py-2.5 rounded-[12px] text-[13px] leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-white border border-border text-ink"
                      : "bg-accent text-white"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-accent/10 text-accent shrink-0">AI</div>
                <div className="px-3.5 py-2.5 bg-white border border-border rounded-[12px]">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-pulse [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-pulse [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {!sessionEnded && (
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 px-3 py-2.5 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                placeholder="Type your response..."
                value={userMsg}
                onChange={(e) => setUserMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !userMsg.trim()}
                className="px-4 py-2.5 bg-accent text-white rounded-sm text-sm font-medium hover:bg-[#4a3ce0] transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}

          {/* Session summary */}
          {sessionEnded && sessionSummary && (
            <div className="mt-4 bg-card border border-border rounded-[12px] p-5 shadow-card">
              <div className="font-semibold text-sm mb-2">AI Coach Summary</div>
              <div className="text-sm text-ink-2 leading-relaxed">{sessionSummary}</div>
            </div>
          )}
        </div>

        {/* Right panel — Live scoring + nudges */}
        <div>
          <div className="bg-card border border-border rounded-[12px] p-4 shadow-card mb-4">
            <div className="font-semibold text-sm mb-3">Live Rubric Score</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center p-3 bg-surface rounded-sm">
                <div className="text-2xl font-bold text-accent">{overallScore || "--"}</div>
                <div className="text-[11px] text-ink-3">Overall</div>
              </div>
              <div className="text-center p-3 bg-surface rounded-sm">
                <div className="text-2xl font-bold text-gold">{turns}</div>
                <div className="text-[11px] text-ink-3">Exchanges</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {allCriteria.length > 0 ? (
                allCriteria.map((criterion) => {
                  const scoreData = criteriaScores.find(
                    (cs) => cs.criterion_id === criterion.id || cs.criterion_name === criterion.name
                  );
                  const score = scoreData ? (scoreData.score / 5) * 100 : 0;
                  const displayScore = scoreData ? scoreData.score : "--";
                  return (
                    <div key={criterion.id}>
                      <div className="flex justify-between text-xs text-ink-3 mb-1">
                        <span>{criterion.name}</span>
                        <span className="font-semibold text-ink">{displayScore}</span>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-ink-3 italic">No frameworks selected for scoring.</div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-[12px] p-4 shadow-card">
            <div className="font-semibold text-sm mb-3">AI Coach Nudges</div>
            <div className="flex flex-col gap-2">
              {nudges.length === 0 ? (
                <div className="text-xs text-ink-3 italic">
                  Coaching feedback will appear as you practice...
                </div>
              ) : (
                nudges.map((nudge, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-gold/[0.08] border border-gold/20 rounded-sm text-xs text-[#92400e] leading-relaxed"
                  >
                    <span className="font-semibold">{"\uD83D\uDCA1"} </span>
                    {nudge}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
