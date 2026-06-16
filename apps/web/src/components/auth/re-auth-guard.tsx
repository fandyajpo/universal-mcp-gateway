"use client";

import { useCallback, useEffect, useState } from "react";

import { reauthenticateAction, verifySessionAction } from "@/actions/auth/re-authenticate";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from "@/components/ui";

interface ReAuthGuardProps {
  onVerified: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
  actionDescription: string;
}

export function ReAuthGuard({ onVerified, onCancel, children, actionDescription }: ReAuthGuardProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [sessionRecent, setSessionRecent] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check(): Promise<void> {
      const result = await verifySessionAction();
      if (result.recent) {
        setSessionRecent(true);
        setChecking(false);
      } else {
        setSessionRecent(false);
        setOpen(true);
        setChecking(false);
      }
    }
    void check();
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsVerifying(true);
    setError(undefined);

    const result = await reauthenticateAction(password);
    if (result.success) {
      setOpen(false);
      onVerified();
    } else {
      setError(result.error ?? "Verification failed");
    }
    setIsVerifying(false);
  }, [password, onVerified]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    onCancel?.();
  }, [onCancel]);

  if (checking) {
    return <>{children}</>;
  }

  if (sessionRecent) {
    return <>{children}</>;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(open_) => { if (!open_) handleCancel(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Identity</DialogTitle>
            <DialogDescription>
              For security, please confirm your password to {actionDescription}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
              aria-label="Current password"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={() => { void handleSubmit(); }} disabled={isVerifying || !password}>
              {isVerifying ? "Verifying..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
