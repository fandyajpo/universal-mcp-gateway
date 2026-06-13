"use client";

import { useActionState, useEffect, useState } from "react";

import { resetPasswordAction, type ResetPasswordActionResult } from "@/actions/auth/password-reset";
import { Button, Input, Label } from "@/components/ui";

const initialState: ResetPasswordActionResult = {
  success: false,
};

const passwordRequirements: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v: string): boolean => v.length >= 8 },
  { label: "Uppercase letter (A-Z)", test: (v: string): boolean => /[A-Z]/.test(v) },
  { label: "Lowercase letter (a-z)", test: (v: string): boolean => /[a-z]/.test(v) },
  { label: "Number (0-9)", test: (v: string): boolean => /[0-9]/.test(v) },
];

export function ResetPasswordForm({ token }: { token: string }): React.ReactNode {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);

  useEffect(function () {
    let id: ReturnType<typeof setTimeout> | undefined;
    if (state.success) {
      id = setTimeout(function (): void {
        window.location.href = "/login";
      }, 5000);
    }
    return function (): void {
      if (id !== undefined) clearTimeout(id);
    };
  }, [state.success]);

  const errorId = "reset-password-error";
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  if (state.success) {
    return (
      <div
        role="alert"
        className="rounded-md border border-primary/50 bg-primary/10 px-4 py-6 text-sm text-center"
      >
        <p className="font-medium text-primary mb-2">Password Reset Successfully</p>
        <p className="text-muted-foreground">
          Your password has been changed. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

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
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter new password"
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
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter new password"
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
        Reset password
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
