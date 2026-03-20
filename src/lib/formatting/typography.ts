/**
 * Typography formatting for mixed Chinese/English documents
 * Ensures proper spacing between Chinese characters, Latin letters, and numbers
 */

/**
 * Add space between Chinese characters and Latin letters
 */
export function spaceChineseLatin(text: string): string {
  // Chinese character followed by Latin letter
  let result = text.replace(/([\u4e00-\u9fff])([a-zA-Z])/g, "$1 $2");
  // Latin letter followed by Chinese character
  result = result.replace(/([a-zA-Z])([\u4e00-\u9fff])/g, "$1 $2");
  return result;
}

/**
 * Add space between Chinese characters and numbers
 */
export function spaceChineseNumber(text: string): string {
  // Chinese character followed by number
  let result = text.replace(/([\u4e00-\u9fff])([0-9])/g, "$1 $2");
  // Number followed by Chinese character
  result = result.replace(/([0-9])([\u4e00-\u9fff])/g, "$1 $2");
  return result;
}

/**
 * Normalize quotation marks
 * Convert straight quotes to curly quotes based on context
 */
export function normalizeQuotes(text: string): string {
  // For Chinese text, use full-width quotes
  let result = text.replace(/([\u4e00-\u9fff])"/g, "$1\u201c"); // Left double quote
  result = result.replace(/"([\u4e00-\u9fff])/g, "\u201d$1"); // Right double quote

  // For English text, use curly quotes (but be careful with code)
  // This is a simplified version - full implementation needs to track quote pairs
  return result;
}

/**
 * Normalize punctuation spacing
 */
export function normalizePunctuation(text: string): string {
  // Remove space before Chinese punctuation
  let result = text.replace(/\s+([，。！？；：、）】」』])/g, "$1");
  // Remove space after Chinese opening punctuation
  result = result.replace(/([（【「『])\s+/g, "$1");
  return result;
}

/**
 * Apply all typography rules
 */
export function formatTypography(text: string): string {
  let result = text;

  // Don't format code blocks
  const codeBlocks: string[] = [];
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Don't format inline code
  const inlineCode: string[] = [];
  result = result.replace(/`[^`]+`/g, (match) => {
    inlineCode.push(match);
    return `__INLINE_CODE_${inlineCode.length - 1}__`;
  });

  // Don't format URLs
  const urls: string[] = [];
  result = result.replace(/https?:\/\/[^\s]+/g, (match) => {
    urls.push(match);
    return `__URL_${urls.length - 1}__`;
  });

  // Apply typography rules
  result = spaceChineseLatin(result);
  result = spaceChineseNumber(result);
  result = normalizeQuotes(result);
  result = normalizePunctuation(result);

  // Restore protected content
  urls.forEach((url, i) => {
    result = result.replace(`__URL_${i}__`, url);
  });
  inlineCode.forEach((code, i) => {
    result = result.replace(`__INLINE_CODE_${i}__`, code);
  });
  codeBlocks.forEach((block, i) => {
    result = result.replace(`__CODE_BLOCK_${i}__`, block);
  });

  return result;
}

/**
 * Check if text needs typography formatting
 */
export function needsTypographyFormatting(text: string): boolean {
  // Check for Chinese followed immediately by Latin
  if (/[\u4e00-\u9fff][a-zA-Z]/.test(text)) return true;
  // Check for Latin followed immediately by Chinese
  if (/[a-zA-Z][\u4e00-\u9fff]/.test(text)) return true;
  // Check for Chinese followed immediately by number
  if (/[\u4e00-\u9fff][0-9]/.test(text)) return true;
  // Check for number followed immediately by Chinese
  if (/[0-9][\u4e00-\u9fff]/.test(text)) return true;
  return false;
}
