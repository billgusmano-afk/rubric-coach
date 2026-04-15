/**
 * Preset framework definitions with full scoring criteria.
 * These are used when the user selects a preset framework
 * (not stored in DB — they ship with the app).
 */

export interface PresetCriterion {
  id: string;
  name: string;
  description: string;
  weight_percent: number;
  levels: { level: number; label: string; description: string }[];
}

export interface PresetFramework {
  id: string;
  name: string;
  description: string;
  criteria: PresetCriterion[];
}

export const PRESET_FRAMEWORKS: PresetFramework[] = [
  {
    id: "human-edge",
    name: "Human Edge Commercial",
    description:
      "Evaluates thinking quality + trust impact across 5 dimensions. Composite 5–10 = Replaceable (high AI risk); 11–18 = Transitional (at risk); 19–25 = Human Edge (differentiated, low AI risk).",
    criteria: [
      {
        id: "he-rigor",
        name: "Rigor — Thinking Depth",
        description: "Depth of analysis: does the rep reframe the problem or stay on the surface?",
        weight_percent: 20,
        levels: [
          { level: 1, label: "Poor", description: "Surface-level, reactive. Accepts the client's framing without probing." },
          { level: 2, label: "Below Average", description: "Occasional probes but mostly takes surface answers at face value." },
          { level: 3, label: "Adequate", description: "Some structure and limited probing. Asks follow-ups but doesn't pressure-test." },
          { level: 4, label: "Good", description: "Structured analysis with meaningful probes that test assumptions." },
          { level: 5, label: "Excellent", description: "Deep analysis that reframes the problem — client sees their situation in a new way." },
        ],
      },
      {
        id: "he-relevance",
        name: "Relevance — Application",
        description: "How well the rep contextualizes everything to this customer's specific reality, not a generic pitch.",
        weight_percent: 20,
        levels: [
          { level: 1, label: "Poor", description: "Generic, product-first. Same pitch regardless of audience." },
          { level: 2, label: "Below Average", description: "Minor tailoring, mostly boilerplate with surface references to the client." },
          { level: 3, label: "Adequate", description: "Some tailoring to industry or role." },
          { level: 4, label: "Good", description: "Tailored to the stakeholder's role, KPIs, and specific context." },
          { level: 5, label: "Excellent", description: "Fully contextualized to the customer's reality — feels built for them and their situation." },
        ],
      },
      {
        id: "he-credibility",
        name: "Trust — Credibility",
        description: "Expertise demonstrated in context. Does the rep earn the right to be taken seriously?",
        weight_percent: 20,
        levels: [
          { level: 1, label: "Poor", description: "Sounds scripted or shallow. Cannot answer substantive questions." },
          { level: 2, label: "Below Average", description: "Some expertise visible but inconsistent; leans on marketing language." },
          { level: 3, label: "Adequate", description: "Competent but standard — could be any rep at any vendor." },
          { level: 4, label: "Good", description: "Clear subject expertise demonstrated in context with specific examples." },
          { level: 5, label: "Excellent", description: "Demonstrates real expertise that reframes the client's understanding of the space." },
        ],
      },
      {
        id: "he-intimacy",
        name: "Trust — Intimacy",
        description: "Does the customer open up? Is there real dialogue vs transactional Q&A?",
        weight_percent: 20,
        levels: [
          { level: 1, label: "Poor", description: "No personal connection. Transactional exchange only." },
          { level: 2, label: "Below Average", description: "Transactional warmth — pleasant but shallow." },
          { level: 3, label: "Adequate", description: "Basic rapport established. Polite and professional." },
          { level: 4, label: "Good", description: "Client shares real concerns and priorities beyond the official brief." },
          { level: 5, label: "Excellent", description: "Customer opens up — real dialogue. They share things they hadn't planned to share." },
        ],
      },
      {
        id: "he-self-orientation",
        name: "Trust — Self-Orientation (inverted)",
        description:
          "Scored inverted — 5 = customer-first, 1 = pitch-focused. In the Trust Equation, Self-Orientation is the denominator: lower is better. Higher scores on this criterion mean lower self-orientation.",
        weight_percent: 20,
        levels: [
          { level: 1, label: "Poor", description: "Pitch-focused. Drives own agenda, ignores client signals, talks over customer." },
          { level: 2, label: "Below Average", description: "Agenda-driven with occasional nods to the customer's situation." },
          { level: 3, label: "Adequate", description: "Balanced — roughly equal attention to own agenda and customer needs." },
          { level: 4, label: "Good", description: "Mostly customer-oriented. Occasional agenda moments but quickly returns to customer." },
          { level: 5, label: "Excellent", description: "Clearly customer-first. Every move serves the customer's outcome, not the rep's quota." },
        ],
      },
    ],
  },
  {
    id: "financial-acumen",
    name: "Financial Acumen",
    description: "Evaluates ability to speak the language of business outcomes, ROI, and financial impact.",
    criteria: [
      {
        id: "fa-business-context",
        name: "Business Context Understanding",
        description: "Demonstrates knowledge of client's financial situation and industry pressures",
        weight_percent: 20,
        levels: [
          { level: 1, label: "Poor", description: "No awareness of client's business model or financials" },
          { level: 2, label: "Below Average", description: "Surface-level understanding only" },
          { level: 3, label: "Adequate", description: "Shows general industry knowledge" },
          { level: 4, label: "Good", description: "References specific financial metrics relevant to client" },
          { level: 5, label: "Excellent", description: "Deep understanding of P&L impact and competitive pressures" },
        ],
      },
      {
        id: "fa-roi",
        name: "ROI & Value Quantification",
        description: "Builds a credible business case with specific numbers",
        weight_percent: 30,
        levels: [
          { level: 1, label: "Poor", description: "No attempt to quantify value" },
          { level: 2, label: "Below Average", description: "Vague claims about savings or revenue" },
          { level: 3, label: "Adequate", description: "General ROI framework but no client-specific numbers" },
          { level: 4, label: "Good", description: "Specific ROI calculation tied to client's metrics" },
          { level: 5, label: "Excellent", description: "Compelling multi-year business case with payback period" },
        ],
      },
      {
        id: "fa-tco",
        name: "Total Cost of Ownership",
        description: "Addresses implementation costs, hidden costs, and long-term value",
        weight_percent: 25,
        levels: [
          { level: 1, label: "Poor", description: "Avoids or ignores cost discussions" },
          { level: 2, label: "Below Average", description: "Only discusses license price" },
          { level: 3, label: "Adequate", description: "Mentions implementation but minimizes costs" },
          { level: 4, label: "Good", description: "Transparent TCO discussion with mitigation strategies" },
          { level: 5, label: "Excellent", description: "Proactively builds TCO model showing long-term advantage" },
        ],
      },
      {
        id: "fa-stakeholder",
        name: "CFO / Finance Stakeholder Language",
        description: "Speaks in terms finance leaders understand and care about",
        weight_percent: 25,
        levels: [
          { level: 1, label: "Poor", description: "Only uses technical or product language" },
          { level: 2, label: "Below Average", description: "Occasional financial terms but out of context" },
          { level: 3, label: "Adequate", description: "Uses financial language but doesn't fully connect" },
          { level: 4, label: "Good", description: "Fluent in financial language, ties to margin and growth" },
          { level: 5, label: "Excellent", description: "Speaks like a business partner, not a vendor" },
        ],
      },
    ],
  },
  {
    id: "challenger-sale",
    name: "Challenger Sale",
    description: "Evaluates teaching, tailoring, and taking control of the sales conversation.",
    criteria: [
      {
        id: "cs-teach",
        name: "Teach — Commercial Insight",
        description: "Delivers a unique insight that reframes how the client thinks about their problem",
        weight_percent: 35,
        levels: [
          { level: 1, label: "Poor", description: "No insight, just product information" },
          { level: 2, label: "Below Average", description: "Shares information client already knows" },
          { level: 3, label: "Adequate", description: "Interesting data point but doesn't reframe thinking" },
          { level: 4, label: "Good", description: "Insight challenges an assumption and creates urgency" },
          { level: 5, label: "Excellent", description: "Compelling reframe that makes client rethink their approach" },
        ],
      },
      {
        id: "cs-tailor",
        name: "Tailor — Message Resonance",
        description: "Adapts the message to the specific stakeholder's priorities and language",
        weight_percent: 30,
        levels: [
          { level: 1, label: "Poor", description: "Generic pitch, same for every audience" },
          { level: 2, label: "Below Average", description: "Minor customization, mostly boilerplate" },
          { level: 3, label: "Adequate", description: "References client's industry but not their specific role" },
          { level: 4, label: "Good", description: "Message resonates with stakeholder's personal KPIs" },
          { level: 5, label: "Excellent", description: "Perfectly tailored narrative that feels built just for them" },
        ],
      },
      {
        id: "cs-control",
        name: "Take Control — Constructive Tension",
        description: "Pushes back respectfully, holds firm on value, drives the deal forward",
        weight_percent: 35,
        levels: [
          { level: 1, label: "Poor", description: "Caves immediately on pushback or goes silent" },
          { level: 2, label: "Below Average", description: "Accommodates every request without pushback" },
          { level: 3, label: "Adequate", description: "Holds ground but doesn't advance the conversation" },
          { level: 4, label: "Good", description: "Respectful pushback that builds credibility and momentum" },
          { level: 5, label: "Excellent", description: "Creates productive tension that accelerates the decision" },
        ],
      },
    ],
  },
  {
    id: "meddic",
    name: "MEDDIC",
    description: "Evaluates qualification rigor: Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion.",
    criteria: [
      {
        id: "md-metrics",
        name: "Metrics",
        description: "Uncovers and validates the quantifiable measures of success",
        weight_percent: 18,
        levels: [
          { level: 1, label: "Poor", description: "No attempt to identify success metrics" },
          { level: 2, label: "Below Average", description: "Asks about goals but not specific KPIs" },
          { level: 3, label: "Adequate", description: "Identifies some metrics but doesn't validate them" },
          { level: 4, label: "Good", description: "Clear metrics tied to business outcomes" },
          { level: 5, label: "Excellent", description: "Validated metrics with baseline and target numbers" },
        ],
      },
      {
        id: "md-economic-buyer",
        name: "Economic Buyer",
        description: "Identifies and engages the person with budget authority",
        weight_percent: 18,
        levels: [
          { level: 1, label: "Poor", description: "No awareness of who controls the budget" },
          { level: 2, label: "Below Average", description: "Assumes current contact is the decision maker" },
          { level: 3, label: "Adequate", description: "Asks who else is involved but doesn't map power" },
          { level: 4, label: "Good", description: "Identifies economic buyer and plans engagement" },
          { level: 5, label: "Excellent", description: "Maps buying committee and tailors approach to EB" },
        ],
      },
      {
        id: "md-decision-criteria",
        name: "Decision Criteria",
        description: "Understands how the client will evaluate and choose a solution",
        weight_percent: 16,
        levels: [
          { level: 1, label: "Poor", description: "No questions about evaluation criteria" },
          { level: 2, label: "Below Average", description: "Assumes price is the only factor" },
          { level: 3, label: "Adequate", description: "Asks about criteria but doesn't influence them" },
          { level: 4, label: "Good", description: "Maps criteria and positions solution against each" },
          { level: 5, label: "Excellent", description: "Shapes criteria in favor of unique differentiators" },
        ],
      },
      {
        id: "md-decision-process",
        name: "Decision Process",
        description: "Maps the buying process, timeline, and approval steps",
        weight_percent: 16,
        levels: [
          { level: 1, label: "Poor", description: "No understanding of how decisions get made" },
          { level: 2, label: "Below Average", description: "Asks about timeline only" },
          { level: 3, label: "Adequate", description: "General sense of process but gaps in understanding" },
          { level: 4, label: "Good", description: "Clear process map with milestones and owners" },
          { level: 5, label: "Excellent", description: "Co-creates a mutual action plan with the client" },
        ],
      },
      {
        id: "md-identify-pain",
        name: "Identify Pain",
        description: "Uncovers the compelling event or pain driving the evaluation",
        weight_percent: 16,
        levels: [
          { level: 1, label: "Poor", description: "No pain identified, solution looking for a problem" },
          { level: 2, label: "Below Average", description: "Surface-level pain, not compelling" },
          { level: 3, label: "Adequate", description: "Real pain identified but not quantified" },
          { level: 4, label: "Good", description: "Pain quantified and tied to business impact" },
          { level: 5, label: "Excellent", description: "Compelling pain with urgency — cost of inaction is clear" },
        ],
      },
      {
        id: "md-champion",
        name: "Champion",
        description: "Identifies and develops an internal advocate for the solution",
        weight_percent: 16,
        levels: [
          { level: 1, label: "Poor", description: "No champion identified or developed" },
          { level: 2, label: "Below Average", description: "Friendly contact but not a true champion" },
          { level: 3, label: "Adequate", description: "Potential champion but hasn't been tested or coached" },
          { level: 4, label: "Good", description: "Champion identified, has influence and access" },
          { level: 5, label: "Excellent", description: "Champion is actively selling internally on your behalf" },
        ],
      },
    ],
  },
  {
    id: "strategic-mgmt",
    name: "Strategic Management",
    description: "Evaluates strategic account planning, relationship depth, and long-term value creation.",
    criteria: [
      {
        id: "sm-account-knowledge",
        name: "Account & Industry Knowledge",
        description: "Demonstrates deep understanding of the account's strategy, market, and competitive landscape",
        weight_percent: 25,
        levels: [
          { level: 1, label: "Poor", description: "No preparation or account knowledge evident" },
          { level: 2, label: "Below Average", description: "Basic company info only" },
          { level: 3, label: "Adequate", description: "Knows industry trends but not account-specific strategy" },
          { level: 4, label: "Good", description: "References account's strategic priorities and market position" },
          { level: 5, label: "Excellent", description: "Insight-level knowledge that impresses the client" },
        ],
      },
      {
        id: "sm-relationship",
        name: "Relationship Mapping & Expansion",
        description: "Navigates stakeholder relationships and expands influence within the account",
        weight_percent: 25,
        levels: [
          { level: 1, label: "Poor", description: "Single-threaded, no awareness of other stakeholders" },
          { level: 2, label: "Below Average", description: "Knows of others but hasn't engaged them" },
          { level: 3, label: "Adequate", description: "Multi-threaded but relationships are shallow" },
          { level: 4, label: "Good", description: "Strong multi-threaded relationships across departments" },
          { level: 5, label: "Excellent", description: "Trusted advisor status with executive sponsorship" },
        ],
      },
      {
        id: "sm-value-creation",
        name: "Long-term Value Creation",
        description: "Positions as a strategic partner, not just a vendor",
        weight_percent: 25,
        levels: [
          { level: 1, label: "Poor", description: "Transactional approach, product-focused only" },
          { level: 2, label: "Below Average", description: "Tries to upsell without strategic context" },
          { level: 3, label: "Adequate", description: "Some strategic vision but not connected to client goals" },
          { level: 4, label: "Good", description: "Clear partnership vision aligned with client's roadmap" },
          { level: 5, label: "Excellent", description: "Co-creates strategic value that transforms the account" },
        ],
      },
      {
        id: "sm-execution",
        name: "Execution & Follow-through",
        description: "Demonstrates reliability, follow-up discipline, and action orientation",
        weight_percent: 25,
        levels: [
          { level: 1, label: "Poor", description: "No follow-up commitments or action items" },
          { level: 2, label: "Below Average", description: "Vague promises with no specifics" },
          { level: 3, label: "Adequate", description: "Action items identified but not locked down" },
          { level: 4, label: "Good", description: "Clear actions with owners, dates, and accountability" },
          { level: 5, label: "Excellent", description: "Proactive follow-through plan that builds confidence" },
        ],
      },
    ],
  },
];

/** Look up a preset framework by ID */
export function getPresetFramework(id: string): PresetFramework | undefined {
  return PRESET_FRAMEWORKS.find((f) => f.id === id);
}

/** Get all preset criteria for a list of framework IDs */
export function getPresetCriteria(frameworkIds: string[]): PresetCriterion[] {
  return PRESET_FRAMEWORKS.filter((f) => frameworkIds.includes(f.id)).flatMap((f) => f.criteria);
}
