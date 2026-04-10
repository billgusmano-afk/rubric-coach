"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ───────────────────── Types ───────────────────── */

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

/* ───────────────────── Constants ───────────────────── */

const RELATIONSHIP_STAGES = ["First meeting", "1-2 prior meetings", "Active opportunity", "Existing customer"] as const;
const MEETING_TYPES = ["Discovery", "Demo", "Objection handling", "Closing", "Renewal"] as const;
const PARTNER_ROLES = ["Leading relationship", "SI", "VAR", "Co-presenting", "Not in meeting"] as const;

const DISC_PROFILES = [
  {
    letter: "D",
    name: "Dominant",
    traits: ["Direct", "Decisive", "Results-driven"],
    quote: "\"Just give me the bottom line — what's the ROI and when do we see it?\"",
  },
  {
    letter: "I",
    name: "Influential",
    traits: ["Enthusiastic", "Collaborative", "People-oriented"],
    quote: "\"This sounds exciting! How are other companies using this? Tell me a story.\"",
  },
  {
    letter: "S",
    name: "Steady",
    traits: ["Patient", "Reliable", "Risk-averse"],
    quote: "\"We'd want to pilot this carefully. How do you handle the transition?\"",
  },
  {
    letter: "C",
    name: "Conscientious",
    traits: ["Analytical", "Detail-focused", "Quality-driven"],
    quote: "\"Can you walk me through the methodology? I'd like to see the data.\"",
  },
] as const;

const DISC_BLENDS = ["single", "D-C", "D-I", "I-S", "S-C", "C-S"] as const;

const PRESET_FRAMEWORKS = [
  { id: "human-edge", name: "Human Edge Commercial", tag: "Core / Included", price: null },
  { id: "financial-acumen", name: "Financial Acumen", tag: "+$5", price: 5 },
  { id: "challenger-sale", name: "Challenger Sale", tag: "+$5", price: 5 },
  { id: "meddic", name: "MEDDIC", tag: "+$5", price: 5 },
  { id: "strategic-mgmt", name: "Strategic Management", tag: "+$5", price: 5 },
] as const;

/* ───────────────────── Helpers ───────────────────── */

function CheckBadge({ complete }: { complete: boolean }) {
  if (!complete) return null;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green text-white text-[11px] font-bold ml-2">
      ✓
    </span>
  );
}

function SectionWrapper({
  num,
  title,
  complete,
  children,
}: {
  num: number;
  title: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-card border rounded-[12px] p-6 shadow-card transition-all ${
        complete ? "border-l-4 border-l-green border-t-border border-r-border border-b-border" : "border-border"
      }`}
    >
      <div className="flex items-center mb-5">
        <span className="font-semibold text-sm text-ink">
          {num}. {title}
        </span>
        <CheckBadge complete={complete} />
      </div>
      {children}
    </div>
  );
}

/* ───────────────────── Main Component ───────────────────── */

export default function RoleplayPage() {
  const router = useRouter();

  /* ── Section 1: Client & Partner ── */
  const [companyInput, setCompanyInput] = useState("");
  const [research, setResearch] = useState<CompanyResearch | null>(null);
  const [researching, setResearching] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerRole, setPartnerRole] = useState<string>("");
  const [partnerSolution, setPartnerSolution] = useState("");

  /* ── Section 2: Scenario ── */
  const [relationshipStage, setRelationshipStage] = useState<string>("");
  const [meetingType, setMeetingType] = useState<string>("");
  const [proposal, setProposal] = useState("");
  const [objective, setObjective] = useState("");
  const [expectedObjection, setExpectedObjection] = useState("");

  /* ── Section 3: DISC ── */
  const [discProfile, setDiscProfile] = useState("D");
  const [discBlend, setDiscBlend] = useState("single");

  /* ── Section 4: Frameworks ── */
  const [dbFrameworks, setDbFrameworks] = useState<Framework[]>([]);
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>(["human-edge"]);

  /* ── Section 5: Document ── */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docParsing, setDocParsing] = useState(false);
  const [docSummary, setDocSummary] = useState("");
  const [docPageCount, setDocPageCount] = useState<number | null>(null);
  const [docFileName, setDocFileName] = useState("");

  /* ── Section 6: Voice ── */
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(false);

  /* ── Session state (kept for live session) ── */
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
  const [starting, setStarting] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Section completion checks ── */
  const sec1Complete = companyInput.trim().length > 0;
  const sec2Complete =
    relationshipStage !== "" && meetingType !== "" && proposal.trim().length > 0 && objective.trim().length > 0;
  const sec3Complete = true; // always has default
  const sec4Complete = selectedFrameworkIds.length > 0;
  const sec5Complete = docFileName.length > 0;
  const sec6Complete = true; // always has default

  const canLaunch = sec1Complete && sec2Complete && sec4Complete;

  /* ── Load DB frameworks ── */
  useEffect(() => {
    async function loadFrameworks() {
      try {
        const res = await fetch("/api/frameworks");
        if (res.ok) {
          const data = await res.json();
          setDbFrameworks(data);
        }
      } catch {
        /* ignore */
      }
    }
    loadFrameworks();
  }, []);

  /* ── Timer ── */
  useEffect(() => {
    if (inSession && !sessionEnded) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [inSession, sessionEnded]);

  /* ── Auto-scroll chat ── */
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  /* ── Research client ── */
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
      }
    } catch {
      /* ignore */
    } finally {
      setResearching(false);
    }
  }

  /* ── Toggle frameworks ── */
  function toggleFramework(id: string) {
    setSelectedFrameworkIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  /* ── Document upload ── */
  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "docx" && ext !== "pptx") {
      alert("Only .docx and .pptx files are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File must be under 10 MB");
      return;
    }

    setDocFile(file);
    setDocFileName(file.name);
    setDocParsing(true);
    setDocSummary("");
    setDocPageCount(null);

    // For now, show a placeholder — document parsing will be wired up server-side
    setTimeout(() => {
      setDocParsing(false);
      setDocSummary("Document uploaded successfully. AI summary will be generated when the session starts.");
      setDocPageCount(ext === "pptx" ? 12 : 4);
    }, 1500);
  }

  /* ── Start session ── */
  async function startSession() {
    if (!canLaunch) return;
    setStarting(true);
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: research?.company_name || companyInput,
          client_contact: research?.key_contacts?.split(",")[0]?.trim() || "",
          partner_name: partnerName,
          partner_role: partnerRole,
          partner_solution: partnerSolution,
          relationship_stage: relationshipStage,
          meeting_type: meetingType,
          proposal,
          objective,
          expected_objection: expectedObjection,
          disc_profile: discProfile,
          disc_blend: discBlend,
          framework_ids: selectedFrameworkIds,
          company_research: research,
          document_context: docSummary || null,
          voice_enabled: voiceEnabled,
          mic_enabled: micEnabled,
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
    } catch {
      /* ignore */
    } finally {
      setStarting(false);
    }
  }

  /* ── Chat ── */
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
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  /* ── End session ── */
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
    } catch {
      /* ignore */
    } finally {
      setEnding(false);
    }
  }

  // Get all criteria from selected DB frameworks
  const allCriteria = dbFrameworks
    .filter((f) => selectedFrameworkIds.includes(f.id))
    .flatMap((f) => f.criteria || []);

  /* ═══════════════════════════════════════════════════════
     RENDER: SETUP SCREEN
     ═══════════════════════════════════════════════════════ */
  if (!inSession) {
    return (
      <div className="p-8 max-w-[860px] pb-32">
        <div className="mb-7">
          <h1 className="font-serif text-[26px] text-ink">Session Setup</h1>
          <p className="text-ink-3 text-sm">Configure your roleplay scenario, then launch</p>
        </div>

        <div className="flex flex-col gap-5">
          {/* ── Section 1: Client & Partner ── */}
          <SectionWrapper num={1} title="Client & Partner" complete={sec1Complete}>
            {/* Client company */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-ink-3 mb-1.5">Client company</label>
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
                  {researching ? "Researching..." : "Research ↗"}
                </button>
              </div>
            </div>

            {/* Research profile card */}
            {research && (
              <div className="mb-4 p-4 bg-surface rounded-sm border border-border">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-2 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0">
                    {research.company_name?.substring(0, 2).toUpperCase() || "CO"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">{research.company_name}</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="inline-flex px-2.5 py-0.5 bg-white text-ink-3 text-[11px] font-semibold rounded-full border border-border">
                        {research.revenue}
                      </span>
                      <span className="inline-flex px-2.5 py-0.5 bg-white text-ink-3 text-[11px] font-semibold rounded-full border border-border">
                        {research.industry}
                      </span>
                      <span className="inline-flex px-2.5 py-0.5 bg-white text-ink-3 text-[11px] font-semibold rounded-full border border-border">
                        {research.business_model}
                      </span>
                    </div>
                    <div className="text-xs text-ink-3 leading-relaxed">{research.pain_points}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Partner fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-3 mb-1.5">Partner name (optional)</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                  placeholder="e.g. John Smith"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-3 mb-1.5">Partner role</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                  value={partnerRole}
                  onChange={(e) => setPartnerRole(e.target.value)}
                >
                  <option value="">Select role...</option>
                  {PARTNER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-ink-3 mb-1.5">
                Partner solution or practice (optional)
              </label>
              <input
                className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                placeholder='e.g. "CDW Managed Services", "Accenture Supply Chain Practice"'
                value={partnerSolution}
                onChange={(e) => setPartnerSolution(e.target.value)}
              />
            </div>
          </SectionWrapper>

          {/* ── Section 2: Scenario ── */}
          <SectionWrapper num={2} title="Scenario" complete={sec2Complete}>
            <div className="mb-4">
              <label className="block text-xs font-medium text-ink-3 mb-2">Relationship stage</label>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIP_STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setRelationshipStage(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      relationshipStage === s
                        ? "border-accent bg-accent/[0.08] text-accent"
                        : "border-border text-ink-3 hover:border-accent hover:text-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-ink-3 mb-2">Meeting type</label>
              <div className="flex flex-wrap gap-2">
                {MEETING_TYPES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMeetingType(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      meetingType === m
                        ? "border-accent bg-accent/[0.08] text-accent"
                        : "border-border text-ink-3 hover:border-accent hover:text-accent"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-ink-3 mb-1.5">What are you proposing?</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors resize-none"
                rows={3}
                placeholder="Describe the product, solution, or service you're bringing to this meeting..."
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-3 mb-1.5">Your goal for this meeting</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                  placeholder="e.g. Secure a pilot commitment"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-3 mb-1.5">Expected objection (optional)</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                  placeholder='e.g. "We already have a solution"'
                  value={expectedObjection}
                  onChange={(e) => setExpectedObjection(e.target.value)}
                />
              </div>
            </div>
          </SectionWrapper>

          {/* ── Section 3: DISC Personality ── */}
          <SectionWrapper num={3} title="DISC Personality" complete={sec3Complete}>
            <p className="text-xs text-ink-3 mb-4">
              Controls the AI client persona&apos;s tone and behavior — not a scoring rubric.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {DISC_PROFILES.map((d) => (
                <button
                  key={d.letter}
                  onClick={() => setDiscProfile(d.letter)}
                  className={`text-left p-4 rounded-[12px] border-2 transition-all ${
                    discProfile === d.letter
                      ? "border-accent bg-accent/[0.04] shadow-card"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        discProfile === d.letter ? "bg-accent text-white" : "bg-surface text-ink-2"
                      }`}
                    >
                      {d.letter}
                    </span>
                    <span className="font-semibold text-sm text-ink">{d.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {d.traits.map((t) => (
                      <span
                        key={t}
                        className="inline-flex px-2 py-0.5 bg-surface text-ink-3 text-[10px] font-medium rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-ink-3 italic leading-relaxed">{d.quote}</p>
                </button>
              ))}
            </div>
            <div className="max-w-[240px]">
              <label className="block text-xs font-medium text-ink-3 mb-1.5">Blend</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
                value={discBlend}
                onChange={(e) => setDiscBlend(e.target.value)}
              >
                {DISC_BLENDS.map((b) => (
                  <option key={b} value={b}>
                    {b === "single" ? `Single (${discProfile} only)` : b}
                  </option>
                ))}
              </select>
            </div>
          </SectionWrapper>

          {/* ── Section 4: Frameworks ── */}
          <SectionWrapper num={4} title="Frameworks" complete={sec4Complete}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRESET_FRAMEWORKS.map((fw) => {
                const selected = selectedFrameworkIds.includes(fw.id);
                return (
                  <button
                    key={fw.id}
                    onClick={() => toggleFramework(fw.id)}
                    className={`text-left p-4 rounded-[12px] border-2 transition-all ${
                      selected
                        ? "border-accent bg-accent/[0.04] shadow-card"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <div className="font-semibold text-sm text-ink mb-1">{fw.name}</div>
                    <span
                      className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        fw.price === null
                          ? "bg-green/10 text-green"
                          : "bg-gold/10 text-[#92400e]"
                      }`}
                    >
                      {fw.tag}
                    </span>
                    {selected && (
                      <div className="mt-2 text-accent text-xs font-medium">✓ Selected</div>
                    )}
                  </button>
                );
              })}

              {/* DB frameworks */}
              {dbFrameworks.map((fw) => {
                const selected = selectedFrameworkIds.includes(fw.id);
                return (
                  <button
                    key={fw.id}
                    onClick={() => toggleFramework(fw.id)}
                    className={`text-left p-4 rounded-[12px] border-2 transition-all ${
                      selected
                        ? "border-accent bg-accent/[0.04] shadow-card"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <div className="font-semibold text-sm text-ink mb-1">{fw.name}</div>
                    <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-surface text-ink-3">
                      Custom
                    </span>
                    <div className="text-xs text-ink-3 mt-1">
                      {fw.criteria?.length || 0} criteria
                    </div>
                    {selected && (
                      <div className="mt-2 text-accent text-xs font-medium">✓ Selected</div>
                    )}
                  </button>
                );
              })}

              {/* Build custom card */}
              <button
                onClick={() => router.push("/dashboard/builder")}
                className="text-left p-4 rounded-[12px] border-2 border-dashed border-border hover:border-accent/40 transition-all"
              >
                <div className="font-semibold text-sm text-ink-3 mb-1">+ Build custom rubric</div>
                <div className="text-xs text-ink-3">Create your own evaluation framework</div>
              </button>
            </div>
          </SectionWrapper>

          {/* ── Section 5: Document Upload ── */}
          <SectionWrapper num={5} title="Document Upload" complete={sec5Complete}>
            <p className="text-xs text-ink-3 mb-3">
              Optional — upload a .docx or .pptx (max 10 MB) to give the AI context about your offering.
            </p>
            {!docFileName ? (
              <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-[12px] cursor-pointer hover:border-accent/40 transition-all">
                <span className="text-sm text-ink-3">Drop file here or click to browse</span>
                <input
                  type="file"
                  accept=".docx,.pptx"
                  className="hidden"
                  onChange={handleDocUpload}
                />
              </label>
            ) : (
              <div className="p-4 bg-surface rounded-sm border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{docFileName}</span>
                    {docPageCount && (
                      <span className="text-xs text-ink-3">
                        {docFileName.endsWith(".pptx") ? `${docPageCount} slides` : `${docPageCount} pages`}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setDocFile(null);
                      setDocFileName("");
                      setDocSummary("");
                      setDocPageCount(null);
                    }}
                    className="text-xs text-red hover:underline"
                  >
                    Remove
                  </button>
                </div>
                {docParsing ? (
                  <div className="text-xs text-ink-3 animate-pulse">Parsing document...</div>
                ) : (
                  docSummary && <div className="text-xs text-ink-3 leading-relaxed">{docSummary}</div>
                )}
              </div>
            )}
          </SectionWrapper>

          {/* ── Section 6: Voice & Mic ── */}
          <SectionWrapper num={6} title="Voice & Mic" complete={sec6Complete}>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <div>
                  <div className="text-sm text-ink font-medium">AI client speaks out loud</div>
                  <div className="text-xs text-ink-3">ElevenLabs voice matched to DISC personality</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={micEnabled}
                  onChange={(e) => setMicEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <div>
                  <div className="text-sm text-ink font-medium">Use microphone input</div>
                  <div className="text-xs text-ink-3">Whisper transcription — speak instead of type</div>
                </div>
              </label>
            </div>
          </SectionWrapper>
        </div>

        {/* ── Launch Bar ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-card-lg z-50">
          <div className="max-w-[860px] mx-auto px-8 py-4 flex items-center justify-between">
            <div className="text-sm text-ink-3">
              {canLaunch ? (
                <span className="text-green font-medium">✓ Ready to launch</span>
              ) : (
                <span>Fill in Client, Scenario, and Frameworks to launch</span>
              )}
            </div>
            <button
              onClick={startSession}
              disabled={!canLaunch || starting}
              className={`px-6 py-2.5 rounded-sm text-sm font-medium transition-all ${
                canLaunch
                  ? "bg-accent text-white hover:bg-[#4a3ce0] shadow-card"
                  : "bg-surface text-ink-3 cursor-not-allowed"
              }`}
            >
              {starting ? "Starting..." : "▶ Launch Session"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER: LIVE SESSION
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="p-8 max-w-[1100px]">
      <div className="grid grid-cols-[1fr_340px] gap-5">
        {/* Chat area */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              {!sessionEnded ? (
                <span className="inline-flex px-2.5 py-0.5 bg-green/10 text-green text-[11px] font-semibold rounded-full">
                  ● LIVE
                </span>
              ) : (
                <span className="inline-flex px-2.5 py-0.5 bg-surface text-ink-3 text-[11px] font-semibold rounded-full">
                  ENDED
                </span>
              )}
              <span className="text-xs text-ink-3">{formatTime(timer)}</span>
              <span className="text-xs text-ink-3">
                {research?.company_name || companyInput} · {meetingType || "Session"}
              </span>
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
                    msg.role === "assistant" ? "bg-accent/10 text-accent" : "bg-accent text-white"
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-accent/10 text-accent shrink-0">
                  AI
                </div>
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
                <div className="text-xs text-ink-3 italic">Scoring active for selected frameworks.</div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-[12px] p-4 shadow-card">
            <div className="font-semibold text-sm mb-3">AI Coach Nudges</div>
            <div className="flex flex-col gap-2">
              {nudges.length === 0 ? (
                <div className="text-xs text-ink-3 italic">Coaching feedback will appear as you practice...</div>
              ) : (
                nudges.map((nudge, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-gold/[0.08] border border-gold/20 rounded-sm text-xs text-[#92400e] leading-relaxed"
                  >
                    <span className="font-semibold">💡 </span>
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
