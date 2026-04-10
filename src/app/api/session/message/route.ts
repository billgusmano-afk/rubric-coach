import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPresetCriteria } from "@/lib/frameworks";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { session_id, message, system_prompt, framework_ids } = body;

  // Save user message
  await supabase.from("session_messages").insert({
    session_id,
    role: "user",
    content: message,
  });

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

  // Run both AI calls in parallel
  const [clientResponse, coachResponse] = await Promise.all([
    // 1. AI Client persona response
    anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: system_prompt,
      messages: conversationHistory,
    }),

    // 2. AI Coach scoring + nudge
    anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `You are an expert sales coach scoring a live roleplay session.

Here is the conversation so far:
${conversationHistory.map((m) => `${m.role === "user" ? "SALES REP" : "CLIENT"}: ${m.content}`).join("\n\n")}

Score the sales rep's LATEST message against these criteria (1-5 scale):
${allCriteria.map((c) => `- ${c.name} [id: ${c.id}] (${c.weight_percent}%): ${c.description}`).join("\n")}

Return a JSON object with:
{
  "scores": [
    { "criterion_id": "<id>", "criterion_name": "<name>", "score": <1-5>, "feedback": "<brief feedback>" }
  ],
  "nudge": "<one short coaching tip for the rep's next response, 1-2 sentences>",
  "overall_score": <weighted average 1-100>
}

Return ONLY the JSON object.`,
        },
      ],
    }),
  ]);

  // Extract client response
  const clientContent = clientResponse.content[0];
  const aiResponse = clientContent.type === "text" ? clientContent.text : "I see. Tell me more.";

  // Save AI response
  await supabase.from("session_messages").insert({
    session_id,
    role: "assistant",
    content: aiResponse,
  });

  // Extract coaching data
  let scores: { criterion_id: string; criterion_name: string; score: number; feedback: string }[] = [];
  let nudge = "";
  let overallScore = 0;

  try {
    const coachContent = coachResponse.content[0];
    if (coachContent.type === "text") {
      const jsonMatch = coachContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        scores = parsed.scores || [];
        nudge = parsed.nudge || "";
        overallScore = parsed.overall_score || 0;
      }
    }
  } catch {
    nudge = "Keep asking open-ended questions to uncover the client's real priorities.";
  }

  return NextResponse.json({
    ai_response: aiResponse,
    scores,
    nudge,
    overall_score: overallScore,
  });
}
