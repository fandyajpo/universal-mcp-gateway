import matter from "gray-matter";

export interface Frontmatter {
  title: string;
  description?: string;
  order?: number;
}

export function parseFrontmatter(
  content: string,
): { frontmatter: Frontmatter; content: string } {
  const { data, content: body } = matter(content);

  return {
    frontmatter: {
      title: (data.title as string | undefined) ?? "Untitled",
      description: data.description as string | undefined,
      order: data.order as number | undefined,
    },
    content: body,
  };
}

export function getDocPath(slug: string[]): string {
  return `content/${slug.join("/")}.mdx`;
}
