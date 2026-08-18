import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPresetCriteria } from "@/lib/frameworks";
import { MMG_FRAME, MMG_SCORING_INSTRUCTIONS, deriveQuadrant } from "@/lib/mmg-frame";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Structured-outputs schema for the coach call. Integer ranges use enum arrays
// — structured outputs does NOT support minimum/maximum — so the model can
// never emit a stray 7 that skews averages. (overall_score is unbounded here
// and clamped server-side.)
const COACH_SCHEMA = {
  type: "object",
  properties: {
    scores: {
      type: "array",
      description: "One entry per rubric criterion, scoring the rep's latest message",
      items: {
        type: "object",
        properties: {
          criterion_id: { type: "string" },
          criterion_name: { type: "string" },
          score: { type: "integer", enum: [1, 2, 3, 4, 5] },
          feedback: { type: "string", description: "Brief feedback for this criterion" },
        },
        required: ["criterion_id", "criterion_name", "score", "feedback"],
        additionalProperties: false,
      },
    },
    nudge: { type: "string", description: "One short coaching tip for the rep's next response, 1-2 sentences" },
    overall_score: { type: "integer", description: "Weighted average of the criterion scores, 1-100" },
    rigor: { type: "integer", enum: [1, 2, 3, 4, 5, 6], description: "Daggett knowledge taxonomy" },
    relevance: { type: "integer", enum: [1, 2, 3, 4, 5], description: "Daggett application model" },
    quadrant: { type: "string", enum: ["A", "B", "C", "D"] },
    quadrant_why: { type: "string", description: "Short clause explaining the rigor/relevance placement, max 15 words" },
    acumen: { type: "integer", enum: [1, 2, 3, 4, 5] },
    self_orientation: { type: "integer", enum: [1, 2, 3, 4, 5] },
  },
  required: [
    "scores", "nudge", "overall_score",
    "rigor", "relevance", "quadrant", "quadrant_why", "acumen", "self_orientation",
  ],
  additionalProperties: false,
} as const;

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { session_id, message } = body;

  // Load the session server-side — the persona system prompt and framework
  // selection come from the DB, never from the client (tamper-proof).
  const { data: session } = await supabase
    .from("sessions")
    .select("id, system_prompt, framework_ids, preset_framework_ids, ended_at")
    .eq("id", session_id)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.ended_at) {
    return NextResponse.json({ error: "Session has ended" }, { status: 400 });
  }

  const system_prompt = session.system_prompt || "";
  const framework_ids = [
    ...(session.preset_framework_ids || []),
    ...(session.framework_ids || []),
  ];

  // Save user message — keep the row id so the coach's quadrant scores can be
  // written back onto it (the scoring evaluates this user message).
  const { data: userMsgRow } = await supabase
    .from("session_messages")
    .insert({
      session_id,
      role: "user",
      content: message,
    })
    .select("id")
    .single();

  // Get conversation history
  const { data: messages } = await supabase
    .from("session_messages")
    .select("role, content")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });

  const conversationHistory = (messages || []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Get criteria for scoring — combine preset + custom DB frameworks
  const presetIds = ["human-edge", "financial-acumen", "challenger-sale", "meddic", "strategic-mgmt"];
  const selectedPresetIds = (framework_ids || []).filter((id: string) => presetIds.includes(id));
  const selectedDbIds = (framework_ids || []).filter((id: string) => !presetIds.includes(id));

  // Get preset criteria
  const presetCriteria = getPresetCriteria(selectedPresetIds).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    weight_percent: c.weight_percent,
  }));

  // Get DB criteria
  let dbCriteria: { id: string; name: string; description: string; weight_percent: number }[] = [];
  if (selectedDbIds.length > 0) {
    const { data: criteria } = await supabase
      .from("criteria")
      .select("id, name, description, weight_percent, framework_id")
      .in("framework_id", selectedDbIds);
    dbCriteria = (criteria || []).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      weight_percent: c.weight_percent,
    }));
  }

  const allCriteria = [...presetCriteria, ...dbCriteria];

  // Run both AI calls in parallel.
  // claude-sonnet-5 thinks by default and max_tokens caps thinking + output
  // together, so both calls need generous headroom (>= 4000).
  const [clientResponse, coachResponse] = await Promise.all([
    // 1. AI Client persona response
    anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      system: system_prompt,
      messages: conversationHistory,
    }),

    // 2. AI Coach scoring + nudge — structured outputs guarantee valid JSON
    anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 6000,
      output_config: {
        format: {
          type: "json_schema",
          schema: COACH_SCHEMA as unknown as { [key: string]: unknown },
        },
      },
      messages: [
        {
          role: "user",
          content: `You are an expert sales coach scoring a live roleplay session.

${MMG_FRAME}

Here is the conversation so far:
${conversationHistory.map((m) => `${m.role === "user" ? "SALES REP" : "CLIENT"}: ${m.content}`).join("\n\n")}

Score the sales rep's LATEST message against these criteria (1-5 scale):
${allCriteria.map((c) => `- ${c.name} [id: ${c.id}] (${c.weight_percent}%): ${c.description}`).join("\n")}

${MMG_SCORING_INSTRUCTIONS}

For each criterion return criterion_id, criterion_name, score (1-5), and brief feedback. Also return nudge (one short coaching tip for the rep's next response, 1-2 sentences) and overall_score (weighted average of the criterion scores, 1-100).`,
        },
      ],
    }),
  ]);

  // Extract client response — with thinking enabled, the text block may not be
  // the first content block.
  const clientContent = clientResponse.content.find((b) => b.type === "text");
  const aiResponse = clientContent?.type === "text" ? clientContent.text : "I see. Tell me more.";

  // Save AI response
  await supabase.from("session_messages").insert({
    session_id,
    role: "assistant",
    content: aiResponse,
  });

  // Extract coaching data — structured outputs guarantee the text block is
  // valid JSON matching COACH_SCHEMA, so no regex extraction is needed.
  let scores: { criterion_id: string; criterion_name: string; score: number; feedback: string }[] = [];
  let nudge = "";
  let overallScore = 0;
  let rigor: number | null = null;
  let relevance: number | null = null;
  let quadrant: string | null = null;
  let quadrantWhy: string | null = null;
  let acumen: number | null = null;
  let selfOrientation: number | null = null;

  try {
    const coachContent = coachResponse.content.find((b) => b.type === "text");
    if (coachContent?.type === "text") {
      const parsed = JSON.parse(coachContent.text);
      scores = parsed.scores || [];
      nudge = parsed.nudge || "";
      overallScore = Math.max(0, Math.min(100, Number(parsed.overall_score) || 0));

      // MMG Quadrant D dimensions. The schema's enums keep values in range;
      // clamp anyway and derive the quadrant from the axes so a stray label
      // can never disagree with the plotted position.
      rigor = Math.max(1, Math.min(6, Number(parsed.rigor) || 1));
      relevance = Math.max(1, Math.min(5, Number(parsed.relevance) || 1));
      const derived = deriveQuadrant(rigor, relevance);
      quadrant = ["A", "B", "C", "D"].includes(parsed.quadrant) ? parsed.quadrant : derived;
      quadrantWhy = typeof parsed.quadrant_why === "string" ? parsed.quadrant_why : null;
      acumen = Math.max(1, Math.min(5, Number(parsed.acumen) || 1));
      selfOrientation = Math.max(1, Math.min(5, Number(parsed.self_orientation) || 1));
    }
  } catch {
    nudge = "Keep asking open-ended questions to uncover the client's real priorities.";
  }

  // Persist the quadrant scores onto the user message they evaluate
  if (userMsgRow?.id && rigor !== null) {
    await supabase
      .from("session_messages")
      .update({
        rigor,
        relevance,
        quadrant,
        quadrant_why: quadrantWhy,
        acumen,
        self_orientation: selfOrientation,
      })
      .eq("id", userMsgRow.id);
  }

  return NextResponse.json({
    ai_response: aiResponse,
    scores,
    nudge,
    overall_score: overallScore,
    rigor,
    relevance,
    quadrant,
    quadrant_why: quadrantWhy,
    acumen,
    self_orientation: selfOrientation,
  });
}
