import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

import { RedirectWithCountdown } from "./redirect-countdown";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Your Email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}): Promise<React.ReactNode> {
  const params = await searchParams;

  if (params.token) {
    try {
      const [{ connect }, { createAuthServer }] = await Promise.all([
        import("@repo/database"),
        import("@repo/auth"),
      ]);

      await connect();
      const server = createAuthServer();

      await server.api.verifyEmail({
        query: { token: params.token },
      });

      return (
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Email Verified</CardTitle>
            <CardDescription>
              Your email has been successfully verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Redirecting to login in <RedirectWithCountdown to="/login" /> seconds...
            </p>
          </CardContent>
        </Card>
      );
    } catch {
      return (
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Verification Failed</CardTitle>
            <CardDescription>
              The verification link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Please request a new verification email or try signing in again.
            </p>
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Verify Your Email</CardTitle>
        <CardDescription>
          {params.email
            ? `We sent a verification link to ${params.email}`
            : "We sent a verification link to your email"}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          Check your inbox and click the verification link to activate your account.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <a href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            try signing in
          </a>{" "}
          to resend.
        </p>
      </CardContent>
    </Card>
  );
}
