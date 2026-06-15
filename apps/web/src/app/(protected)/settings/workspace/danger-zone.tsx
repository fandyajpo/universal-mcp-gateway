"use client";

import { useState } from "react";

import { archiveWorkspaceAction, restoreWorkspaceAction, type ArchiveWorkspaceActionResult } from "@/actions/workspace/archive";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";

interface DangerZoneProps {
  workspace: {
    deletedAt?: Date | string | null;
  };
  workspaceId: string;
}

export function DangerZone({ workspace, workspaceId }: DangerZoneProps): React.ReactNode {
  const [isArchived, setIsArchived] = useState(!!workspace.deletedAt);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive(): Promise<void> {
    setIsPending(true);
    setError(null);

    const result: ArchiveWorkspaceActionResult = await archiveWorkspaceAction(workspaceId);
    if (result.success) {
      setIsArchived(true);
      setShowConfirm(false);
    } else {
      setError(result.error ?? "Failed to archive workspace");
    }

    setIsPending(false);
  }

  async function handleRestore(): Promise<void> {
    setIsPending(true);
    setError(null);

    const result: ArchiveWorkspaceActionResult = await restoreWorkspaceAction(workspaceId);
    if (result.success) {
      setIsArchived(false);
    } else {
      setError(result.error ?? "Failed to restore workspace");
    }

    setIsPending(false);
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle>{isArchived ? "Restore Workspace" : "Danger Zone"}</CardTitle>
        <CardDescription>
          {isArchived
            ? "This workspace is currently archived. Restore it to re-enable access."
            : "Archiving will disable access for all members. You can restore it later."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {isArchived ? (
          <Button
            variant="outline"
            onClick={function (): void { void handleRestore(); }}
            loading={isPending}
            className="w-full sm:w-auto"
          >
            Restore Workspace
          </Button>
        ) : (
          <>
            <Button
              variant="destructive"
              onClick={function (): void { setShowConfirm(true); }}
              className="w-full sm:w-auto"
            >
              Archive Workspace
            </Button>

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Archive Workspace</DialogTitle>
                  <DialogDescription>
                    This will disable access for all workspace members. The workspace data will be
                    preserved and you can restore it at any time. Are you sure you want to proceed?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={function (): void { setShowConfirm(false); }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={function (): void { void handleArchive(); }}
                    loading={isPending}
                  >
                    Archive
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
