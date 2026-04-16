"use client";

import { useState, useEffect } from "react";
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

/* ───────────────────── Persistence ───────────────────── */

const STORAGE_KEY = "rubriccoach_roleplay_setup_v1";

interface PersistedSetup {
  companyInput: string;
  research: CompanyResearch | null;
  partnerName: string;
  partnerRole: string;
  partnerSolution: string;
  relationshipStage: string;
  meetingType: string;
  proposal: string;
  objective: string;
  expectedObjection: string;
  discProfile: string;
  discBlend: string;
  selectedFrameworkIds: string[];
  docSummary: string;
  docPageCount: number | null;
  docFileName: string;
  docContext: string;
  voiceEnabled: boolean;
  micEnabled: boolean;
}

function loadPersisted(): Partial<PersistedSetup> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedSetup;
  } catch {
    return {};
  }
}

/* ───────────────────── Main Component ───────────────────── */

export default function RoleplayPage() {
  const router = useRouter();

  // Load persisted state once on mount
  const persisted = typeof window !== "undefined" ? loadPersisted() : {};

  /* ── Section 1: Client & Partner ── */
  const [companyInput, setCompanyInput] = useState(persisted.companyInput ?? "");
  const [research, setResearch] = useState<CompanyResearch | null>(persisted.research ?? null);
  const [researching, setResearching] = useState(false);
  const [partnerName, setPartnerName] = useState(persisted.partnerName ?? "");
  const [partnerRole, setPartnerRole] = useState<string>(persisted.partnerRole ?? "");
  const [partnerSolution, setPartnerSolution] = useState(persisted.partnerSolution ?? "");

  /* ── Section 2: Scenario ── */
  const [relationshipStage, setRelationshipStage] = useState<string>(persisted.relationshipStage ?? "");
  const [meetingType, setMeetingType] = useState<string>(persisted.meetingType ?? "");
  const [proposal, setProposal] = useState(persisted.proposal ?? "");
  const [objective, setObjective] = useState(persisted.objective ?? "");
  const [expectedObjection, setExpectedObjection] = useState(persisted.expectedObjection ?? "");

  /* ── Section 3: DISC ── */
  const [discProfile, setDiscProfile] = useState(persisted.discProfile ?? "D");
  const [discBlend, setDiscBlend] = useState(persisted.discBlend ?? "single");

  /* ── Section 4: Frameworks ── */
  const [dbFrameworks, setDbFrameworks] = useState<Framework[]>([]);
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>(
    persisted.selectedFrameworkIds ?? ["human-edge"]
  );

  /* ── Section 5: Document ── */
  const [docParsing, setDocParsing] = useState(false);
  const [docSummary, setDocSummary] = useState(persisted.docSummary ?? "");
  const [docPageCount, setDocPageCount] = useState<number | null>(persisted.docPageCount ?? null);
  const [docFileName, setDocFileName] = useState(persisted.docFileName ?? "");
  const [docContext, setDocContext] = useState(persisted.docContext ?? "");

  /* ── Section 6: Voice ── */
  const [voiceEnabled, setVoiceEnabled] = useState(persisted.voiceEnabled ?? true);
  const [micEnabled, setMicEnabled] = useState(persisted.micEnabled ?? false);

  /* ── Launch ── */
  const [starting, setStarting] = useState(false);
  const [launchError, setLaunchError] = useState("");

  /* ── Section completion checks ── */
  const sec1Complete = companyInput.trim().length > 0;
  const sec2Complete =
    relationshipStage !== "" && meetingType !== "" && proposal.trim().length > 0 && objective.trim().length > 0;
  const sec3Complete = true;
  const sec4Complete = selectedFrameworkIds.length > 0;
  const sec5Complete = docFileName.length > 0;
  const sec6Complete = true;

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

  /* ── Auto-save setup to localStorage on every change ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: PersistedSetup = {
      companyInput,
      research,
      partnerName,
      partnerRole,
      partnerSolution,
      relationshipStage,
      meetingType,
      proposal,
      objective,
      expectedObjection,
      discProfile,
      discBlend,
      selectedFrameworkIds,
      docSummary,
      docPageCount,
      docFileName,
      docContext,
      voiceEnabled,
      micEnabled,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota errors */
    }
  }, [
    companyInput, research, partnerName, partnerRole, partnerSolution,
    relationshipStage, meetingType, proposal, objective, expectedObjection,
    discProfile, discBlend, selectedFrameworkIds,
    docSummary, docPageCount, docFileName, docContext,
    voiceEnabled, micEnabled,
  ]);

  function clearSetup() {
    if (!confirm("Clear all setup fields? This cannot be undone.")) return;
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    setCompanyInput("");
    setResearch(null);
    setPartnerName("");
    setPartnerRole("");
    setPartnerSolution("");
    setRelationshipStage("");
    setMeetingType("");
    setProposal("");
    setObjective("");
    setExpectedObjection("");
    setDiscProfile("D");
    setDiscBlend("single");
    setSelectedFrameworkIds(["human-edge"]);
    setDocSummary("");
    setDocPageCount(null);
    setDocFileName("");
    setDocContext("");
    setVoiceEnabled(true);
    setMicEnabled(false);
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

  /* ── Document upload — real server-side parsing ── */
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

    setDocFileName(file.name);
    setDocParsing(true);
    setDocSummary("");
    setDocPageCount(null);
    setDocContext("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents/parse", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setDocSummary(data.summary);
        setDocPageCount(data.page_count);
        setDocContext(data.extracted_text || data.summary);
      } else {
        setDocSummary("Failed to parse document. It will still be available as context.");
      }
    } catch {
      setDocSummary("Failed to parse document.");
    } finally {
      setDocParsing(false);
    }
  }

  /* ── Start session → redirect to /dashboard/session/[id] ── */
  async function startSession() {
    if (!canLaunch) return;
    setStarting(true);
    setLaunchError("");
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
          document_context: docContext || null,
          voice_enabled: voiceEnabled,
          mic_enabled: micEnabled,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setLaunchError(err.error || `Server error (${res.status})`);
        setStarting(false);
        return;
      }

      const data = await res.json();

      // Store session data for the session page to pick up
      sessionStorage.setItem(
        `session_${data.session_id}`,
        JSON.stringify({
          session_id: data.session_id,
          system_prompt: data.system_prompt,
          opening_message: data.opening_message,
          company_name: research?.company_name || companyInput,
          meeting_type: meetingType,
          disc_profile: discProfile,
          framework_ids: selectedFrameworkIds,
          voice_enabled: voiceEnabled,
          mic_enabled: micEnabled,
          // Context for in-session briefing panel
          company_research: research,
          partner_name: partnerName,
          partner_role: partnerRole,
          partner_solution: partnerSolution,
          relationship_stage: relationshipStage,
          proposal,
          objective,
          expected_objection: expectedObjection,
          disc_blend: discBlend,
        })
      );

      // Redirect to the dedicated session page
      router.push(`/dashboard/session/${data.session_id}`);
    } catch {
      setLaunchError("Network error — check your connection and try again.");
      setStarting(false);
    }
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="p-8 max-w-[860px] pb-32">
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-[26px] text-ink">Session Setup</h1>
          <p className="text-ink-3 text-sm">
            Configure your roleplay scenario, then launch. Your progress is saved automatically.
          </p>
        </div>
        <button
          onClick={clearSetup}
          className="px-3 py-1.5 text-xs font-medium text-ink-3 border border-border rounded-sm hover:border-red hover:text-red transition-colors"
        >
          Clear setup
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {/* ── Section 1: Client & Partner ── */}
        <SectionWrapper num={1} title="Client & Partner" complete={sec1Complete}>
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

          {research && (
            <div className="mb-4 p-4 bg-surface rounded-sm border border-border">
              <div className="flex gap-4 items-start">
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
                    selected ? "border-accent bg-accent/[0.04] shadow-card" : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="font-semibold text-sm text-ink mb-1">{fw.name}</div>
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      fw.price === null ? "bg-green/10 text-green" : "bg-gold/10 text-[#92400e]"
                    }`}
                  >
                    {fw.tag}
                  </span>
                  {selected && <div className="mt-2 text-accent text-xs font-medium">✓ Selected</div>}
                </button>
              );
            })}

            {dbFrameworks.map((fw) => {
              const selected = selectedFrameworkIds.includes(fw.id);
              return (
                <button
                  key={fw.id}
                  onClick={() => toggleFramework(fw.id)}
                  className={`text-left p-4 rounded-[12px] border-2 transition-all ${
                    selected ? "border-accent bg-accent/[0.04] shadow-card" : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="font-semibold text-sm text-ink mb-1">{fw.name}</div>
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-surface text-ink-3">
                    Custom
                  </span>
                  <div className="text-xs text-ink-3 mt-1">{fw.criteria?.length || 0} criteria</div>
                  {selected && <div className="mt-2 text-accent text-xs font-medium">✓ Selected</div>}
                </button>
              );
            })}

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
              <input type="file" accept=".docx,.pptx" className="hidden" onChange={handleDocUpload} />
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
                    setDocFileName("");
                    setDocSummary("");
                    setDocPageCount(null);
                    setDocContext("");
                  }}
                  className="text-xs text-red hover:underline"
                >
                  Remove
                </button>
              </div>
              {docParsing ? (
                <div className="text-xs text-ink-3 animate-pulse">Parsing document and generating AI summary...</div>
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
                <div className="text-xs text-ink-3">Browser speech recognition — speak instead of type</div>
              </div>
            </label>
          </div>
        </SectionWrapper>
      </div>

      {/* ── Launch Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-card-lg z-50">
        <div className="max-w-[860px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="text-sm">
            {launchError ? (
              <span className="text-red font-medium">{launchError}</span>
            ) : canLaunch ? (
              <span className="text-green font-medium">✓ Ready to launch</span>
            ) : (
              <span className="text-ink-3">Fill in Client, Scenario, and Frameworks to launch</span>
            )}
          </div>
          <button
            onClick={startSession}
            disabled={!canLaunch || starting}
            className={`px-6 py-2.5 rounded-sm text-sm font-medium transition-all flex items-center gap-2 ${
              canLaunch && !starting
                ? "bg-accent text-white hover:bg-[#4a3ce0] shadow-card"
                : starting
                ? "bg-accent/80 text-white cursor-wait"
                : "bg-surface text-ink-3 cursor-not-allowed"
            }`}
          >
            {starting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Launching...
              </>
            ) : (
              "▶ Launch Session"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
