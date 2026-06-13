"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";

interface InvitationActionsProps {
  token: string;
  userId: string;
  action: string | null;
}

export function InvitationActions({ token, userId, action }: InvitationActionsProps): React.ReactNode {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "accepted" | "declined" | "error">("idle");
  const [error, setError] = useState("");

  async function handleResponse(actionType: "accept" | "decline"): Promise<void> {
    setIsPending(true);
    setError("");

    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType }),
      });

      if (res.ok) {
        setStatus(actionType === "accept" ? "accepted" : "declined");
        if (actionType === "accept") {
          setTimeout(function () {
            router.refresh();
          }, 2000);
        }
      } else {
        const json = await res.json() as { error?: string };
        setError(json.error ?? "Something went wrong");
        setStatus("error");
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    } finally {
      setIsPending(false);
    }
  }

  if (status === "accepted") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">
          You have accepted the invitation! Redirecting\u2026
        </div>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          You have declined the invitation.
        </div>
        <Button variant="outline" onClick={function (): void { router.push("/chat"); }}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {action === "accept" && userId ? (
        <Button
          size="lg"
          disabled={isPending}
          onClick={function (): void { void handleResponse("accept"); }}
        >
          {isPending ? "Processing\u2026" : "Accept Invitation"}
        </Button>
      ) : null}

      {action === "decline" ? (
        <Button
          variant="outline"
          size="lg"
          disabled={isPending}
          onClick={function (): void { void handleResponse("decline"); }}
        >
          {isPending ? "Processing\u2026" : "Decline Invitation"}
        </Button>
      ) : null}

      {!action && userId ? (
        <div className="flex gap-3">
          <Button
            size="lg"
            disabled={isPending}
            onClick={function (): void { void handleResponse("accept"); }}
          >
            {isPending ? "Processing\u2026" : "Accept Invitation"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={isPending}
            onClick={function (): void { void handleResponse("decline"); }}
          >
            Decline
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
