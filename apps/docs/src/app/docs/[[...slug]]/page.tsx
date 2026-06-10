import type { Metadata } from "next";

interface DocPageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    ? slug.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" - ")
    : "Documentation";
  return { title };
}

export default async function DocPage({ params }: DocPageProps): Promise<React.ReactNode> {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return null;
  }

  const docPath = slug.join("/");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
        {slug.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ")}
      </h1>
      <p className="mt-4 text-muted-foreground">
        Documentation for &quot;{docPath}&quot;. Content will be loaded from MDX files in the next step.
      </p>
    </div>
  );
}