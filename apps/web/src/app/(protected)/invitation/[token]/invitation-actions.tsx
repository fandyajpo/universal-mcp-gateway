"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";
import { useRespondToInvitation } from "@/hooks/use-invitations";

interface InvitationActionsProps {
  token: string;
  userId: string;
  action: string | null;
}

export function InvitationActions({ token, userId, action }: InvitationActionsProps): React.ReactNode {
  const router = useRouter();
  const mutation = useRespondToInvitation();

  function handleResponse(actionType: "accept" | "decline"): void {
    mutation.mutate({ token, action: actionType });
  }

  if (mutation.isSuccess && mutation.variables.action === "accept") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">
          You have accepted the invitation! Redirecting&hellip;
        </div>
      </div>
    );
  }

  if (mutation.isSuccess && mutation.variables.action === "decline") {
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
          disabled={mutation.isPending}
          onClick={function (): void { handleResponse("accept"); }}
        >
          {mutation.isPending ? "Processing&hellip;" : "Accept Invitation"}
        </Button>
      ) : null}

      {action === "decline" ? (
        <Button
          variant="outline"
          size="lg"
          disabled={mutation.isPending}
          onClick={function (): void { handleResponse("decline"); }}
        >
          {mutation.isPending ? "Processing&hellip;" : "Decline Invitation"}
        </Button>
      ) : null}

      {!action && userId ? (
        <div className="flex gap-3">
          <Button
            size="lg"
            disabled={mutation.isPending}
            onClick={function (): void { handleResponse("accept"); }}
          >
            {mutation.isPending ? "Processing&hellip;" : "Accept Invitation"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={mutation.isPending}
            onClick={function (): void { handleResponse("decline"); }}
          >
            Decline
          </Button>
        </div>
      ) : null}

      {mutation.error ? (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {mutation.error.message}
        </div>
      ) : null}
    </div>
  );
}
