"use client";

import { useCallback, useState } from "react";

import { inviteMemberAction } from "@/actions/workspace/members";
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input, Label } from "@/components/ui";

const ROLES: { value: string; label: string; description: string; recommended?: true }[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Can manage workspace settings, members, and content.",
  },
  {
    value: "member",
    label: "Member",
    description: "Can view and interact with workspace content.",
    recommended: true,
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Can only view workspace content.",
  },
];

interface InviteDialogProps {
  workspaceId: string;
}

export function InviteDialog({ workspaceId }: InviteDialogProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = useCallback(function (e: React.SyntheticEvent): void {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsPending(true);

    inviteMemberAction(workspaceId, email, role, message || undefined).then(function (result) {
      if (result.success) {
        setSuccess(true);
        setEmail("");
        setMessage("");
        setTimeout(function () { setOpen(false); setSuccess(false); }, 1500);
      } else {
        setError(result.error ?? "Failed to send invitation");
      }
    }).catch(function () {
      setError("An unexpected error occurred");
    }).finally(function () {
      setIsPending(false);
    });
  }, [workspaceId, email, role, message]);

  return (
    <Dialog open={open} onOpenChange={function (o: boolean): void { setOpen(o); if (!o) { setError(""); setSuccess(false); } }}>
      <DialogTrigger asChild>
        <Button size="sm">Invite Member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this workspace. They will receive an email with instructions.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={function (e: React.ChangeEvent<HTMLInputElement>): void { setEmail(e.target.value); }}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <div className="flex flex-col gap-2">
                {ROLES.map(function (r): React.ReactNode {
                  const isSelected = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={function (): void { setRole(r.value); }}
                      className={`flex flex-col gap-1 rounded-lg border p-3 text-left text-sm transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.label}</span>
                        {r.recommended ? <Badge variant="secondary" className="text-[10px]">Recommended</Badge> : null}
                      </div>
                      <span className="text-xs text-muted-foreground">{r.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-message">Personal message (optional)</Label>
              <textarea
                id="invite-message"
                placeholder="Hi, I'd love for you to join our workspace!"
                value={message}
                onChange={function (e: React.ChangeEvent<HTMLTextAreaElement>): void { setMessage(e.target.value); }}
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                Invitation sent successfully!
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={function (): void { setOpen(false); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !email}>
              {isPending ? "Sending\u2026" : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
