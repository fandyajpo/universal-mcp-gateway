import { countTokens as gptCount, decode, encode } from "gpt-tokenizer";

export function countTokens(text: string): number {
  return gptCount(text);
}

export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const tokens = encode(text);
  if (tokens.length <= maxTokens) return text;
  return decode(tokens.slice(0, maxTokens));
}
