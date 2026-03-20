/**
 * OpenAI API Client
 * Fallback AI provider and Whisper transcription
 */

import OpenAI from "openai";
import type { AIProvider, GrammarCheckResult, LogicCheckResult, MindMapStructure } from "./provider";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.client = new OpenAI({ apiKey });
    this.model = "gpt-4o";
  }

  async editDocument(content: string, instruction: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "user",
          content: `You are an expert document editor. Edit the following document according to the instruction.

Instruction: ${instruction}

Document:
${content}

Return ONLY the edited document, without any explanation or commentary.`,
        },
      ],
    });

    return response.choices[0]?.message?.content || content;
  }

  async translate(content: string, targetLang: "zh" | "en"): Promise<string> {
    const sourceLang = targetLang === "zh" ? "English" : "Chinese";
    const targetLangName = targetLang === "zh" ? "Chinese" : "English";

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "user",
          content: `Translate the following ${sourceLang} text to ${targetLangName}.
Preserve the tone, style, and meaning as accurately as possible.

Text to translate:
${content}

Return ONLY the translation.`,
        },
      ],
    });

    return response.choices[0]?.message?.content || content;
  }

  async checkGrammar(content: string, lang: "zh" | "en"): Promise<GrammarCheckResult> {
    const langName = lang === "zh" ? "Chinese" : "English";

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "user",
          content: `Check the grammar of the following ${langName} text. Respond in JSON format with "issues" array containing objects with "text", "suggestion", "explanation", and "severity" fields.

Text: ${content}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    try {
      return JSON.parse(response.choices[0]?.message?.content || '{"issues":[]}') as GrammarCheckResult;
    } catch {
      return { issues: [] };
    }
  }

  async checkLogic(content: string): Promise<LogicCheckResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "user",
          content: `Analyze the logical structure of this document. Respond in JSON format with "issues" array containing objects with "text", "issue", "suggestion", and "type" fields.

Document: ${content}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    try {
      return JSON.parse(response.choices[0]?.message?.content || '{"issues":[]}') as LogicCheckResult;
    } catch {
      return { issues: [] };
    }
  }

  async generateMindMap(content: string): Promise<MindMapStructure> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "user",
          content: `Generate a mind map structure from this document. Respond in JSON format with "title" and "children" array.

Document: ${content}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    try {
      return JSON.parse(response.choices[0]?.message?.content || '{"title":"Document","children":[]}') as MindMapStructure;
    } catch {
      return { title: "Document", children: [] };
    }
  }

  // Whisper transcription method
  async transcribe(audioBuffer: Buffer): Promise<string> {
    const response = await this.client.audio.transcriptions.create({
      file: new File([audioBuffer], "audio.webm", { type: "audio/webm" }),
      model: "whisper-1",
      language: "zh",
    });

    return response.text;
  }
}

export default OpenAIProvider;
