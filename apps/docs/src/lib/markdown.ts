import { createHighlighter } from "shiki";

import type { Highlighter } from "shiki";

const bundledLangs = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "python",
  "bash",
  "sh",
  "json",
  "yaml",
  "yml",
  "sql",
  "html",
  "css",
  "scss",
  "md",
  "mdx",
  "diff",
  "rust",
  "go",
  "graphql",
] as const;

let highlighter: Highlighter | null = null;
let initPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter;
  initPromise ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: [...bundledLangs],
  });
  highlighter = await initPromise;
  return highlighter;
}

export interface HighlightedCode {
  lightHtml: string;
  darkHtml: string;
  rawCode: string;
  language: string;
}

export async function highlightCode(
  code: string,
  language: string,
): Promise<HighlightedCode> {
  const hl = await getHighlighter();
  const lightHtml = hl.codeToHtml(code, {
    lang: language,
    theme: "github-light",
  });
  const darkHtml = hl.codeToHtml(code, {
    lang: language,
    theme: "github-dark",
  });

  return {
    lightHtml,
    darkHtml,
    rawCode: code,
    language,
  };
}

const FENCED_CODE_BLOCK = /```(\w+)?\n([\s\S]*?)```/g;

/**
 * Extract all fenced code blocks from markdown content and
 * pre-highlight them with Shiki. Returns a map keyed by
 * `"language:code"` for synchronous lookup during rendering.
 */
export async function preHighlightCodeBlocks(
  content: string,
): Promise<Map<string, HighlightedCode>> {
  const highlights = new Map<string, HighlightedCode>();
  let match: RegExpExecArray | null;

  while ((match = FENCED_CODE_BLOCK.exec(content)) !== null) {
    const code = match[2]?.replace(/\n$/, "").replace(/\n$/, "") ?? "";
    const language = match[1] ?? "text";
    const key = `${language}:${code}`;

    if (!highlights.has(key)) {
      const highlighted = await highlightCode(code, language);
      highlights.set(key, highlighted);
    }
  }

  return highlights;
}
