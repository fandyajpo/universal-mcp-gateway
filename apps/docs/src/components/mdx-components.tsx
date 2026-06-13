import { AlertCircle, Info, Lightbulb, TriangleAlert } from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import { CodeBlock } from "@/components/code-block";

import type { HighlightedCode } from "@/lib/markdown";
import { cn } from "@repo/ui";
import type { Components } from "react-markdown";

/**
 * Create custom component overrides for react-markdown.
 * Accepts a map of pre-highlighted code blocks for synchronous lookup.
 */
export function createMdxComponents(
  highlights?: Map<string, HighlightedCode>,
): Components {
  return {
    code({
      className,
      children,
      ...props
    }: {
      className?: string;
      children?: React.ReactNode;
    }): React.ReactNode {
      const match = /language-(\w+)/.exec(className ?? "");
      const code = typeof children === "string" ? children.replace(/\n$/, "") : "";

      if (match) {
        const language = match[1] ?? "text";
        const key = `${language}:${code}`;
        const highlighted = highlights?.get(key);

        if (highlighted) {
          return <CodeBlock highlighted={highlighted} />;
        }
      }

      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre({ children }): React.ReactNode {
      return <div className="my-4">{children}</div>;
    },
    h1({ children, ...props }): React.ReactNode {
      return (
        <h1
          className="mb-4 mt-8 scroll-m-20 text-3xl font-bold tracking-tight"
          {...props}
        >
          {children}
        </h1>
      );
    },
    h2({ children, ...props }): React.ReactNode {
      return (
        <h2
          className="mb-3 mt-6 scroll-m-20 text-2xl font-semibold tracking-tight"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3({ children, ...props }): React.ReactNode {
      return (
        <h3
          className="mb-2 mt-5 scroll-m-20 text-xl font-semibold tracking-tight"
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4({ children, ...props }): React.ReactNode {
      return (
        <h4
          className="mb-2 mt-4 scroll-m-20 text-lg font-semibold"
          {...props}
        >
          {children}
        </h4>
      );
    },
    p({ children, ...props }): React.ReactNode {
      return (
        <p className="mb-4 leading-7 text-foreground" {...props}>
          {children}
        </p>
      );
    },
    ul({ children, ...props }): React.ReactNode {
      return (
        <ul className="mb-4 ml-6 list-disc space-y-1" {...props}>
          {children}
        </ul>
      );
    },
    ol({ children, ...props }): React.ReactNode {
      return (
        <ol className="mb-4 ml-6 list-decimal space-y-1" {...props}>
          {children}
        </ol>
      );
    },
    li({ children, ...props }): React.ReactNode {
      return (
        <li className="leading-7" {...props}>
          {children}
        </li>
      );
    },
    a({
      children,
      href,
      ...props
    }: {
      children?: React.ReactNode;
      href?: string;
    }): React.ReactNode {
      if (href?.startsWith("http")) {
        return (
          <a
            href={href}
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <Link
          href={href ?? "#"}
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          {...props}
        >
          {children}
        </Link>
      );
    },
    blockquote({ children, ...props }): React.ReactNode {
      return (
        <blockquote
          className="mb-4 border-l-4 border-primary pl-4 italic text-muted-foreground"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    hr(): React.ReactNode {
      return <hr className="my-6 border-border" />;
    },
    table({ children }): React.ReactNode {
      return (
        <div className="my-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">{children}</table>
        </div>
      );
    },
    thead({ children }): React.ReactNode {
      return <thead className="bg-muted">{children}</thead>;
    },
    th({ children }): React.ReactNode {
      return (
        <th className="px-4 py-3 text-left font-semibold text-foreground">
          {children}
        </th>
      );
    },
    td({ children }): React.ReactNode {
      return (
        <td className="border-t border-border px-4 py-3 text-foreground">
          {children}
        </td>
      );
    },
    img({
      alt,
      src,
    }: {
      alt?: string;
      src?: string | Blob;
    }): React.ReactNode {
      if (!src) return null;
      const imgSrc = typeof src === "string" ? src : "";
      if (!imgSrc) return null;
      return (
        <Image
          alt={alt ?? ""}
          src={imgSrc}
          className="my-4 max-w-full rounded-lg"
          width={800}
          height={450}
          unoptimized
        />
      );
    },
  };
}

/*
 * Custom MDX-like components that can be used in markdown content
 * via raw HTML or rehype-raw processing.
 */

interface CalloutProps {
  type?: "info" | "warning" | "error" | "tip";
  children?: React.ReactNode;
}

const calloutStyles: Record<string, string> = {
  info: "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
  warning:
    "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100",
  error: "border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
  tip: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
};

const calloutIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-5 w-5" aria-hidden="true" />,
  warning: <TriangleAlert className="h-5 w-5" aria-hidden="true" />,
  error: <AlertCircle className="h-5 w-5" aria-hidden="true" />,
  tip: <Lightbulb className="h-5 w-5" aria-hidden="true" />,
};

export function Callout({
  type = "info",
  children,
}: CalloutProps): React.ReactNode {
  return (
    <div
      className={cn(
        "my-4 flex items-start gap-3 rounded-lg border-l-4 p-4",
        calloutStyles[type] ?? calloutStyles.info,
      )}
    >
      <div className="mt-0.5 shrink-0">
        {calloutIcons[type] ?? calloutIcons.info}
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
