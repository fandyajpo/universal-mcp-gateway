import ReactMarkdown from "react-markdown";

import { createMdxComponents } from "@/components/mdx-components";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import type { HighlightedCode } from "@/lib/markdown";

interface MarkdownProps {
  content: string;
  highlights?: Map<string, HighlightedCode>;
  className?: string;
}

export function Markdown({
  content,
  highlights,
  className,
}: MarkdownProps): React.ReactNode {
  const components = createMdxComponents(highlights);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
