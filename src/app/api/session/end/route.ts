import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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
  const { session_id, duration_seconds, final_scores, framework_ids } = body;

  // Get conversation history
  const { data: messages } = await supabase
    .from("session_messages")
    .select("role, content")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });

  // Get criteria
  let criteriaList: { id: string; name: string; weight_percent: number }[] = [];
  if (framework_ids && framework_ids.length > 0) {
    const { data: criteria } = await supabase
      .from("criteria")
      .select("id, name, weight_percent")
      .in("framework_id", framework_ids);
    criteriaList = criteria || [];
  }

  // Compute weighted average from final scores
  let overallScore = 0;
  if (final_scores && final_scores.length > 0 && criteriaList.length > 0) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const fs of final_scores) {
      const criterion = criteriaList.find((c) => c.id === fs.criterion_id);
      const weight = criterion?.weight_percent || 0;
      // Convert 1-5 score to 0-100 scale
      weightedSum += ((fs.score - 1) / 4) * 100 * (weight / 100);
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      overallScore = Math.round(weightedSum / (totalWeight / 100));
    }

    // Save session scores
    for (const fs of final_scores) {
      await supabase.from("session_scores").insert({
        session_id,
        criterion_id: fs.criterion_id,
        score: fs.score,
        ai_feedback: fs.feedback || null,
      });
    }
  }

  // Update session with duration and score
  await supabase
    .from("sessions")
    .update({
      duration_seconds: duration_seconds || 0,
      overall_score: overallScore,
    })
    .eq("id", session_id);

  // Generate AI coach summary
  let summary = "";
  try {
    const conversationText = (messages || [])
      .map((m) => `${m.role === "user" ? "SALES REP" : "CLIENT"}: ${m.content}`)
      .join("\n\n");

    const summaryResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are an expert sales coach. Summarize this roleplay session in one paragraph (3-5 sentences). Highlight what the rep did well, what they should improve, and one specific action item for their next session.

Conversation:
${conversationText}

Overall Score: ${overallScore}/100`,
        },
      ],
    });

    const content = summaryResponse.content[0];
    summary = content.type === "text" ? content.text : "";
  } catch {
    summary = "Session complete. Review your scores above for detailed feedback on each criterion.";
  }

  return NextResponse.json({
    overall_score: overallScore,
    summary,
  });
}
