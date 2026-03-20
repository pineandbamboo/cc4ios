import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";

// POST /api/ai/translate - Translate content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, targetLang = "en", provider = "claude" } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const aiProvider = getAIProvider(provider);
    const translatedContent = await aiProvider.translate(content, targetLang);

    return NextResponse.json({ content: translatedContent });
  } catch (error) {
    console.error("Error translating content:", error);
    return NextResponse.json({ error: "Failed to translate content" }, { status: 500 });
  }
}
