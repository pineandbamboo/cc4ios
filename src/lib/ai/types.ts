/**
 * AI Provider Types
 */

export interface GrammarCheckResult {
  issues: Array<{
    text: string;
    suggestion: string;
    explanation: string;
    severity: "error" | "warning" | "suggestion";
  }>;
}

export interface LogicCheckResult {
  issues: Array<{
    text: string;
    issue: string;
    suggestion: string;
    type: "contradiction" | "ambiguity" | "incomplete" | "weak-argument";
  }>;
}

export interface MindMapNode {
  id: string;
  text: string;
  children?: MindMapNode[];
}

export interface MindMapStructure {
  title: string;
  children: MindMapNode[];
}

export interface AIProvider {
  editDocument(content: string, instruction: string): Promise<string>;
  translate(content: string, targetLang: "zh" | "en"): Promise<string>;
  checkGrammar(content: string, lang: "zh" | "en"): Promise<GrammarCheckResult>;
  checkLogic(content: string): Promise<LogicCheckResult>;
  generateMindMap(content: string): Promise<MindMapStructure>;
}
