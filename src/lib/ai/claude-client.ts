/**
 * Claude API Client
 * Primary AI provider for document editing and reasoning tasks
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, GrammarCheckResult, LogicCheckResult, MindMapStructure } from "./provider";

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
          content: `Check the grammar of the following ${langName} text.
Identify any errors or areas for improvement.

Text:
${content}

Respond in JSON format:
{
  "issues": [
    {
      "text": "the problematic text",
      "suggestion": "suggested correction",
      "explanation": "why this is an issue",
      "severity": "error" | "warning" | "suggestion"
    }
  ]
}

If no issues found, return {"issues": []}`,
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
    throw new Error("Unexpected response type from Claude");
  }

  async checkLogic(content: string): Promise<LogicCheckResult> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Analyze the logical structure and clarity of the following document.
Check for:
- Contradictions
- Ambiguous statements
- Incomplete arguments
- Weak reasoning

Document:
${content}

Respond in JSON format:
{
  "issues": [
    {
      "text": "the problematic text",
      "issue": "description of the issue",
      "suggestion": "how to improve",
      "type": "contradiction" | "ambiguity" | "incomplete" | "weak-argument"
    }
  ]
}

If no issues found, return {"issues": []}`,
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
    throw new Error("Unexpected response type from Claude");
  }

  async generateMindMap(content: string): Promise<MindMapStructure> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Generate a mind map structure from the following document.
Extract the main topics and subtopics.

Document:
${content}

Respond in JSON format:
{
  "title": "Main title",
  "children": [
    {
      "id": "unique-id-1",
      "text": "Topic 1",
      "children": [
        {"id": "unique-id-1-1", "text": "Subtopic 1.1"}
      ]
    }
  ]
}`,
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
    throw new Error("Unexpected response type from Claude");
  }
}

export default ClaudeProvider;
