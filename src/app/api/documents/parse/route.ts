import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import mammoth from "mammoth";
import JSZip from "jszip";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Extract text from a .pptx file by reading XML slides */
async function extractPptxText(buffer: Buffer): Promise<{ text: string; slideCount: number }> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  const texts: string[] = [];
  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async("text");
    // Strip XML tags, keep text content
    const textContent = xml
      .replace(/<a:p[^>]*>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#xD;/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (textContent) {
      texts.push(`[Slide ${texts.length + 1}]\n${textContent}`);
    }
  }

  return { text: texts.join("\n\n"), slideCount: slideFiles.length };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "docx" && ext !== "pptx") {
      return NextResponse.json({ error: "Only .docx and .pptx files are supported" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 10 MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    let pageCount = 0;

    if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
      // Rough page estimate: ~3000 chars per page
      pageCount = Math.max(1, Math.ceil(extractedText.length / 3000));
    } else {
      const result = await extractPptxText(buffer);
      extractedText = result.text;
      pageCount = result.slideCount;
    }

    // Truncate if very long (keep first ~8000 chars for AI summary)
    const textForSummary = extractedText.length > 8000 ? extractedText.substring(0, 8000) + "\n\n[...truncated]" : extractedText;

    // Generate AI summary
    let summary = "";
    try {
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Summarize this document in 2-3 sentences for a sales rep preparing for a client meeting. Focus on the key value propositions, solutions described, and any specific claims or data points that would be useful in a sales conversation.\n\nDocument:\n${textForSummary}`,
          },
        ],
      });
      const content = msg.content[0];
      summary = content.type === "text" ? content.text : "Document parsed successfully.";
    } catch {
      summary = "Document parsed successfully. AI summary unavailable.";
    }

    return NextResponse.json({
      filename: file.name,
      page_count: pageCount,
      summary,
      extracted_text: extractedText.substring(0, 15000), // Cap what we store
    });
  } catch (error) {
    console.error("Document parse error:", error);
    return NextResponse.json({ error: "Failed to parse document" }, { status: 500 });
  }
}
