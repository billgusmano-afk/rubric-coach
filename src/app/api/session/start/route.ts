import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/* ── DISC persona instructions ── */
const DISC_INSTRUCTIONS: Record<string, string> = {
  D: `You have a DOMINANT personality (DISC: D).
- You are direct, impatient, and results-focused.
- You cut through small talk quickly and want bottom-line answers.
- You challenge weak statements and demand specifics.
- You respect confidence and push back on vagueness.
- Your time is valuable — you'll end the meeting early if unimpressed.`,

  I: `You have an INFLUENTIAL personality (DISC: I).
- You are enthusiastic, talkative, and relationship-oriented.
- You love stories, case studies, and big-picture vision.
- You're optimistic but can be distracted — tangents are natural.
- You want to feel excited and connected to the person selling.
- You may commit verbally but need to be pinned down on specifics.`,

  S: `You have a STEADY personality (DISC: S).
- You are patient, risk-averse, and value stability.
- You ask about implementation, support, and transition plans.
- You're uncomfortable with pressure and need reassurance.
- You prefer gradual change and want to see proof before committing.
- You'll defer decisions to get team buy-in first.`,

  C: `You have a CONSCIENTIOUS personality (DISC: C).
- You are analytical, detail-oriented, and skeptical.
- You want data, methodology, and technical specifics.
- You'll probe for weaknesses and inconsistencies.
- You distrust hype and prefer understatement over overselling.
- You need time to analyze before making any decision.`,
};

function getDiscInstructions(profile: string, blend: string): string {
  if (blend === "single" || !blend) {
    return DISC_INSTRUCTIONS[profile] || DISC_INSTRUCTIONS["D"];
  }
  const [primary, secondary] = blend.split("-");
  return `${DISC_INSTRUCTIONS[primary] || ""}\n\nYou also have secondary ${secondary} traits:\n${DISC_INSTRUCTIONS[secondary] || ""}`;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    company_name,
    client_contact,
    partner_name,
    partner_role,
    partner_solution,
    relationship_stage,
    meeting_type,
    proposal,
    objective,
    expected_objection,
    disc_profile = "D",
    disc_blend = "single",
    framework_ids,
    company_research,
    document_context,
    voice_enabled,
    mic_enabled,
  } = body;

  // Separate preset framework IDs (strings) from DB framework IDs (UUIDs)
  const presetIds = ["human-edge", "financial-acumen", "challenger-sale", "meddic", "strategic-mgmt"];
  const allFrameworkIds = framework_ids || [];
  const dbFrameworkIds = allFrameworkIds.filter((id: string) => !presetIds.includes(id));

  // Create the session record — only store real UUIDs in the uuid[] column
  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      company_name,
      client_contact,
      partner_name,
      partner_role,
      partner_solution,
      relationship_stage,
      meeting_type: meeting_type,
      proposal,
      objective,
      expected_objection,
      disc_profile,
      disc_blend,
      framework_ids: dbFrameworkIds,
      document_context,
      voice_enabled: voice_enabled ?? true,
      mic_enabled: mic_enabled ?? false,
      scenario_type: meeting_type, // backward compat
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build the AI client persona system prompt
  const contactName = client_contact || "the client executive";
  const discInstructions = getDiscInstructions(disc_profile, disc_blend);

  let companyContext = "";
  if (company_research) {
    companyContext = `
Company: ${company_research.company_name || company_name}
Revenue: ${company_research.revenue || "Unknown"}
Industry: ${company_research.industry || "Unknown"}
Pain Points: ${company_research.pain_points || "General business challenges"}
Recent News: ${company_research.recent_news || "None available"}`;
  }

  let scenarioContext = "";
  if (relationship_stage) scenarioContext += `\nRelationship stage: ${relationship_stage}`;
  if (proposal) scenarioContext += `\nThe rep is proposing: ${proposal}`;
  if (objective) scenarioContext += `\nThe rep's goal: ${objective} (you don't know this — make them work for it)`;
  if (expected_objection) scenarioContext += `\nYou should naturally raise this objection: ${expected_objection}`;

  let partnerContext = "";
  if (partner_name) {
    partnerContext = `\nThe rep may be accompanied by their partner ${partner_name}${partner_role ? ` (${partner_role})` : ""}${partner_solution ? ` from ${partner_solution}` : ""}.`;
  }

  let docContext = "";
  if (document_context) {
    docContext = `\nDocument context provided by the rep's preparation materials:\n${document_context}`;
  }

  const systemPrompt = `You are playing the role of ${contactName} at ${company_name}. You are in a ${meeting_type || "sales"} meeting with a sales representative.

${discInstructions}
${companyContext}
${scenarioContext}
${partnerContext}
${docContext}

INSTRUCTIONS FOR YOUR CHARACTER:
- Stay in character throughout the entire conversation
- Be realistic — have genuine concerns, priorities, and time pressure
- Push back naturally on vague claims or generic pitches
- Don't make it too easy — ask tough questions, express skepticism when appropriate
- Reference your company's specific situation, budget constraints, and priorities
- If the rep asks good questions, reward them with useful information
- If the rep jumps to pitching too early, be visibly less engaged
- Keep responses conversational and natural (2-4 sentences typically)
- Never break character or mention that this is a roleplay

Start by greeting the sales rep and setting the tone for a ${meeting_type || "meeting"}.`;

  // Generate opening message
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: "The sales rep has just joined the call. Give your opening line as the client.",
        },
      ],
    });

    const content = message.content[0];
    const openingMessage =
      content.type === "text" ? content.text : "Hello, thanks for joining. What did you want to discuss?";

    // Save the opening message
    await supabase.from("session_messages").insert({
      session_id: session.id,
      role: "assistant",
      content: openingMessage,
    });

    return NextResponse.json({
      session_id: session.id,
      opening_message: openingMessage,
      system_prompt: systemPrompt,
    });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({
      session_id: session.id,
      opening_message: `Hi, I'm ${contactName} from ${company_name}. I have about 20 minutes — what did you want to discuss?`,
      system_prompt: systemPrompt,
    });
  }
}
