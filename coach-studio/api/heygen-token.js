// Vercel serverless function — mints a short-lived HeyGen streaming-session
// token for the live avatar. HEYGEN_API_KEY lives ONLY in Vercel env vars.
// Gated by the same access code as the coach.

const ACCESS_CODE = process.env.COACH_ACCESS_CODE || "MMG2026";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const { code } = body || {};

  if (!code || code.trim().toUpperCase() !== ACCESS_CODE.toUpperCase()) {
    res.status(403).json({ error: "invalid_code" }); return;
  }

  const apiKey = process.env.HEYGEN_API_KEY || process.env.heygen_api_key;
  if (!apiKey) { res.status(500).json({ error: "not_configured" }); return; }

  try {
    const r = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: { "x-api-key": apiKey, "content-type": "application/json" },
      body: "{}",
    });
    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: "heygen_upstream", status: r.status, detail: detail.slice(0, 300) });
      return;
    }
    const data = await r.json();
    const token = data && data.data && data.data.token;
    if (!token) { res.status(502).json({ error: "no_token" }); return; }
    res.status(200).json({ token });
  } catch (e) {
    res.status(500).json({ error: "server_error", detail: String(e).slice(0, 200) });
  }
};
