# MMG AI Coach & Role-Play Studio

MMG's own client-agnostic coaching/role-play demo (RubricCoach / AI Sales Agent product line). Forked from the Spectro Cloud academy coach — the Spectro deployment is untouched.

## What it does
- **Ask the Coach** — grounded sales-coaching chat.
- **Role-Play a Customer** — AI plays a skeptical buyer, scores every learner message 1–5 on a 4-dimension rubric (discovery / acumen / value / method), live coaching tips, printable manager-ready scorecard.
- Speaking **avatar** lip-synced to ElevenLabs voice replies (Bill's cloned voice), 🎤 speech-to-text, 📎 plan upload, sales-method selector, scenario selector.

## Reskinning per client
Two mirrored `SCENARIOS` blocks — edit both, keys must match:
1. `api/coach.js` — persona, grounding, coach identity (what the model sees).
2. `index.html` (top of the `<script>`) — labels, greetings, starters, persona name/initials, instructions (what the user sees).

Brand tokens live in `:root` in `index.html`. Default scenario is `generic` (sell-your-own-solution); `partner-economics` ships as a second example.

## Deploy (Vercel — NEW project `mmg-coach-studio`)
Env vars (Bill adds these in Vercel — never in code or chat):
- `ANTHROPIC_API_KEY` (fallbacks honored: `spectro_academy_demo`, `SPECTRO_ACADEMY_DEMO`)
- `ELEVENLABS_API_KEY` (fallback `elevenlabs_api_key`)
- Optional: `COACH_ACCESS_CODE` (default **MMG2026**), `COACH_MODEL` (default claude-opus-5), `COACH_MAX_TURNS` (default 8), `ELEVENLABS_VOICE_ID` (default Bill's clone)

## Guardrails
Access code gate + 8-turn cap + TTS char cap. Keys server-side only.

## Gate before public use
Per MMG production loop: **Paul & Tracy visual sign-off required** before this goes into any public or marketing use.
