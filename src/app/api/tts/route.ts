import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Text-to-Speech via ElevenLabs API.
 * Requires ELEVENLABS_API_KEY in environment.
 *
 * DISC-matched voices (using ElevenLabs pre-made voices):
 *   D (Dominant)      → "Brian" (deep, authoritative male)
 *   I (Influential)   → "Jessica" (warm, energetic female)
 *   S (Steady)        → "Chris" (calm, measured male)
 *   C (Conscientious) → "Laura" (precise, clear female)
 */

const DISC_VOICES: Record<string, string> = {
  D: "nPczCjzI2devNBz1zQrb", // Brian
  I: "cgSgspJ2msm6clMCkdW9", // Jessica
  S: "iP95p4xoKVk53GoZ742B", // Chris
  C: "FGY2WhTYpPnrIDTdsKH5", // Laura
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
    console.error("TTS: ELEVENLABS_API_KEY not set");
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
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("ElevenLabs error:", response.status, err);

      // If voice not found, try with a known default voice
      if (response.status === 404 || err.includes("voice_not_found")) {
        const fallbackResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: cappedText,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
            }),
          }
        );

        if (fallbackResponse.ok) {
          const audioBuffer = await fallbackResponse.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": audioBuffer.byteLength.toString(),
            },
          });
        }
      }

      return NextResponse.json({ error: `TTS failed: ${err}` }, { status: 500 });
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
