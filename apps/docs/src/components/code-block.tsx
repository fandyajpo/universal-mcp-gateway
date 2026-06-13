"use client";

import { useCallback, useState } from "react";

interface CodeBlockProps {
  highlighted: {
    lightHtml: string;
    darkHtml: string;
    rawCode: string;
    language: string;
  };
}

export function CodeBlock({
  highlighted,
}: CodeBlockProps): React.ReactNode {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(highlighted.rawCode).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }, [highlighted.rawCode]);

  return (
    <div className="code-block group relative my-4 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between bg-muted px-4 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {highlighted.language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <div
        className="code-content-light overflow-x-auto p-4 text-sm leading-relaxed [&>pre]:m-0"
        dangerouslySetInnerHTML={{ __html: highlighted.lightHtml }}
      />
      <div
        className="code-content-dark hidden overflow-x-auto p-4 text-sm leading-relaxed [&>pre]:m-0"
        dangerouslySetInnerHTML={{ __html: highlighted.darkHtml }}
      />
    </div>
  );
}
