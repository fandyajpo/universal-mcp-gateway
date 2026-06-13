"use client";

import { useActionState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { loginAction, type LoginActionResult } from "@/actions/auth/login";
import { Button, Input, Label } from "@/components/ui";

const initialState: LoginActionResult = {
  success: false,
};

export function LoginForm(): React.ReactNode {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const router = useRouter();

  useEffect(function (): void {
    if (state.mfaRequired && state.challengeId) {
      router.push(`/mfa?challenge=${state.challengeId}`);
    }
  }, [state.mfaRequired, state.challengeId, router]);

  const errorId = "login-error";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div
          id={errorId}
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.code === "email_not_verified" ? (
            <span>
              {state.error}
              <span className="block mt-1 text-xs text-muted-foreground">
                Check your inbox for the verification link.
              </span>
            </span>
          ) : (
            state.error
          )}
        </div>
      )}

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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a
            href="/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            tabIndex={isPending ? -1 : 0}
          >
            Forgot password?
          </a>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          disabled={isPending}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="rememberMe"
          name="rememberMe"
          type="checkbox"
          className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
          disabled={isPending}
        />
        <Label htmlFor="rememberMe" className="text-sm font-normal">
          Remember me
        </Label>
      </div>

      <Button type="submit" className="w-full" loading={isPending}>
        Sign in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
          tabIndex={isPending ? -1 : 0}
        >
          Sign up
        </a>
      </p>
    </form>
  );
}
