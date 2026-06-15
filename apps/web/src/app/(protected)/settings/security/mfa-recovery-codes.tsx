"use client";

import { useActionState, useState } from "react";

import { regenerateRecoveryCodesAction, type RegenerateRecoveryCodesResult } from "@/actions/auth/mfa";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export function MFARecoveryCodes({ codes: initialCodes }: { codes: string[] }): React.ReactNode {
  const [codes] = useState(initialCodes);
  const [copied, setCopied] = useState(false);
  const [regenerateState, regenerateAction, isRegeneratePending] = useActionState(
    async function (_prev: RegenerateRecoveryCodesResult): Promise<RegenerateRecoveryCodesResult> {
      return regenerateRecoveryCodesAction();
    },
    { success: false } as RegenerateRecoveryCodesResult,
  );

  function handleCopy(): void {
    navigator.clipboard.writeText(codes.join("\n")).then(
      function (): void {
        setCopied(true);
        setTimeout(function (): void {
          setCopied(false);
        }, 2000);
      },
      function (): void {
        // Clipboard API not available
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Codes</CardTitle>
        <CardDescription>
          Save these recovery codes in a secure place. Each code can only be used once.
          If you lose access to your authenticator app, you can use one of these codes to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border bg-muted/30 p-4 font-mono text-sm space-y-1">
          {codes.map(function (code: string, index: number): React.ReactNode {
            return (
              <div key={code} className="flex items-center gap-2">
                <span className="text-muted-foreground w-6 text-right">{index + 1}.</span>
                <span className="tracking-wider">{code}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy codes"}
          </Button>

          <form action={regenerateAction}>
            <Button type="submit" variant="outline" loading={isRegeneratePending}>
              Generate new codes
            </Button>
          </form>
        </div>

        {regenerateState.success && regenerateState.recoveryCodes && (
          <MFARecoveryCodes codes={regenerateState.recoveryCodes} />
        )}

        <p className="text-sm text-muted-foreground">
          <a
            href="/settings/security"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to security settings
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
