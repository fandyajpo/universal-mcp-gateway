import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

import { LoginForm } from "./login-form";
import { OAuthButtons } from "./oauth-buttons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}): Promise<React.ReactNode> {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/chat";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your workspace</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {params.error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {params.error === "oauth_account_not_linked"
              ? "This account is already linked to a different user."
              : params.error === "access_denied"
                ? "Access denied. Please try again."
                : params.error === "account_not_found"
                  ? "No account found. Please sign up first."
                  : "Authentication failed. Please try again."}
          </div>
        )}

        <input type="hidden" name="redirect" value={redirectTo} />

        <LoginForm />
        <OAuthButtons />
      </CardContent>
    </Card>
  );
}
