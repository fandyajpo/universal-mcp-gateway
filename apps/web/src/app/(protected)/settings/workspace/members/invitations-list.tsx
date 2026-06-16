"use client";

import { Badge, Button } from "@/components/ui";
import { useInvitations, useCancelInvitation, useResendInvitation } from "@/hooks/use-invitations";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  declined: "bg-slate-100 text-slate-500",
  cancelled: "bg-slate-100 text-slate-500",
  expired: "bg-red-100 text-red-800",
};

interface InvitationsListProps {
  workspaceId: string;
  isAdmin: boolean;
}

export function InvitationsList({ workspaceId, isAdmin }: InvitationsListProps): React.ReactNode {
  const { data: invitations, isLoading, error } = useInvitations(workspaceId);
  const cancelMutation = useCancelInvitation(workspaceId);
  const resendMutation = useResendInvitation(workspaceId);

  if (isLoading || !invitations || invitations.length === 0) return null;

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
        {error instanceof Error ? error.message : "Failed to load invitations"}
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-medium">Pending Invitations</h3>

      {cancelMutation.error || resendMutation.error ? (
        <div className="mb-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          {cancelMutation.error?.message ?? resendMutation.error?.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {invitations.map(function (inv): React.ReactNode {
          const created = new Date(inv.createdAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric",
          });

          return (
            <div key={inv._id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <span className="font-medium">{inv.inviteeEmail}</span>
                <span className="ml-2 text-xs text-muted-foreground">invited {created}</span>
              </div>

              <Badge className={STATUS_BADGE[inv.status] ?? ""}>
                {inv.status}
              </Badge>

              {isAdmin && inv.status === "pending" ? (
                <div className="flex gap-1">
                  <Button
                    variant="outline" size="sm"
                    disabled={resendMutation.isPending}
                    onClick={function (): void { resendMutation.mutate(inv.token); }}
                  >
                    Resend
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    disabled={cancelMutation.isPending}
                    onClick={function (): void { cancelMutation.mutate(inv._id); }}
                    className="text-destructive hover:text-destructive"
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
