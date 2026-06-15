"use client";

import { useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@/components/ui";

interface ChangeRoleDialogProps {
  memberName: string;
  currentRole: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newRole: string) => void;
  isPending?: boolean;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", description: "Can manage members, settings, and workspace features" },
  { value: "member", label: "Member", description: "Can use workspace features and collaborate with the team" },
  { value: "viewer", label: "Viewer", description: "Read-only access to workspace content" },
] as const;

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full access to all workspace settings, billing, and member management",
  admin: "Can manage members, settings, and workspace features",
  member: "Can use workspace features and collaborate with the team",
  viewer: "Read-only access to workspace content",
};

export function ChangeRoleDialog({
  memberName,
  currentRole,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: ChangeRoleDialogProps): React.ReactNode {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  function handleConfirm(): void {
    if (selectedRole !== currentRole) {
      onConfirm(selectedRole);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update the role for <span className="font-medium">{memberName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <Label className="text-sm font-medium">Current role: <span className="capitalize">{currentRole}</span></Label>

          <div className="flex flex-col gap-2">
            {ROLE_OPTIONS.map(function (option): React.ReactNode {
              if (option.value === currentRole) return null;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={function (): void { setSelectedRole(option.value); }}
                  className={`flex flex-col gap-1 rounded-md border p-3 text-left transition-colors ${
                    selectedRole === option.value
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-muted-foreground/50"
                  }`}
                >
                  <span className="text-sm font-medium capitalize">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </button>
              );
            })}
          </div>

          {selectedRole !== currentRole ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Changing role to <span className="font-medium capitalize">{selectedRole}</span> will update
              this member&apos;s permissions: {ROLE_DESCRIPTIONS[selectedRole] ?? ""}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={function (): void { onOpenChange(false); }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            loading={isPending}
            disabled={selectedRole === currentRole}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
