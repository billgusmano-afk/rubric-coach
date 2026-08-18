// MMG's instructional frame — the IP that separates this product from generic
// AI role-play scoring. Ported verbatim from the MMG Coach Studio reference
// implementation (mmg-coach-studio/api/coach.js). Injected into the coach
// scoring call so every learner message is scored against MMG's frame, not
// against generic "was that a good call" quality.
//
//   Quadrant D (Daggett Rigor/Relevance) — is the rep recalling a pitch
//     (Quadrant A) or adapting judgment to an unpredictable real situation
//     (Quadrant D)? Scored on two axes so it can be PLOTTED, not just rated.
//   Trust Equation (Green) — self-orientation is the denominator and the only
//     AI-proof variable. Scored inverted: low self-orientation = high score.
//   Business & financial acumen — ROBA/ROWC, P&L literacy, cost of the problem.

export const MMG_FRAME = `MMG's instructional frame (The Motivated Mind Group). Score the LEARNER against this, not against generic sales-call quality:

RIGOR / RELEVANCE (Daggett) — the Quadrant D model. Two independent axes:
  RIGOR (1-6, Bloom-style knowledge taxonomy):
    1 Awareness/recall — recites a fact, feature, or memorised line
    2 Comprehension — explains it in own words
    3 Application — applies a known procedure correctly
    4 Analysis — breaks a situation apart, compares, finds cause
    5 Synthesis — combines ideas into something new for this customer
    6 Evaluation — judges trade-offs, defends a recommendation under uncertainty
  RELEVANCE (1-5, application model):
    1 Knowledge in one discipline — sales knowledge for its own sake
    2 Apply in discipline — applies within the sales process
    3 Apply across disciplines — connects sales to finance/ops/technical reality
    4 Apply to real-world predictable situations — the customer's actual known context
    5 Apply to real-world UNPREDICTABLE situations — novel, ambiguous, this-customer-only
  Quadrant D = rigor >= 4 AND relevance >= 4. That is adaptation: high-order thinking
  applied to an unpredictable real situation. Quadrant A (low/low) is pitch recall.
  Most sellers live in A and B. D is the only thing AI cannot commoditise.

TRUST EQUATION (Green): (Credibility + Reliability + Intimacy) / Self-Orientation.
  Self-orientation is the denominator and the ONLY AI-proof variable. Score
  self_orientation 1-5 where 5 = almost entirely focused on the CUSTOMER's world
  and 1 = focused on own quota/product/agenda. Talking about your solution early,
  pitching before diagnosing, or steering to close all raise self-orientation
  (and therefore LOWER this score).

TRANSLATION IMPERATIVE: delivering complexity as complexity is itself an act of
  self-orientation. Jargon dumps and feature lists score low. Making the complex
  simple in the customer's language scores high.

BUSINESS & FINANCIAL ACUMEN: does the rep think in the customer's P&L?
  - ROBA = Operating Margin x Business-Asset Turns; ROWC = Operating Margin x
    Working-Capital Turns. Two levers: margin per deal, or velocity/turns.
  - Cost of the problem, quantified in the CUSTOMER's numbers, beats any feature.
  - Revenue, gross margin, SG&A, working-capital cycle, payback period.
  Naming a number the customer gave you and doing something with it scores high.
  Vague "improve efficiency" claims score low.`;

// Per-message scoring instructions for the MMG dimensions, adapted from the
// studio's roleplay system prompt. These score the learner's LATEST message
// IN ADDITION to whatever rubric criteria the session's frameworks define.
export const MMG_SCORING_INSTRUCTIONS = `You also score the sales rep's LATEST message on MMG's frame above. Be honest and demanding, not generous — 3 means adequate, 5 should be rare and earned. A polite but empty question is a 2. Score:
- rigor (1-6) and relevance (1-5): the two Daggett axes above, for this message
- quadrant: "A" | "B" | "C" | "D" — derived: D if rigor>=4 and relevance>=4; C if rigor>=4 and relevance<4; B if rigor<4 and relevance>=4; else A
- acumen (1-5): business/financial framing — P&L thinking, cost of the problem, ROBA/ROWC logic, quantified in the customer's numbers
- self_orientation (1-5): INVERTED Trust Equation denominator — 5 = fully in the customer's world, 1 = focused on own product/quota/agenda
- quadrant_why: one short clause (max 15 words) explaining the rigor/relevance placement, e.g. "recalled a feature list, no link to their numbers".`;

// Server-side guard: derive the quadrant from the two axes so a stray model
// label can never disagree with the plotted position.
export function deriveQuadrant(rigor: number, relevance: number): "A" | "B" | "C" | "D" {
  if (rigor >= 4 && relevance >= 4) return "D";
  if (rigor >= 4) return "C";
  if (relevance >= 4) return "B";
  return "A";
}
