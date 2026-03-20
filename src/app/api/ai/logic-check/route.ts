import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";

// POST /api/ai/logic-check - Check logic and structure
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, provider = "claude" } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const aiProvider = getAIProvider(provider);
    const result = await aiProvider.checkLogic(content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking logic:", error);
    return NextResponse.json({ error: "Failed to check logic" }, { status: 500 });
  }
}
