/**
 * Claude API Client
 * Primary AI provider for document editing and reasoning tasks
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, GrammarCheckResult, LogicCheckResult, MindMapStructure } from "./types";

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    this.client = new Anthropic({ apiKey });
    this.model = "claude-sonnet-4-6-20250514";
  }

  async editDocument(content: string, instruction: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
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

    const text = response.content[0];
    if (text.type === "text") {
      return text.text;
    }
    throw new Error("Unexpected response type from Claude");
  }

  async translate(content: string, targetLang: "zh" | "en"): Promise<string> {
    const sourceLang = targetLang === "zh" ? "English" : "Chinese";
    const targetLangName = targetLang === "zh" ? "Chinese" : "English";

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Translate the following ${sourceLang} text to ${targetLangName}.
Preserve the tone, style, and meaning as accurately as possible.
For business/professional content, maintain appropriate formality.

Text to translate:
${content}

Return ONLY the translation, without any explanation.`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type === "text") {
      return text.text;
    }
    throw new Error("Unexpected response type from Claude");
  }

  async checkGrammar(content: string, lang: "zh" | "en"): Promise<GrammarCheckResult> {
    const langName = lang === "zh" ? "Chinese" : "English";

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Check the grammar of the following ${langName} text. Respond in JSON format with "issues" array containing objects with "text", "suggestion", "explanation", and "severity" fields (severity: "error" | "warning" | "suggestion").

Text: ${content}

Return only valid JSON.`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type === "text") {
      try {
        return JSON.parse(text.text) as GrammarCheckResult;
      } catch {
        return { issues: [] };
      }
    }
    return { issues: [] };
  }

  async checkLogic(content: string): Promise<LogicCheckResult> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Analyze the logical structure of this document. Respond in JSON format with "issues" array containing objects with "text", "issue", "suggestion", and "type" fields (type: "contradiction" | "ambiguity" | "incomplete" | "weak-argument").

Document: ${content}

Return only valid JSON.`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type === "text") {
      try {
        return JSON.parse(text.text) as LogicCheckResult;
      } catch {
        return { issues: [] };
      }
    }
    return { issues: [] };
  }

  async generateMindMap(content: string): Promise<MindMapStructure> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Generate a mind map structure from this document. Respond in JSON format with "title" string and "children" array of nodes with "id", "text", and optional "children" fields.

Document: ${content}

Return only valid JSON.`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type === "text") {
      try {
        return JSON.parse(text.text) as MindMapStructure;
      } catch {
        return { title: "Document", children: [] };
      }
    }
    return { title: "Document", children: [] };
  }
}

export default ClaudeProvider;
