import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

import { MFAForm } from "./mfa-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Two-Factor Authentication",
  robots: { index: false, follow: false },
};

export default async function MFAPage({
  searchParams,
}: {
  searchParams: Promise<{ challenge?: string }>;
}): Promise<React.ReactNode> {
  const params = await searchParams;

  if (!params.challenge) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invalid Session</CardTitle>
          <CardDescription>
            This verification session is missing or expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Please sign in again to continue.
          </p>
          <p className="mt-4">
            <a
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to sign in
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
        <CardDescription>Enter the code from your authenticator app</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <MFAForm challengeId={params.challenge} />
      </CardContent>
    </Card>
  );
}
