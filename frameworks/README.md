# Framework Rubrics

Standalone JSON rubrics shipped with RubricCoach. Each file fully defines one preset framework — edit these to tune scoring, or copy `_template.json` to build a new one.

## Files

| File | Framework | Criteria | Purpose |
|------|-----------|----------|---------|
| `human-edge-commercial.json` | Human Edge Commercial | 5 | Core sales effectiveness (included with Pro plan) |
| `financial-acumen.json` | Financial Acumen | 4 | ROI, TCO, CFO-language (+$5/mo add-on) |
| `challenger-sale.json` | Challenger Sale | 3 | Teach / Tailor / Take Control (+$5/mo) |
| `meddic.json` | MEDDIC | 6 | Qualification rigor (+$5/mo) |
| `strategic-management.json` | Strategic Management | 4 | Account planning & long-term value (+$5/mo) |
| `_template.json` | — | — | Starter template for building a new framework |

## Schema

```jsonc
{
  "id": "string",                  // URL-safe kebab-case identifier, must be unique
  "name": "string",                // Display name shown in the UI
  "description": "string",         // One-line summary shown on framework cards
  "criteria": [                    // 2–8 criteria recommended
    {
      "id": "string",              // Unique within the framework (e.g. "he-opening")
      "name": "string",            // Short label (e.g. "Opening & Rapport")
      "description": "string",     // What this criterion measures
      "weight_percent": 0-100,     // Weight toward the overall score
      "levels": [                  // Exactly 5 levels, one per score
        { "level": 1, "label": "Poor",          "description": "..." },
        { "level": 2, "label": "Below Average", "description": "..." },
        { "level": 3, "label": "Adequate",      "description": "..." },
        { "level": 4, "label": "Good",          "description": "..." },
        { "level": 5, "label": "Excellent",     "description": "..." }
      ]
    }
  ]
}
```

## Rules

- **Weights must sum to 100** across all criteria in a framework.
- **Every criterion must have all 5 levels** (1 = Poor through 5 = Excellent) — the AI coach scores each criterion on this 1–5 scale.
- **IDs cannot change** once a framework is in use. Changing an ID breaks historical session scores tied to that criterion.
- **Level descriptions are critical** — the AI uses these verbatim to decide what score to assign. Write them concretely. "Asks 3+ open-ended questions" is better than "Asks good questions."

## Editing an existing rubric

1. Open the JSON file for the framework you want to tune.
2. Edit `name`, `description`, `weight_percent`, or any `levels[].description` freely.
3. Keep all `id` fields stable unless you want to invalidate history.
4. Mirror the change into `src/lib/frameworks.ts` — that file is the source of truth the app reads. These JSON files are the human-editable copies.
5. Verify weights still sum to 100.
6. Rebuild and redeploy (`npx next build && npx vercel --prod`).

## Adding a new framework

1. Copy `_template.json` → `your-framework.json`.
2. Fill in `id`, `name`, `description`, and 2–8 criteria with proper weights (must total 100).
3. Add the entry to the `PRESET_FRAMEWORKS` array in `src/lib/frameworks.ts`.
4. Add it to the `PRESET_FRAMEWORKS` list at the top of `src/app/dashboard/roleplay/page.tsx` (this is the tag/price metadata shown on the setup screen).
5. Rebuild and redeploy.

## Future: Hot-load from JSON

Right now `src/lib/frameworks.ts` hardcodes these in TypeScript. If you want to load them from these JSON files directly (so you can edit without touching code), the change is small — import them with `import humanEdge from "../../frameworks/human-edge-commercial.json"` at the top of `frameworks.ts` and drop them into the array. Say the word and I'll wire that up.
