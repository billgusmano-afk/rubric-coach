import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/tts-pcm
 * Returns raw PCM 24kHz 16-bit signed mono audio from ElevenLabs.
 * Used by the HeyGen LiveAvatar SDK — repeatAudio() requires PCM 24kHz base64.
 *
 * DISC-matched voices (same as /api/tts):
 *   D → Brian | I → Jessica | S → Chris | C → Laura
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
    return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 503 });
  }

  const { text, disc_profile = "D" } = await request.json();
  if (!text || text.length === 0) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const cappedText = text.substring(0, 1000);
  const voiceId = DISC_VOICES[disc_profile] || DISC_VOICES["D"];

  // ElevenLabs pcm_24000 = raw 16-bit signed little-endian PCM at 24kHz
  // This is exactly what HeyGen LiveAvatar repeatAudio() expects (after base64 encoding)
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_24000`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg", // ElevenLabs ignores Accept when output_format is set
      },
      body: JSON.stringify({
        text: cappedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("ElevenLabs PCM error:", response.status, err);
      return NextResponse.json({ error: `TTS PCM failed: ${err}` }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/pcm",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("TTS PCM error:", error);
    return NextResponse.json({ error: "TTS PCM generation failed" }, { status: 500 });
  }
}
