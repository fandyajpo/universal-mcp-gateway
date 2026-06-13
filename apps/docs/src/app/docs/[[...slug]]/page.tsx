import { Markdown } from "@/components/markdown";
import { parseFrontmatter } from "@/lib/frontmatter";
import { preHighlightCodeBlocks } from "@/lib/markdown";
import fs from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

interface DocPageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug ?? [];
  const filePath = path.join(
    process.cwd(),
    "content",
    ...slugPath,
  ) + ".mdx";

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { frontmatter } = parseFrontmatter(fileContent);
    return { title: frontmatter.title };
  } catch {
    const title = slugPath.length > 0
      ? slugPath.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" - ")
      : "Documentation";
    return { title };
  }
}

export default async function DocPage({
  params,
}: DocPageProps): Promise<React.ReactNode> {
  const { slug } = await params;
  const slugPath = slug ?? [];
  const filePath = path.join(
    process.cwd(),
    "content",
    ...slugPath,
  ) + ".mdx";

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { frontmatter, content } = parseFrontmatter(fileContent);

    const highlights = await preHighlightCodeBlocks(content);

    return (
      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
            {frontmatter.title}
          </h1>
          {frontmatter.description && (
            <p className="mt-2 text-lg text-muted-foreground">
              {frontmatter.description}
            </p>
          )}
        </header>
        <Markdown content={content} highlights={highlights} />
      </article>
    );
  } catch {
    const title = slugPath.length > 0
      ? slugPath.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ")
      : "Documentation";

    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {slugPath.length > 0
            ? `Documentation for "${slugPath.join("/")}".`
            : "Documentation overview page."}
        </p>
      </div>
    );
  }
}
