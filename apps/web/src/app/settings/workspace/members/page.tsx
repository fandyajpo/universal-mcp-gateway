import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { WorkspaceSettingsNav } from "../workspace-settings-nav";
import { MembersTable } from "./members-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members",
};

interface MembersPageProps {
  searchParams: Promise<{ workspaceId?: string }>;
}

export default async function MembersPage({
  searchParams,
}: MembersPageProps): Promise<React.ReactNode> {
  const { workspaceId } = await searchParams;
  if (!workspaceId) redirect("/settings");

  const userId = (await headers()).get("x-user-id");
  if (!userId) redirect("/login");

  const [{ connect, WorkspaceRepository }] = await Promise.all([import("@repo/database")]);

  await connect();

  const workspaceRepo = new WorkspaceRepository(userId);
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) redirect("/settings");

  const isMember = workspace.members?.some(
    (m) => m.userId === userId && !m.deletedAt,
  );
  const isOwner = workspace.ownerId === userId;
  if (!isMember && !isOwner) redirect("/settings");

  const result = await workspaceRepo.getMembers(workspaceId);

  return (
    <div className="container max-w-4xl py-10">
      <WorkspaceSettingsNav />
      <h1 className="mb-8 text-3xl font-bold">Members</h1>
      <MembersTable
        workspaceId={workspaceId}
        ownerId={workspace.ownerId}
        currentUserId={userId}
        members={result.members}
        total={result.total}
      />
    </div>
  );
}
