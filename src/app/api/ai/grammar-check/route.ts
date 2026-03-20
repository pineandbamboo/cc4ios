import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";

// POST /api/ai/grammar-check - Check grammar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, lang = "zh", provider = "claude" } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const aiProvider = getAIProvider(provider);
    const result = await aiProvider.checkGrammar(content, lang);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking grammar:", error);
    return NextResponse.json({ error: "Failed to check grammar" }, { status: 500 });
  }
}
