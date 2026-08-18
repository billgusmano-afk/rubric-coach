import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPresetCriteria, PRESET_FRAMEWORKS } from "@/lib/frameworks";

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
  const { session_id, duration_seconds, final_scores } = body;

  // Load the session server-side and verify ownership — never trust
  // session_id/framework_ids from the client (tamper-proof, same pattern
  // as src/app/api/session/message/route.ts). Also guard against a
  // client re-submitting /end on an already-finished session, which would
  // re-insert duplicate scores and let arbitrary final_scores inflate the
  // record.
  const { data: session } = await supabase
    .from("sessions")
    .select("id, framework_ids, preset_framework_ids, ended_at")
    .eq("id", session_id)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.ended_at) {
    return NextResponse.json({ error: "Session has already ended" }, { status: 400 });
  }

  const framework_ids = [
    ...(session.preset_framework_ids || []),
    ...(session.framework_ids || []),
  ];

  // Get conversation history
  const { data: messages } = await supabase
    .from("session_messages")
    .select("role, content")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });

  // Gather all criteria — preset + DB
  const presetIds = ["human-edge", "financial-acumen", "challenger-sale", "meddic", "strategic-mgmt"];
  const selectedPresetIds = (framework_ids || []).filter((id: string) => presetIds.includes(id));
  const selectedDbIds = (framework_ids || []).filter((id: string) => !presetIds.includes(id));

  const presetCriteriaList = getPresetCriteria(selectedPresetIds).map((c) => ({
    id: c.id,
    name: c.name,
    weight_percent: c.weight_percent,
  }));

  let dbCriteriaList: { id: string; name: string; weight_percent: number }[] = [];
  if (selectedDbIds.length > 0) {
    const { data: criteria } = await supabase
      .from("criteria")
      .select("id, name, weight_percent")
      .in("framework_id", selectedDbIds);
    dbCriteriaList = (criteria || []).map((c) => ({
      id: c.id,
      name: c.name,
      weight_percent: c.weight_percent,
    }));
  }

  const allCriteria = [...presetCriteriaList, ...dbCriteriaList];

  // Compute weighted average from final scores
  let overallScore = 0;
  if (final_scores && final_scores.length > 0 && allCriteria.length > 0) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const fs of final_scores) {
      const criterion = allCriteria.find((c) => c.id === fs.criterion_id);
      const weight = criterion?.weight_percent || 0;
      weightedSum += ((fs.score - 1) / 4) * 100 * (weight / 100);
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      overallScore = Math.round(weightedSum / (totalWeight / 100));
    }

    // Save session scores for BOTH kinds of criteria.
    // Preset criteria have no rows in public.criteria, so persist their
    // identity/name/weight inline (see migration 005_preset_scores.sql).
    const criterionToFramework = new Map<string, string>();
    for (const fw of PRESET_FRAMEWORKS) {
      for (const c of fw.criteria) criterionToFramework.set(c.id, fw.id);
    }

    const rows: {
      session_id: string;
      criterion_id: string | null;
      preset_framework_id: string | null;
      preset_criterion_id: string | null;
      preset_criterion_name: string | null;
      weight_percent: number | null;
      score: number;
      ai_feedback: string | null;
    }[] = [];

    for (const fs of final_scores as { criterion_id: string; score: number; feedback?: string }[]) {
      const preset = presetCriteriaList.find((c) => c.id === fs.criterion_id);
      if (preset) {
        rows.push({
          session_id,
          criterion_id: null,
          preset_framework_id: criterionToFramework.get(preset.id) ?? null,
          preset_criterion_id: preset.id,
          preset_criterion_name: preset.name,
          weight_percent: preset.weight_percent,
          score: fs.score,
          ai_feedback: fs.feedback || null,
        });
        continue;
      }

      const dbCriterion = dbCriteriaList.find((c) => c.id === fs.criterion_id);
      if (dbCriterion) {
        rows.push({
          session_id,
          criterion_id: fs.criterion_id,
          preset_framework_id: null,
          preset_criterion_id: null,
          preset_criterion_name: null,
          weight_percent: dbCriterion.weight_percent ?? null,
          score: fs.score,
          ai_feedback: fs.feedback || null,
        });
        continue;
      }

      // Score entry doesn't match a known DB criterion or preset criterion
      // (e.g. client sent an inconsistent framework_id). Skip it instead of
      // inserting a raw string into the uuid criterion_id column, which
      // would throw a Postgres cast error and reject the entire batch.
      console.error(
        `session/end: score entry for unknown criterion_id "${fs.criterion_id}" on session ${session_id} — skipping`
      );
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("session_scores").insert(rows);
      if (insertError) {
        console.error(`session/end: failed to insert session_scores for session ${session_id}:`, insertError);
        return NextResponse.json(
          { error: "Failed to save session scores", details: insertError.message },
          { status: 500 }
        );
      }
    }
  }

  // Update session with duration, score, and end timestamp.
  // (Summary is persisted after generation below so the history page can render it.)
  await supabase
    .from("sessions")
    .update({
      duration_seconds: duration_seconds || 0,
      overall_score: overallScore,
      ended_at: new Date().toISOString(),
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

  // Persist the summary so the history detail page can render it later
  await supabase
    .from("sessions")
    .update({ summary })
    .eq("id", session_id);

  return NextResponse.json({
    overall_score: overallScore,
    summary,
  });
}
