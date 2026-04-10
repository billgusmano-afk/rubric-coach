"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ScoreLevel {
  level: number;
  label: string;
  description: string;
}

interface Criterion {
  name: string;
  description: string;
  weight_percent: number;
  score_levels: ScoreLevel[];
  expanded: boolean;
}

const DEFAULT_LEVELS: ScoreLevel[] = [
  { level: 1, label: "Poor", description: "" },
  { level: 2, label: "Basic", description: "" },
  { level: 3, label: "Good", description: "" },
  { level: 4, label: "Strong", description: "" },
  { level: 5, label: "Elite", description: "" },
];

const TEMPLATES: Record<string, { name: string; selling_motion: string; criteria: Criterion[] }> = {
  human_edge: {
    name: "Human Edge Commercial",
    selling_motion: "Complex B2B enterprise sales — discovery, value articulation, and closing with senior buyers.",
    criteria: [
      {
        name: "Discovery Quality", description: "How effectively the rep uncovers business pain, strategic priorities, and decision criteria.", weight_percent: 20, expanded: false,
        score_levels: [
          { level: 1, label: "Poor", description: "No questions asked; jumps to pitch" },
          { level: 2, label: "Basic", description: "Surface questions, no follow-through" },
          { level: 3, label: "Good", description: "Solid questions, some depth" },
          { level: 4, label: "Strong", description: "Multi-layer discovery, strategic" },
          { level: 5, label: "Elite", description: "Board-level insight uncovered" },
        ],
      },
      {
        name: "Value Articulation", description: "Ability to connect solution capabilities to specific business outcomes.", weight_percent: 20, expanded: false,
        score_levels: [...DEFAULT_LEVELS],
      },
      {
        name: "Needs Analysis", description: "Depth of understanding the client's challenges and requirements.", weight_percent: 15, expanded: false,
        score_levels: [...DEFAULT_LEVELS],
      },
      {
        name: "Objection Handling", description: "Skill in addressing concerns without being defensive.", weight_percent: 15, expanded: false,
        score_levels: [...DEFAULT_LEVELS],
      },
      {
        name: "Closing Technique", description: "Ability to advance the deal and secure commitments.", weight_percent: 15, expanded: false,
        score_levels: [...DEFAULT_LEVELS],
      },
      {
        name: "Executive Presence", description: "Confidence, credibility, and professional communication at the C-level.", weight_percent: 15, expanded: false,
        score_levels: [...DEFAULT_LEVELS],
      },
    ],
  },
  meddic: {
    name: "MEDDIC Sales Framework",
    selling_motion: "Enterprise deal qualification and progression using the MEDDIC methodology.",
    criteria: [
      { name: "Metrics", description: "Quantified business outcomes the solution delivers.", weight_percent: 17, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Economic Buyer", description: "Access to and engagement with the decision-maker who controls budget.", weight_percent: 17, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Decision Criteria", description: "Understanding the formal and informal criteria for vendor selection.", weight_percent: 17, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Decision Process", description: "Knowledge of the steps, timeline, and approvals needed to close.", weight_percent: 17, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Identify Pain", description: "Ability to uncover and articulate the prospect's core business pain.", weight_percent: 16, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Champion", description: "Building an internal advocate who sells on your behalf.", weight_percent: 16, expanded: false, score_levels: [...DEFAULT_LEVELS] },
    ],
  },
  challenger: {
    name: "Challenger Sale Method",
    selling_motion: "Teaching, tailoring, and taking control of the sales conversation to reframe client thinking.",
    criteria: [
      { name: "Teaching", description: "Delivering unique insights that challenge the customer's assumptions.", weight_percent: 25, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Tailoring", description: "Adapting the message to resonate with the specific stakeholder.", weight_percent: 25, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Taking Control", description: "Assertively guiding the conversation and pushing back constructively.", weight_percent: 20, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Constructive Tension", description: "Creating productive discomfort that drives action.", weight_percent: 15, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Commercial Insight", description: "Connecting teaching moments to specific business value.", weight_percent: 15, expanded: false, score_levels: [...DEFAULT_LEVELS] },
    ],
  },
  financial: {
    name: "Financial Acumen Rubric",
    selling_motion: "Selling to CFOs and finance leaders — ROI framing, budget navigation, and financial language.",
    criteria: [
      { name: "ROI Framing", description: "Ability to quantify and articulate return on investment.", weight_percent: 30, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Budget Navigation", description: "Skill in discussing budget, procurement, and financial constraints.", weight_percent: 25, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "CFO-Level Language", description: "Using financial terminology and frameworks fluently.", weight_percent: 25, expanded: false, score_levels: [...DEFAULT_LEVELS] },
      { name: "Value Storytelling", description: "Translating features into financial impact narratives.", weight_percent: 20, expanded: false, score_levels: [...DEFAULT_LEVELS] },
    ],
  },
};

export default function BuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [name, setName] = useState("Enterprise Discovery Excellence");
  const [sellingMotion, setSellingMotion] = useState(
    "Complex B2B enterprise sales — discovery calls with C-suite buyers in manufacturing and financial services sectors."
  );
  const [criteria, setCriteria] = useState<Criterion[]>([
    {
      name: "Discovery Quality",
      description: "How effectively the rep uncovers business pain, strategic priorities, and decision criteria before presenting a solution.",
      weight_percent: 25,
      expanded: true,
      score_levels: [
        { level: 1, label: "Poor", description: "No questions asked; jumps to pitch" },
        { level: 2, label: "Basic", description: "Surface questions, no follow-through" },
        { level: 3, label: "Good", description: "Solid questions, some depth" },
        { level: 4, label: "Strong", description: "Multi-layer discovery, strategic" },
        { level: 5, label: "Elite", description: "Board-level insight uncovered" },
      ],
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ name: string; description: string }[] | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight_percent, 0);

  function toggleCriterion(index: number) {
    setCriteria((prev) =>
      prev.map((c, i) => (i === index ? { ...c, expanded: !c.expanded } : c))
    );
  }

  function updateCriterion(index: number, field: keyof Criterion, value: string | number) {
    setCriteria((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  function updateScoreLevel(critIndex: number, levelIndex: number, field: string, value: string) {
    setCriteria((prev) =>
      prev.map((c, ci) =>
        ci === critIndex
          ? {
              ...c,
              score_levels: c.score_levels.map((sl, li) =>
                li === levelIndex ? { ...sl, [field]: value } : sl
              ),
            }
          : c
      )
    );
  }

  function addCriterion() {
    setCriteria((prev) => [
      ...prev,
      {
        name: "",
        description: "",
        weight_percent: 0,
        expanded: true,
        score_levels: [...DEFAULT_LEVELS],
      },
    ]);
  }

  function removeCriterion(index: number) {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  }

  function moveCriterion(index: number, direction: "up" | "down") {
    setCriteria((prev) => {
      const arr = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  }

  function loadTemplate(key: string) {
    const t = TEMPLATES[key];
    setName(t.name);
    setSellingMotion(t.selling_motion);
    setCriteria(t.criteria);
    setAiSuggestions(null);
  }

  async function suggestCriteria() {
    if (!sellingMotion.trim()) return;
    setAiLoading(true);
    setAiSuggestions(null);
    try {
      const res = await fetch("/api/suggest-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selling_motion: sellingMotion }),
      });
      if (!res.ok) throw new Error("Failed to get suggestions");
      const data = await res.json();
      setAiSuggestions(data);
    } catch {
      setError("Failed to generate AI suggestions. Check your API key.");
    } finally {
      setAiLoading(false);
    }
  }

  function addSuggestion(suggestion: { name: string; description: string }) {
    setCriteria((prev) => [
      ...prev,
      {
        name: suggestion.name,
        description: suggestion.description,
        weight_percent: 0,
        expanded: true,
        score_levels: [...DEFAULT_LEVELS],
      },
    ]);
    setAiSuggestions((prev) => prev?.filter((s) => s.name !== suggestion.name) || null);
  }

  async function saveFramework() {
    setError("");
    setSuccess("");
    if (!name.trim()) {
      setError("Framework name is required.");
      return;
    }
    if (criteria.length === 0) {
      setError("Add at least one criterion.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description: "",
        selling_motion: sellingMotion,
        criteria: criteria.map((c) => ({
          name: c.name,
          description: c.description,
          weight_percent: c.weight_percent,
          score_levels: c.score_levels,
        })),
      };

      const url = editId ? `/api/frameworks/${editId}` : "/api/frameworks";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "upgrade_required") {
          setError("Framework limit reached. Upgrade your plan to add more.");
        } else {
          setError(data.error || "Failed to save framework.");
        }
        return;
      }

      setSuccess("Framework saved successfully!");
      setTimeout(() => router.push("/dashboard/frameworks"), 1200);
    } catch {
      setError("Failed to save framework.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-[960px]">
      <div className="mb-7">
        <h1 className="font-serif text-[26px] text-ink">Rubric Builder</h1>
        <p className="text-ink-3 text-sm">
          AI-assisted &mdash; define what excellence looks like for your team
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red/10 border border-red/20 rounded-sm text-red text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green/10 border border-green/20 rounded-sm text-green text-sm">{success}</div>
      )}

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Framework details */}
        <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
          <div className="font-semibold text-sm mb-4">Framework Details</div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-ink-3 mb-1.5">Framework name</label>
            <input
              className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-ink-3 mb-1.5">
              What selling motion does this cover?
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors min-h-[80px] resize-y"
              value={sellingMotion}
              onChange={(e) => setSellingMotion(e.target.value)}
            />
          </div>

          {/* AI suggestion panel */}
          <div className="p-3 bg-accent/[0.06] border border-accent/15 rounded-sm text-xs text-ink-3">
            <span className="text-accent font-semibold">AI Coach &rarr;</span>{" "}
            {aiSuggestions
              ? `${aiSuggestions.length} criteria suggested. Click to add.`
              : "Describe your selling motion above, then let AI suggest scoring criteria."}
            <div className="mt-2 flex gap-2">
              <button
                onClick={suggestCriteria}
                disabled={aiLoading || !sellingMotion.trim()}
                className="px-3 py-1.5 bg-accent text-white rounded-sm text-xs font-medium hover:bg-[#4a3ce0] transition-colors disabled:opacity-50"
              >
                {aiLoading ? "Generating..." : "Generate Criteria"}
              </button>
            </div>

            {aiSuggestions && aiSuggestions.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {aiSuggestions.map((s) => (
                  <div
                    key={s.name}
                    onClick={() => addSuggestion(s)}
                    className="p-2 bg-white border border-border rounded-sm cursor-pointer hover:border-accent transition-colors"
                  >
                    <div className="font-medium text-ink text-[12px]">{s.name}</div>
                    <div className="text-[11px] text-ink-3">{s.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Templates */}
        <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
          <div className="font-semibold text-sm mb-4">Quick-Start Templates</div>
          <div className="flex flex-col gap-2">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <div
                key={key}
                onClick={() => loadTemplate(key)}
                className="p-3 border border-border rounded-sm cursor-pointer hover:border-accent transition-colors"
              >
                <div className="font-medium text-[13px]">{t.name}</div>
                <div className="text-[11px] text-ink-3 mt-0.5">
                  {t.criteria.length} criteria &middot;{" "}
                  {t.criteria.map((c) => c.name).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Criteria builder */}
      <div className="bg-card border border-border rounded-[12px] p-5 shadow-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="font-semibold text-sm">Scoring Criteria</div>
            <div className="text-xs text-ink-3">
              Define each dimension and what each score level looks like
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-medium ${
                totalWeight === 100
                  ? "text-green"
                  : totalWeight > 100
                  ? "text-red"
                  : "text-gold"
              }`}
            >
              Weight: {totalWeight}%{totalWeight !== 100 && " (should be 100%)"}
            </span>
            <button
              onClick={addCriterion}
              className="px-3 py-1.5 bg-white text-accent border border-border rounded-sm text-xs font-medium hover:border-accent transition-colors"
            >
              + Add Criterion
            </button>
          </div>
        </div>

        {criteria.map((c, ci) => (
          <div key={ci} className="border border-border rounded-sm overflow-hidden mb-3">
            <div
              className="flex items-center justify-between px-4 py-3 bg-surface cursor-pointer"
              onClick={() => toggleCriterion(ci)}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-[13px]">{c.name || "New Criterion"}</span>
                <span className="inline-flex px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-accent/10 text-accent">
                  Weight: {c.weight_percent}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); moveCriterion(ci, "up"); }}
                  className="text-ink-3 hover:text-ink text-xs px-1"
                  title="Move up"
                >
                  &uarr;
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveCriterion(ci, "down"); }}
                  className="text-ink-3 hover:text-ink text-xs px-1"
                  title="Move down"
                >
                  &darr;
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeCriterion(ci); }}
                  className="text-red hover:text-red/80 text-xs px-1"
                  title="Remove"
                >
                  &times;
                </button>
                <span className="text-ink-3 ml-1">{c.expanded ? "\u25BE" : "\u25B8"}</span>
              </div>
            </div>

            {c.expanded && (
              <div className="p-4 bg-white">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-3 mb-1.5">Criterion name</label>
                    <input
                      className="w-full px-3 py-2 border border-border rounded-sm text-sm"
                      value={c.name}
                      onChange={(e) => updateCriterion(ci, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-3 mb-1.5">Weight (%)</label>
                    <input
                      className="w-full px-3 py-2 border border-border rounded-sm text-sm"
                      type="number"
                      min={0}
                      max={100}
                      value={c.weight_percent}
                      onChange={(e) => updateCriterion(ci, "weight_percent", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-ink-3 mb-1.5">What does this measure?</label>
                  <textarea
                    className="w-full px-3 py-2 border border-border rounded-sm text-sm min-h-[60px] resize-y"
                    value={c.description}
                    onChange={(e) => updateCriterion(ci, "description", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {c.score_levels.map((sl, li) => (
                    <div key={sl.level} className="border border-border rounded-md p-2 text-center text-[11px]">
                      <div className="text-base font-bold text-accent mb-0.5">{sl.level}</div>
                      <input
                        className="w-full text-center font-semibold text-ink text-[11px] border-none outline-none bg-transparent mb-0.5"
                        value={sl.label}
                        onChange={(e) => updateScoreLevel(ci, li, "label", e.target.value)}
                      />
                      <textarea
                        className="w-full text-center text-ink-3 text-[10px] border-none outline-none bg-transparent resize-none"
                        rows={2}
                        value={sl.description}
                        placeholder="Describe this level..."
                        onChange={(e) => updateScoreLevel(ci, li, "description", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-3 mt-5">
          <button
            onClick={saveFramework}
            disabled={saving}
            className="px-4 py-2.5 bg-accent text-white rounded-sm text-sm font-medium hover:bg-[#4a3ce0] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : editId ? "Update Framework" : "Save Framework"}
          </button>
          <button
            onClick={() => router.push("/dashboard/frameworks")}
            className="px-4 py-2.5 bg-white text-accent border border-border rounded-sm text-sm font-medium hover:border-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
