import type { AIProvider } from "./types";
import { ClaudeProvider } from "./claude-client";
import { OpenAIProvider } from "./openai-client";

/**
 * Factory function to get the appropriate AI provider
 */
export function getAIProvider(provider: "claude" | "openai" = "claude"): AIProvider {
  if (provider === "claude") {
    return new ClaudeProvider();
  } else {
    return new OpenAIProvider();
  }
}

export type { AIProvider, GrammarCheckResult, LogicCheckResult, MindMapStructure } from "./types";
