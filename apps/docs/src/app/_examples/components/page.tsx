import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from "@/components/ui";

export default function ComponentsPage(): React.ReactNode {
  return (
    <div className="mx-auto max-w-4xl space-y-12 p-8">
      <h1 className="text-3xl font-bold">Component Gallery</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Button</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Card</h2>
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content.</p>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Badge</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </section>
    </div>
  );
}
