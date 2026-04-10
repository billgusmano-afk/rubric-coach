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
  const {
    company_name,
    client_contact,
    scenario_type,
    framework_ids,
    company_research,
  } = body;

  // Create the session record
  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      company_name,
      client_contact,
      scenario_type,
      framework_ids: framework_ids || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build the AI client persona system prompt
  const contactName = client_contact?.split("—")?.[1]?.trim() || client_contact || "the client";
  const contactRole = client_contact?.split("—")?.[0]?.trim() || "executive";

  let companyContext = "";
  if (company_research) {
    companyContext = `
Company: ${company_research.company_name || company_name}
Revenue: ${company_research.revenue || "Unknown"}
Industry: ${company_research.industry || "Unknown"}
Pain Points: ${company_research.pain_points || "General business challenges"}
Recent News: ${company_research.recent_news || "None available"}`;
  }

  const systemPrompt = `You are playing the role of ${contactName}, ${contactRole} at ${company_name}. You are in a ${scenario_type} meeting with a sales representative.
${companyContext}

INSTRUCTIONS FOR YOUR CHARACTER:
- Stay in character as ${contactName} throughout the entire conversation
- Be realistic — have genuine concerns, priorities, and time pressure
- Push back naturally on vague claims or generic pitches
- Don't make it too easy — ask tough questions, express skepticism when appropriate
- Reference your company's specific situation, budget constraints, and priorities
- If the rep asks good questions, reward them with useful information
- If the rep jumps to pitching too early, be visibly less engaged
- Keep responses conversational and natural (2-4 sentences typically)
- Never break character or mention that this is a roleplay

Start by greeting the sales rep and setting the tone for a ${scenario_type}.`;

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
    const openingMessage = content.type === "text" ? content.text : "Hello, thanks for joining. What did you want to discuss?";

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
