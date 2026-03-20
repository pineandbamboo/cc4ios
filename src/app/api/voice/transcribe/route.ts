import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// POST /api/voice/transcribe - Transcribe audio using Whisper
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    // Convert File to Buffer for OpenAI SDK
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const file = new File([buffer], audioFile.name, { type: audioFile.type });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "zh", // Default to Chinese, can be made configurable
      response_format: "text",
    });

    return NextResponse.json({ transcript: transcription });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}

// Configure Next.js to handle large file uploads
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "10mb",
  },
};
