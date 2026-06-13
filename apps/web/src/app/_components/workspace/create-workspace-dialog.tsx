"use client";

import { useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";

import { CreateWorkspaceForm } from "./create-workspace-form";

interface CreateWorkspaceDialogProps {
  children?: React.ReactNode;
}

export function CreateWorkspaceDialog({ children }: CreateWorkspaceDialogProps): React.ReactNode {
  const [open, setOpen] = useState(false);

  function handleSuccess(): void {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="default" size="sm">
            Create Workspace
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Set up a new workspace for your team to collaborate.
          </DialogDescription>
        </DialogHeader>
        <CreateWorkspaceForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
