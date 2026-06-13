"use client";

import { useActionState } from "react";

import { requestResetAction, type RequestResetResult } from "@/actions/auth/password-reset";
import { Button, Input, Label } from "@/components/ui";

const initialState: RequestResetResult = {
  success: false,
};

export function ForgotPasswordForm(): React.ReactNode {
  const [state, formAction, isPending] = useActionState(requestResetAction, initialState);

  if (state.success && state.message) {
    return (
      <div
        role="alert"
        className="rounded-md border border-primary/50 bg-primary/10 px-4 py-6 text-sm text-center"
      >
        <p className="font-medium text-primary mb-2">Check Your Email</p>
        <p className="text-muted-foreground">{state.message}</p>
        <p className="text-muted-foreground mt-4">
          <a
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </a>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full" loading={isPending}>
        Send reset link
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <a
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
          tabIndex={isPending ? -1 : 0}
        >
          Back to sign in
        </a>
      </p>
    </form>
  );
}
