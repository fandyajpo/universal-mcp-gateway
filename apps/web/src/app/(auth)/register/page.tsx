import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

import { OAuthButtons } from "../login/oauth-buttons";
import { RegisterForm } from "./register-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an Account",
  robots: { index: false, follow: false },
};

export default function RegisterPage(): React.ReactNode {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an Account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RegisterForm />
        <OAuthButtons />
      </CardContent>
    </Card>
  );
}
