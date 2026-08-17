# Coach Studio → RubricCoach integration notes

This folder is the complete, working **MMG AI Coach & Role-Play Studio** (imported 2026-08-17 from `Role Play Saas/mmg-coach-studio`, live at https://mmg-coach-studio.vercel.app, access code MMG2026). It runs standalone — it is NOT yet wired into the RubricCoach Next.js app.

## What's here
- `index.html` — full studio UI (vanilla JS, no build step): gate, coach + role-play modes, 5 sales methods, live 4-dim rubric, speech-to-text, plan upload, printable scorecard, lip-synced SVG avatar, HeyGen live-avatar toggle, embed mode + postMessage score bridge.
- `api/coach.js` — Anthropic proxy (claude-opus-5 → haiku fallback, retry, roleplay JSON-schema scoring, SCENARIOS config block, access code + turn cap).
- `api/speak.js` — ElevenLabs TTS proxy (Bill's cloned voice).
- `api/heygen-token.js` — HeyGen streaming-session token minting (photoreal avatar).
- `demo.html` — scripted self-playing demo reel (LinkedIn); no API needed.
- `scorm-wrapper/` — SCORM 1.2 package that iframes the hosted studio and reports score/completion to any LMS.
- `STORYLINE-INTEGRATION.md` — Web Object embed + Storyline JS trigger recipe.

## Porting into the Next.js app
- The three `api/*.js` files are plain Vercel functions — port to `src/app/api/*/route.ts` handlers nearly 1:1 (they only use fetch + env vars).
- Env vars: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `HEYGEN_API_KEY`, optional `COACH_ACCESS_CODE` / `COACH_MODEL` / `COACH_MAX_TURNS` / `ELEVENLABS_VOICE_ID`. Never client-side.
- The rubric scoring pattern (per-turn 1–5 JSON schema + session averages + trend + manager narrative) is the piece most relevant to RubricCoach's core product.
- Per-client reskin = the two mirrored `SCENARIOS` blocks (api/coach.js + index.html) — in RubricCoach these should become DB/config-driven rather than code blocks.
