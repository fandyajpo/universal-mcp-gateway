"use client";

import ReactMarkdown from "react-markdown";
import { codeToHtml } from "shiki";

import type { Components } from "react-markdown";
import type { ElementChildren, ExtraProps } from "./markdown-types";

type HeadingProps = { children?: React.ReactNode; level?: number } & ExtraProps;

export function MarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}): React.ReactNode {
  const components: Components = {
    code({
      className,
      children,
      ...props
    }: {
      className?: string;
      children?: React.ReactNode;
    } & ExtraProps) {
      const match = /language-(\w+)/.exec(className ?? "");
      const code = String(children).replace(/\n$/, "");

      if (match) {
        return <ShikiCodeBlock code={code} lang={match[1] ?? "text"} />;
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
    pre({ children }: ElementChildren) {
      return <div className="my-4 overflow-hidden rounded-lg border border-border">{children}</div>;
    },
    h1({ children, ...props }: HeadingProps) {
      return (
        <h1 className="mb-4 mt-8 text-3xl font-bold tracking-tight" {...props}>
          {children}
        </h1>
      );
    },
    h2({ children, ...props }: HeadingProps) {
      return (
        <h2 className="mb-3 mt-6 text-2xl font-semibold tracking-tight" {...props}>
          {children}
        </h2>
      );
    },
    h3({ children, ...props }: HeadingProps) {
      return (
        <h3 className="mb-2 mt-5 text-xl font-semibold tracking-tight" {...props}>
          {children}
        </h3>
      );
    },
    h4({ children, ...props }: HeadingProps) {
      return (
        <h4 className="mb-2 mt-4 text-lg font-semibold" {...props}>
          {children}
        </h4>
      );
    },
    p({ children, ...props }: ElementChildren) {
      return (
        <p className="mb-4 leading-7 text-foreground" {...props}>
          {children}
        </p>
      );
    },
    ul({ children, ...props }: ElementChildren) {
      return (
        <ul className="mb-4 ml-6 list-disc space-y-1" {...props}>
          {children}
        </ul>
      );
    },
    ol({ children, ...props }: ElementChildren) {
      return (
        <ol className="mb-4 ml-6 list-decimal space-y-1" {...props}>
          {children}
        </ol>
      );
    },
    li({ children, ...props }: ElementChildren) {
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
    }: { children?: React.ReactNode; href?: string } & ExtraProps) {
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
    },
    blockquote({ children, ...props }: ElementChildren) {
      return (
        <blockquote
          className="mb-4 border-l-4 border-primary pl-4 italic text-muted-foreground"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    hr({ ...props }: ExtraProps) {
      return <hr className="my-6 border-border" {...props} />;
    },
    table({ children, ...props }: ElementChildren) {
      return (
        <div className="my-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm" {...props}>
            {children}
          </table>
        </div>
      );
    },
    thead({ children, ...props }: ElementChildren) {
      return (
        <thead className="bg-muted" {...props}>
          {children}
        </thead>
      );
    },
    th({ children, ...props }: ElementChildren) {
      return (
        <th className="px-4 py-3 text-left font-semibold text-foreground" {...props}>
          {children}
        </th>
      );
    },
    td({ children, ...props }: ElementChildren) {
      return (
        <td className="border-t border-border px-4 py-3 text-foreground" {...props}>
          {children}
        </td>
      );
    },
    img({
      alt,
      src,
      ...props
    }: {
      alt?: string;
      src?: string | Blob;
    } & ExtraProps) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt ?? ""}
          src={src as string | undefined}
          className="my-4 max-w-full rounded-lg"
          loading="lazy"
          {...props}
        />
      );
    },
  };

  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

function ShikiCodeBlock({ code, lang }: { code: string; lang: string }): React.ReactNode {
  const html = codeToHtml(code, {
    lang,
    theme: "github-dark-default",
  });

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-muted px-4 py-1.5">
        <span className="text-xs text-muted-foreground">{lang}</span>
      </div>
      <div
        className="overflow-x-auto p-4 text-sm leading-relaxed [&>pre]:m-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
