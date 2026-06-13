import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DangerZone } from "./danger-zone";
import { FeatureFlags } from "./feature-flags";
import { GeneralSettings } from "./general-settings";
import { WorkspaceSettingsNav } from "./workspace-settings-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Settings",
};

interface WorkspaceSettingsPageProps {
  searchParams: Promise<{ workspaceId?: string }>;
}

export default async function WorkspaceSettingsPage({
  searchParams,
}: WorkspaceSettingsPageProps): Promise<React.ReactNode> {
  const { workspaceId } = await searchParams;
  if (!workspaceId) redirect("/settings");

  const userId = (await headers()).get("x-user-id");
  if (!userId) redirect("/login");

  const [
    { connect, WorkspaceRepository, UserRepository },
    { createWorkspaceService, createRBACService },
  ] = await Promise.all([import("@repo/database"), import("@repo/auth")]);

  await connect();

  const workspaceRepo = new WorkspaceRepository(userId);
  const userRepo = new UserRepository();
  const getUserRole = async (uid: string, wid: string): Promise<"owner" | "admin" | "member" | "viewer" | null> => {
    const ws = await workspaceRepo.findById(wid);
    if (!ws) return null;
    if (ws.ownerId === uid) return "owner" as const;
    const member = ws.members?.find((m) => m.userId === uid && !m.deletedAt);
    return member?.role ?? null;
  };
  const rbac = createRBACService(getUserRole);
  const service = createWorkspaceService(workspaceRepo, userRepo, rbac);

  const result = await service.getById(workspaceId, userId);
  if (!result.success || !result.data) {
    redirect("/settings");
  }

  return (
    <div className="container max-w-2xl py-10">
      <WorkspaceSettingsNav />
      <h1 className="mb-8 text-3xl font-bold">Workspace Settings</h1>
      <div className="space-y-10">
        <GeneralSettings workspace={result.data} workspaceId={workspaceId} />
        <FeatureFlags workspace={result.data} workspaceId={workspaceId} />
        <DangerZone workspace={result.data} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
