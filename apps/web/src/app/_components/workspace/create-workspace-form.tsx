"use client";

import { useActionState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { createWorkspaceAction, type CreateWorkspaceActionResult } from "@/actions/workspace/create";
import { Button, Input, Label } from "@/components/ui";
import { useCreateWorkspace } from "@/hooks/use-create-workspace";

import { AvatarUpload } from "./avatar-upload";

const initialState: CreateWorkspaceActionResult = {
  success: false,
};

interface CreateWorkspaceFormProps {
  onSuccess?: () => void;
}

export function CreateWorkspaceForm({ onSuccess }: CreateWorkspaceFormProps): React.ReactNode {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createWorkspaceAction, initialState);
  const { slug, setSlug, slugAvailable, isCheckingSlug, onNameChange } = useCreateWorkspace();
  const errorId = "create-workspace-error";

  useEffect(function (): void {
    if (state.success && state.workspaceId) {
      onSuccess?.();
      router.push(`/workspace/${state.workspaceId}`);
    }
  }, [state.success, state.workspaceId, router, onSuccess]);

  let slugHint: string | null = null;
  if (slug && slug.length >= 2) {
    if (isCheckingSlug) {
      slugHint = "Checking availability\u2026";
    } else if (slugAvailable === true) {
      slugHint = "Available";
    } else if (slugAvailable === false) {
      slugHint = "Already taken \u2014 a unique slug will be generated";
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <div
          id={errorId}
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      ) : null}

      <div className="flex justify-center">
        <AvatarUpload value={null} onChange={function (): void { return; }} disabled={isPending} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Workspace Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="My Workspace"
          required
          disabled={isPending}
          onChange={function (e: React.ChangeEvent<HTMLInputElement>): void {
            onNameChange(e.target.value);
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          type="text"
          placeholder="my-workspace"
          value={slug}
          required
          disabled={isPending}
          onChange={function (e: React.ChangeEvent<HTMLInputElement>): void {
            setSlug(e.target.value);
          }}
        />
        {slugHint ? (
          <p
            className={`text-xs ${slugAvailable === false ? "text-amber-600" : slugAvailable === true ? "text-green-600" : "text-muted-foreground"}`}
          >
            {slugHint}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          name="description"
          placeholder="What is this workspace for?"
          rows={3}
          disabled={isPending}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Button type="submit" className="w-full" loading={isPending}>
        Create Workspace
      </Button>
    </form>
  );
}
