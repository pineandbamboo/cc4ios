import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";

// POST /api/ai/edit - Edit document with AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, instruction, provider = "claude" } = body;

    if (!content || !instruction) {
      return NextResponse.json(
        { error: "Content and instruction are required" },
        { status: 400 }
      );
    }

    const aiProvider = getAIProvider(provider);
    const editedContent = await aiProvider.editDocument(content, instruction);

    return NextResponse.json({ content: editedContent });
  } catch (error) {
    console.error("Error editing document:", error);
    return NextResponse.json({ error: "Failed to edit document" }, { status: 500 });
  }
}
