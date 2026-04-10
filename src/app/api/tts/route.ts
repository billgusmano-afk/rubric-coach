import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Text-to-Speech via ElevenLabs API.
 * Requires ELEVENLABS_API_KEY in environment.
 *
 * DISC-matched voices:
 *   D (Dominant)      → "Adam" (deep, authoritative)
 *   I (Influential)   → "Josh" (warm, energetic)
 *   S (Steady)        → "Sam"  (calm, measured)
 *   C (Conscientious) → "Antoni" (precise, analytical)
 */

const DISC_VOICES: Record<string, string> = {
  D: "pNInz6obpgDQGcFmaJgB", // Adam
  I: "TxGEqnHWrfWFTfGW9XjX", // Josh
  S: "yoZ06aMxZJJ28mfd3POQ", // Sam
  C: "ErXwobaYiN019PkySvjV", // Antoni
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 503 });
  }

  const { text, disc_profile = "D" } = await request.json();

  if (!text || text.length === 0) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  // Cap text length for cost control
  const cappedText = text.substring(0, 1000);
  const voiceId = DISC_VOICES[disc_profile] || DISC_VOICES["D"];

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: cappedText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("ElevenLabs error:", err);
      return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
