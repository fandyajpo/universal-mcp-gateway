"use client";

import { useEffect, useState } from "react";

import { cancelInvitationAction, resendInvitationAction } from "@/actions/workspace/members";
import { Badge, Button } from "@/components/ui";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  declined: "bg-slate-100 text-slate-500",
  cancelled: "bg-slate-100 text-slate-500",
  expired: "bg-red-100 text-red-800",
};

interface Invitation {
  _id: string;
  id: string;
  inviteeEmail: string;
  role: string;
  status: string;
  message?: string;
  createdAt: string;
  expiresAt: string;
  token: string;
}

interface InvitationsListProps {
  workspaceId: string;
  isAdmin: boolean;
}

export function InvitationsList({ workspaceId, isAdmin }: InvitationsListProps): React.ReactNode {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchInvitations(): Promise<void> {
    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations?status=pending`);
      const json = await res.json() as { data?: { invitations: Invitation[] }; error?: string };
      if (json.data) {
        setInvitations(json.data.invitations);
      } else {
        setError(json.error ?? "Failed to load");
      }
    } catch {
      setError("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(function (): void {
    void fetchInvitations();
  }, [workspaceId]);

  async function handleCancel(invitationId: string): Promise<void> {
    setError("");
    const result = await cancelInvitationAction(invitationId, workspaceId);
    if (result.success) {
      setInvitations(function (prev): Invitation[] {
        return prev.filter(function (i): boolean { return i.id !== invitationId && i._id !== invitationId; });
      });
    } else {
      setError(result.error ?? "Failed to cancel");
    }
  }

  async function handleResend(token: string): Promise<void> {
    setError("");
    const result = await resendInvitationAction(token, workspaceId);
    if (!result.success) {
      setError(result.error ?? "Failed to resend");
    }
  }

  if (loading) return null;

  if (invitations.length === 0) return null;

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-medium">Pending Invitations</h3>

      {error ? (
        <div className="mb-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive">{error}</div>
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
                  <Button variant="outline" size="sm" onClick={function (): void { void handleResend(inv.token); }}>
                    Resend
                  </Button>
                  <Button variant="ghost" size="sm" onClick={function (): void { void handleCancel(inv._id); }}
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
