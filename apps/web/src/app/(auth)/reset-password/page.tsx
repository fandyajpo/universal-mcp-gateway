import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

import { ResetPasswordForm } from "./reset-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.ReactNode> {
  const params = await searchParams;

  if (!params.token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invalid Link</CardTitle>
          <CardDescription>
            This password reset link is missing or invalid.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Please request a new password reset link.
          </p>
          <p className="mt-4">
            <a
              href="/forgot-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Request new link
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set New Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ResetPasswordForm token={params.token} />
      </CardContent>
    </Card>
  );
}
