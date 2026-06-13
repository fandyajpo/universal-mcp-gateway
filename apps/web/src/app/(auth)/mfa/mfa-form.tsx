"use client";

import { useActionState, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { verifyMFAAction, skipMFAWithRecoveryAction, type VerifyMFAResult } from "@/actions/auth/mfa";
import { Button, Input, Label } from "@/components/ui";

const initialState: VerifyMFAResult = {
  success: false,
};

export function MFAForm({ challengeId }: { challengeId: string }): React.ReactNode {
  const [totpState, totpAction, isTotpPending] = useActionState(verifyMFAAction, initialState);
  const [recoveryState, recoveryAction, isRecoveryPending] = useActionState(skipMFAWithRecoveryAction, initialState);
  const router = useRouter();
  const [useRecovery, setUseRecovery] = useState(false);

  const isPending = isTotpPending || isRecoveryPending;
  const errorId = "mfa-error";

  useEffect(function (): void {
    if (totpState.success || recoveryState.success) {
      router.push("/chat");
    }
  }, [totpState.success, recoveryState.success, router]);

  const displayError = totpState.error ?? recoveryState.error;

  if (useRecovery) {
    return (
      <form action={recoveryAction} className="flex flex-col gap-4">
        <input type="hidden" name="challengeId" value={challengeId} />

        {displayError && (
          <div
            id={errorId}
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {displayError}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="recoveryCode">Recovery Code</Label>
          <Input
            id="recoveryCode"
            name="code"
            type="text"
            placeholder="Enter a recovery code"
            autoComplete="off"
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full" loading={isPending}>
          Verify recovery code
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={function (): void {
              setUseRecovery(false);
            }}
          >
            Use authenticator app instead
          </button>
        </p>
      </form>
    );
  }

  return (
    <form action={totpAction} className="flex flex-col gap-4">
      <input type="hidden" name="challengeId" value={challengeId} />

      {displayError && (
        <div
          id={errorId}
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {displayError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Authentication Code</Label>
        <Input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          placeholder="000000"
          autoComplete="one-time-code"
          required
          disabled={isPending}
          maxLength={6}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="trustDevice"
          name="trustDevice"
          type="checkbox"
          className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
          disabled={isPending}
        />
        <Label htmlFor="trustDevice" className="text-sm font-normal">
          Trust this device for 30 days
        </Label>
      </div>

      <Button type="submit" className="w-full" loading={isPending}>
        Verify
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <button
          type="button"
          className="font-medium text-primary underline-offset-4 hover:underline"
          onClick={function (): void {
            setUseRecovery(true);
          }}
        >
          Use a recovery code instead
        </button>
      </p>
    </form>
  );
}
