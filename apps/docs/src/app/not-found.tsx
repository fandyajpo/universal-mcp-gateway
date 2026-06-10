import Link from "next/link";

export default function NotFound(): React.ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="text-lg text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/docs"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Go to Docs
      </Link>
    </div>
  );
}