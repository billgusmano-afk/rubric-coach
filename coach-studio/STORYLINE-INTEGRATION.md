# Adding the AI Role-Play to a Storyline module (for Paul)

Two delivery models — same hosted studio, pick per customer:

## A) Inside a Storyline course (Web Object)
1. In Storyline: **Insert → Web Object**, address:
   `https://mmg-coach-studio.vercel.app/?embed=1&mode=roleplay&scenario=generic&method=consultative&code=MMG2026`
   - `scenario=` swaps the customer persona (currently `generic` or `partner-economics`; we add one per client).
   - `embed=1` strips the MMG header/footer and skips the access-code screen.
2. Display: "in slide", size it to fill the slide. Publish. Voice replies + the lip-synced avatar work inside the embed; the 🎤 mic button may be blocked by the LMS iframe — typing always works.
3. **Optional score gating** — the studio posts scores to the parent window. Add a slide trigger *Execute JavaScript* (on timeline start):
```js
window.addEventListener("message", function(e){
  var d = e.data || {};
  if(d.source !== "mmg-coach-studio") return;
  var p = GetPlayer();
  if(d.event === "score"){ p.SetVar("RP_Exchanges", d.exchanges); }
  if(d.event === "finished"){
    p.SetVar("RP_Overall", Math.round(d.overall/5*100)); // 0-100
    p.SetVar("RP_Done", true);
  }
});
```
   Create Storyline variables `RP_Done` (T/F), `RP_Overall` (number), `RP_Exchanges` (number). Gate the Next button on `RP_Done = True`, show `%RP_Overall%` on a results slide.

## B) Standalone on the customer's LMS (SCORM zip)
`scorm-wrapper/` is a SCORM 1.2 package: zip its CONTENTS (imsmanifest.xml at zip root) and upload to any LMS. It launches the hosted studio full-screen and reports:
- `cmi.core.score.raw` = overall rubric average mapped to 0–100 (updates live, final on Finish)
- `lesson_status` = passed (≥60) / completed / incomplete
Per client: edit `STUDIO_URL` (scenario + their access code) and `PASS_PERCENT` at the top of `index_lms.html`, re-zip.
Requires internet access from the learner's browser (the AI runs on our server — keys never ship in the zip).

## Notes
- Turn cap / access code are set per deployment (Vercel env) — client installs get their own code.
- xAPI/SCORM 2004 wrapper: same pattern, ~a day if a customer requires it.
