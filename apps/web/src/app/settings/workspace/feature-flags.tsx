"use client";

import { useState } from "react";

import { updateSettingsAction } from "@/actions/workspace/update";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
} from "@/components/ui";

const KNOWN_FLAGS = [
  { key: "enable_ai_chat", label: "AI Chat", description: "Enable AI chat features in this workspace" },
  { key: "enable_rag", label: "Knowledge Base", description: "Enable RAG and knowledge base features" },
  { key: "enable_connectors", label: "Third-Party Connectors", description: "Enable integration with external services" },
  { key: "enable_guest_access", label: "Guest Access", description: "Allow guest users with limited permissions" },
] as const;

interface FeatureFlagsProps {
  workspace: {
    settings?: Record<string, unknown>;
  };
  workspaceId: string;
}

export function FeatureFlags({ workspace, workspaceId }: FeatureFlagsProps): React.ReactNode {
  const settings = workspace.settings ?? {};
  const rawFlags = settings.featureFlags;
  const currentFlags = Array.isArray(rawFlags) ? (rawFlags as string[]) : [];
  const enabledSet = new Set(currentFlags);

  const [enabledFlags, setEnabledFlags] = useState<Set<string>>(enabledSet);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(flagKey: string, checked: boolean): Promise<void> {
    setIsPending(true);
    setError(null);

    const nextFlags = new Set(enabledFlags);
    if (checked) {
      nextFlags.add(flagKey);
    } else {
      nextFlags.delete(flagKey);
    }

    const result = await updateSettingsAction(workspaceId, {
      featureFlags: Array.from(nextFlags),
    });

    if (result.success) {
      setEnabledFlags(nextFlags);
    } else {
      setError(result.error ?? "Failed to update feature flags");
    }

    setIsPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Enable or disable workspace-level features.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {KNOWN_FLAGS.map(function (flag): React.ReactNode {
          const checked = enabledFlags.has(flag.key);
          return (
            <div key={flag.key} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`flag-${flag.key}`} className="font-medium">
                  {flag.label}
                </Label>
                <p className="text-sm text-muted-foreground">{flag.description}</p>
              </div>
              <Switch
                id={`flag-${flag.key}`}
                checked={checked}
                disabled={isPending}
                onCheckedChange={function (checked: boolean): void {
                  void handleToggle(flag.key, checked);
                }}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
