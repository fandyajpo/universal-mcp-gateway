"use client";

import { useActionState, useState } from "react";

import {
  setupMFAAction,
  verifyAndEnableMFAAction,
  disableMFAAction,
  type SetupMFAResult,
  type VerifyAndEnableMFAResult,
  type DisableMFAResult,
} from "@/actions/auth/mfa";
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

import { MFARecoveryCodes } from "./mfa-recovery-codes";

export function MFASetup(): React.ReactNode {
  const [setupState, setupAction, isSetupPending] = useActionState(async function (
    _prev: SetupMFAResult,
  ): Promise<SetupMFAResult> {
    return setupMFAAction();
  }, { success: false });

  const [enableState, enableAction, isEnablePending] = useActionState(verifyAndEnableMFAAction, {
    success: false,
  } as VerifyAndEnableMFAResult);

  const [disableState, disableAction, isDisablePending] = useActionState(disableMFAAction, {
    success: false,
  } as DisableMFAResult);

  const [showDisableInput, setShowDisableInput] = useState(false);
  const [code, setCode] = useState("");

  if (enableState.success && enableState.recoveryCodes) {
    return <MFARecoveryCodes codes={enableState.recoveryCodes} />;
  }

  if (setupState.success && setupState.qrCodeDataUrl && setupState.secret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app, then enter the verification code below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <img
            src={setupState.qrCodeDataUrl}
            alt="QR code for authenticator app"
            className="rounded-lg border"
            width={256}
            height={256}
          />

          <div className="w-full max-w-xs text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Or enter this key manually:
            </p>
            <code className="rounded bg-muted px-2 py-1 text-xs font-mono break-all select-all">
              {setupState.secret}
            </code>
          </div>

          <form action={enableAction} className="flex flex-col gap-4 w-full max-w-xs">
            {enableState.error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {enableState.error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="verifyCode">Verification Code</Label>
              <Input
                id="verifyCode"
                name="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                autoComplete="one-time-code"
                required
                disabled={isEnablePending}
                maxLength={6}
                value={code}
                onChange={function (e: React.ChangeEvent<HTMLInputElement>): void {
                  setCode(e.target.value);
                }}
              />
            </div>

            <Button type="submit" className="w-full" loading={isEnablePending}>
              Verify and enable
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring a verification code from your
            authenticator app in addition to your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {setupState.error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4"
            >
              {setupState.error}
            </div>
          )}

          {disableState.success && (
            <div
              role="alert"
              className="rounded-md border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary mb-4"
            >
              Two-factor authentication has been disabled.
            </div>
          )}

          <form action={setupAction}>
            <Button type="submit" loading={isSetupPending}>
              Enable Two-Factor Authentication
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disable Two-Factor Authentication</CardTitle>
          <CardDescription>
            To disable MFA, enter your current TOTP code or a recovery code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disableState.error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4"
            >
              {disableState.error}
            </div>
          )}

          {!showDisableInput ? (
            <Button variant="outline" onClick={function (): void { setShowDisableInput(true); }}>
              Disable Two-Factor Authentication
            </Button>
          ) : (
            <form action={disableAction} className="flex flex-col gap-4 max-w-xs">
              <div className="flex flex-col gap-2">
                <Label htmlFor="disableCode">TOTP Code or Recovery Code</Label>
                <Input
                  id="disableCode"
                  name="code"
                  type="text"
                  placeholder="Enter code to confirm"
                  required
                  disabled={isDisablePending}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="destructive" loading={isDisablePending}>
                  Disable
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={function (): void { setShowDisableInput(false); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
