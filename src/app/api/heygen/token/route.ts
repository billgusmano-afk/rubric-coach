import { NextResponse } from "next/server";

/**
 * POST /api/heygen/token
 * Creates a LiveAvatar session token (LITE mode — we supply our own AI/TTS).
 * Uses the new liveavatar.com API (HeyGen streaming.* was sunset March 2026).
 */
export async function POST() {
  const apiKey = process.env.HEYGEN_API_KEY;
  const avatarId = process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID;

  if (!apiKey) {
    return NextResponse.json({ error: "HeyGen API key not configured" }, { status: 500 });
  }
  if (!avatarId) {
    return NextResponse.json({ error: "HeyGen avatar ID not configured" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "LITE",          // LITE = we handle AI/TTS; avatar handles video stream
        avatar_id: avatarId,
        is_sandbox: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("LiveAvatar token error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to create LiveAvatar token", status: res.status, body: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    const token = data?.data?.session_token;

    if (!token) {
      return NextResponse.json({ error: "No session_token in response", raw: data }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    console.error("LiveAvatar token fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
