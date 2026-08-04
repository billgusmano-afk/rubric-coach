# MMG — Sales Compensation Policy — Commissionable Gross Profit (CGP)

*Canonical sales compensation policy for MMG Global LLC. Lives in Box: `00 — MMG Operating System / 10 — Sales Compensation`. Decision ratified by Bill, 2026-08-02.*

---

## The decision (memory record)

**MMG never uses actual gross margin in a sales commission agreement.** Too many post-sale variables sit outside the salesperson's control — scope creep, client changes, project management inefficiency, production overruns, internal staffing decisions, executive discounts, vendor changes. Basing commissions on actual profitability turns every project into a debate.

Instead, MMG pays commissions on **Commissionable Gross Profit (CGP)** — an estimated gross profit locked at quote approval.

## How it works

1. **Estimate delivery labor before the quote.** For every proposal, before it is sent to the customer, MMG prepares an internal pricing worksheet.
2. **Approve the quote.** Management approves the pricing worksheet along with the proposal.
3. **Lock the CGP.** Once approved, CGP is fixed for commission purposes.
4. **Pay commissions from that number.**
5. **Ignore actual project profitability for commission purposes.** Over budget or under budget, the salesperson is paid on the locked CGP.

The only thing that changes CGP is an approved **change order** that increases or decreases the customer contract value.

## The formula

> **Commissionable Gross Profit = Approved Contract Value − Approved Direct Delivery Costs**

**Direct Delivery Costs** consist solely of:
- Labor costs of MMG employees budgeted for the engagement, and
- **Approved subcontractor / freelancer labor** budgeted for the engagement (critical for MMG — video production, instructional design, animation, and specialized consulting frequently use external talent; excluding them would inflate CGP on contractor-heavy projects).

**Explicitly excluded** (operating expenses, not direct costs): rent, executive salaries, software subscriptions, marketing, G&A, office overhead.

## Worked example

| Item | Amount |
|---|---|
| Sales Price (Approved Contract Value) | $100,000 |
| Estimated Direct Delivery Costs | $55,000 |
| **Commissionable Gross Profit** | **$45,000** |

Project runs over budget → salesperson is still paid on $45,000.
Project comes in under budget → salesperson is still paid on $45,000.
No arguments. No recalculations. No surprises.

## Contract definition (canonical language)

> **Commissionable Gross Profit ("CGP")** means the estimated gross profit established and approved by MMG Global LLC at the time a customer proposal or statement of work is approved. CGP equals the Approved Contract Value less the Approved Direct Delivery Costs identified in the approved pricing worksheet, where Direct Delivery Costs consist solely of the labor costs of MMG employees and approved subcontractors or freelancers specifically budgeted for that engagement. All other company overhead and operating expenses are excluded. Once approved, the Commissionable Gross Profit shall remain fixed for commission purposes and shall not be adjusted for actual project costs, internal efficiencies, write-offs, scope changes, or project profitability unless the customer contract value is increased or decreased through an approved change order.

## Commission rates — incremental tiers, Named and Approved Accounts only (Bill, 2026-08-03)

- Commissions apply **only to Named and Approved Accounts** — the rep must request an account (or a scoped portion: division, business unit, buying group, or opportunity) in writing, and MMG approves or denies at its sole discretion (contract Exhibit B). **Everything else is non-commissionable by default** — no writing or designation needed from MMG. Rationale: on very large existing accounts (e.g. Brocade) MMG may commission only the group where the rep is actively driving new business (e.g. the marketing department Jeff is selling into), not the whole relationship.
- Rates are **incremental (marginal)** on Gross Profit (= CGP), starting at 25% and capped at 35% (cap reached over $1M), stepping up with cumulative Named-Account revenue in the calendar Plan Year (resets annually):

| Tier | Cumulative Named-Account Revenue | Rate (% of Gross Profit) |
|---|---|---|
| 1 | First $250,000 | 25% |
| 2 | Over $250,000 up to $500,000 | 27.5% |
| 3 | Over $500,000 up to $750,000 | 30% |
| 4 | Over $750,000 up to $1,000,000 | 32.5% |
| 5 | Over $1,000,000 | 35% (cap) |

- Sample full-year payout at 45% gross margin: $28,125 + $30,938 + $33,750 + $36,563 per $250K band = **$129,375 cumulative at $1M revenue**; each additional $250K pays $39,375 (rate capped at 35%). Rates chosen 2026-08-04 (Bill) after market check: at 45% margin this pays ~11–16% of revenue, in line with agency/creative-services benchmarks (10–20% of contract value).
- Tier rate(s) for an engagement lock at pricing-worksheet approval and are stated on the worksheet with the CGP.

## Why this model

- **Trust:** both parties know the commission basis before the client signs.
- **No disputes:** the approved pricing worksheet is the conclusive record.
- **Clean accounting:** commission expense is known at booking, independent of delivery variance.
- **Fair economics:** including subcontractor labor keeps CGP honest on contractor-heavy engagements.

## Related documents

- `MMG — Sales Commission Agreement — v1.html` (branded, signature-ready template, this folder)
- `MMG — Sales Commission Agreement — v1.md` (markdown reference copy)
- Pricing tiers and deal terms: `03 — Pricing and Deal Reference`
