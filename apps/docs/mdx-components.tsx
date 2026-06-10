import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props: { children?: ReactNode }) => (
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight" {...props}>
        {props.children}
      </h1>
    ),
    h2: (props: { children?: ReactNode }) => (
      <h2 className="scroll-m-20 mt-10 text-3xl font-semibold tracking-tight" {...props}>
        {props.children}
      </h2>
    ),
    h3: (props: { children?: ReactNode }) => (
      <h3 className="scroll-m-20 mt-8 text-2xl font-semibold tracking-tight" {...props}>
        {props.children}
      </h3>
    ),
    p: (props: { children?: ReactNode }) => (
      <p className="mt-4 leading-7" {...props}>
        {props.children}
      </p>
    ),
    code: (props: { children?: ReactNode }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props}>
        {props.children}
      </code>
    ),
    pre: (props: { children?: ReactNode }) => (
      <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm" {...props}>
        {props.children}
      </pre>
    ),
    ul: (props: { children?: ReactNode }) => (
      <ul className="mt-4 list-disc pl-6" {...props}>
        {props.children}
      </ul>
    ),
    ol: (props: { children?: ReactNode }) => (
      <ol className="mt-4 list-decimal pl-6" {...props}>
        {props.children}
      </ol>
    ),
    a: (props: { children?: ReactNode; href?: string }) => (
      <a
        href={props.href}
        className="text-primary underline underline-offset-4 hover:text-primary/80"
        {...props}
      >
        {props.children}
      </a>
    ),
    ...components,
  };
}