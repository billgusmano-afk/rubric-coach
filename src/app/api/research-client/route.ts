import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { company } = await request.json();

  if (!company) {
    return NextResponse.json({ error: "company is required" }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Research the company "${company}" and return a JSON object with the following fields. Use your best knowledge — if you don't know exact figures, provide reasonable estimates and note them as estimates.

Return ONLY a valid JSON object with these fields:
{
  "company_name": "Official company name",
  "revenue": "Estimated annual revenue (e.g. $420M)",
  "industry": "Primary industry",
  "business_model": "B2B, B2C, etc.",
  "key_contacts": "Typical C-suite roles and names if known",
  "pain_points": "3-4 likely business challenges or priorities",
  "recent_news": "Any notable recent developments"
}

Return ONLY the JSON object, no other text.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse response" }, { status: 500 });
    }

    const research = JSON.parse(jsonMatch[0]);
    return NextResponse.json(research);
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json({ error: "Failed to research company" }, { status: 500 });
  }
}
