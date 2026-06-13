"use client";

import { useEffect, useRef, useState } from "react";

import { checkSlugAction } from "@/actions/workspace/create";
import { updateWorkspaceAction, type UpdateWorkspaceActionResult } from "@/actions/workspace/update";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui";

import { slugify } from "@repo/utils";

const initialState: UpdateWorkspaceActionResult = {
  success: false,
};

interface GeneralSettingsProps {
  workspace: {
    name: string;
    slug: string;
    description?: string;
    avatar?: string;
  };
  workspaceId: string;
}

export function GeneralSettings({ workspace, workspaceId }: GeneralSettingsProps): React.ReactNode {
  const [state, setState] = useState<UpdateWorkspaceActionResult>(initialState);
  const [isPending, setIsPending] = useState(false);

  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [description, setDescription] = useState(workspace.description ?? "");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUserEditedSlug = useRef(false);

  useEffect(function () {
    return function (): void {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(function () {
    if (slug === workspace.slug) {
      setSlugAvailable(null);
      setIsCheckingSlug(false);
      return;
    }

    if (slug.length < 2) {
      setSlugAvailable(null);
      setIsCheckingSlug(false);
      return;
    }

    setIsCheckingSlug(true);

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(function (): void {
      checkSlugAction(slug)
        .then(function (result: { available: boolean }): void {
          setSlugAvailable(result.available);
        })
        .catch(function (): void {
          setSlugAvailable(null);
        })
        .finally(function (): void {
          setIsCheckingSlug(false);
        });
    }, 400);

    return function (): void {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [slug, workspace.slug]);

  function handleNameChange(value: string): void {
    setName(value);
    if (!hasUserEditedSlug.current) {
      const generated = slugify(value).substring(0, 63);
      setSlug(generated);
    }
  }

  function handleSlugChange(value: string): void {
    hasUserEditedSlug.current = true;
    setSlug(value);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsPending(true);
    setState(initialState);

    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    if (name !== workspace.name) formData.set("name", name);
    if (slug !== workspace.slug) formData.set("slug", slug);
    if (description !== (workspace.description ?? "")) formData.set("description", description);

    const result = await updateWorkspaceAction(initialState, formData);
    setState(result);
    setIsPending(false);
  }

  let slugHint: string | null = null;
  if (slug !== workspace.slug && slug.length >= 2) {
    if (isCheckingSlug) {
      slugHint = "Checking availability\u2026";
    } else if (slugAvailable === true) {
      slugHint = "Available";
    } else if (slugAvailable === false) {
      slugHint = "Already taken";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Update your workspace name, slug, and description.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.success ? (
          <div
            role="status"
            className="mb-4 rounded-md border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary"
          >
            Workspace settings updated successfully.
          </div>
        ) : null}

        {state.error ? (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {state.error}
          </div>
        ) : null}

        <form onSubmit={function (e: React.SyntheticEvent<HTMLFormElement>): void { void handleSubmit(e); }} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="My Workspace"
              required
              disabled={isPending}
              value={name}
              onChange={function (e: React.ChangeEvent<HTMLInputElement>): void {
                handleNameChange(e.target.value);
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              type="text"
              placeholder="my-workspace"
              required
              disabled={isPending}
              value={slug}
              onChange={function (e: React.ChangeEvent<HTMLInputElement>): void {
                handleSlugChange(e.target.value);
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
              placeholder="What is this workspace for?"
              rows={3}
              disabled={isPending}
              value={description}
              onChange={function (e: React.ChangeEvent<HTMLTextAreaElement>): void {
                setDescription(e.target.value);
              }}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button type="submit" className="w-full" loading={isPending}>
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
