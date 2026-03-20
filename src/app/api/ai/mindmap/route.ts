import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";

// POST /api/ai/mindmap - Generate mind map from document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, provider = "claude" } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const aiProvider = getAIProvider(provider);
    const result = await aiProvider.generateMindMap(content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating mind map:", error);
    return NextResponse.json({ error: "Failed to generate mind map" }, { status: 500 });
  }
}
