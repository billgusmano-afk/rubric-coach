import { NextResponse } from "next/server";

/**
 * POST /api/heygen/token
 * Generates a short-lived HeyGen streaming token server-side so the API key
 * is never exposed to the browser.
 */
export async function POST() {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "HeyGen API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("HeyGen token error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to create HeyGen token", heygen_status: res.status, heygen_body: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    const token = data?.data?.token;

    if (!token) {
      return NextResponse.json({ error: "No token in HeyGen response" }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    console.error("HeyGen token fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
