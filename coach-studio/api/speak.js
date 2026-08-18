// Vercel serverless function — ElevenLabs TTS proxy for the MMG AI Coach studio.
// Speaks replies in Bill Gusmano's cloned voice. Key lives ONLY in Vercel env.
// Gated by the same access code as the coach; text capped to bound cost.

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "kILtWjoevQ0yHVte7Gh4"; // "Bill Gusmano" (cloned)
const ACCESS_CODE = process.env.COACH_ACCESS_CODE || "MMG2026";
const MAX_TTS_CHARS = 1400;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const { text, code } = body || {};

  if (!code || code.trim().toUpperCase() !== ACCESS_CODE.toUpperCase()) {
    res.status(403).json({ error: "invalid_code" }); return;
  }
  if (!text || typeof text !== "string") { res.status(400).json({ error: "no_text" }); return; }

  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.elevenlabs_api_key;
  if (!apiKey) { res.status(500).json({ error: "not_configured" }); return; }

  // Say "AI" as "A.I." for correct letter pronunciation; strip markdown noise.
  const speakable = text
    .replace(/\*\*?/g, "")
    .replace(/#+\s*/g, "")
    .replace(/\bAI\b/g, "A.I.")
    .slice(0, MAX_TTS_CHARS);

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_96`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        text: speakable,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: "tts_upstream", status: r.status, detail: detail.slice(0, 300) });
      return;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.status(200)
      .setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.end(buf);
  } catch (e) {
    res.status(500).json({ error: "server_error", detail: String(e).slice(0, 200) });
  }
};
