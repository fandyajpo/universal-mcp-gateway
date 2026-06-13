"use client";

import { useActionState, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { registerAction, type RegisterActionResult } from "@/actions/auth/register";
import { Button, Input, Label } from "@/components/ui";

const initialState: RegisterActionResult = {
  success: false,
};

const passwordRequirements: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v: string): boolean => v.length >= 8 },
  { label: "Uppercase letter (A-Z)", test: (v: string): boolean => /[A-Z]/.test(v) },
  { label: "Lowercase letter (a-z)", test: (v: string): boolean => /[a-z]/.test(v) },
  { label: "Number (0-9)", test: (v: string): boolean => /[0-9]/.test(v) },
];

export function RegisterForm(): React.ReactNode {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);

  useEffect(function (): void {
    if (state.success) {
      router.push("/verify-email");
    }
  }, [state.success, router]);

  const errorId = "register-error";
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div
          id={errorId}
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          required
          disabled={isPending}
        />
      </div>

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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
          required
          disabled={isPending}
          onChange={function (e: React.ChangeEvent<HTMLInputElement>): void {
            setPassword(e.target.value);
          }}
          onFocus={function (): void {
            setShowRequirements(true);
          }}
          onBlur={function (): void {
            setShowRequirements(false);
          }}
        />
        {showRequirements && (
          <ul className="text-xs space-y-1 mt-1" aria-label="Password requirements">
            {passwordRequirements.map(function (
              req: { label: string; test: (v: string) => boolean },
            ): React.ReactNode {
              const met = req.test(password);
              return (
                <li
                  key={req.label}
                  className={met ? "text-green-600" : "text-muted-foreground"}
                >
                  {met ? "\u2713" : "\u25CB"} {req.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          required
          disabled={isPending}
          onChange={function (e: React.ChangeEvent<HTMLInputElement>): void {
            setConfirmPassword(e.target.value);
          }}
        />
        {!passwordsMatch && (
          <p className="text-xs text-destructive" role="alert">
            Passwords do not match
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" loading={isPending}>
        Create account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
          tabIndex={isPending ? -1 : 0}
        >
          Sign in
        </a>
      </p>
    </form>
  );
}
