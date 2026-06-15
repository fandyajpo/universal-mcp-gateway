import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { InvitationActions } from "./invitation-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invitation",
};

interface InvitationPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ action?: string }>;
}

export default async function InvitationPage({
  params,
  searchParams,
}: InvitationPageProps): Promise<React.ReactNode> {
  const { token } = await params;
  const { action } = await searchParams;
  const userId = (await headers()).get("x-user-id");

  const [{ connect, InvitationRepository, UserRepository, WorkspaceRepository }, { createInvitationService, createRBACService }] =
    await Promise.all([import("@repo/database"), import("@repo/auth")]);

  await connect();

  const invitationRepo = new InvitationRepository();
  const workspaceRepo = new WorkspaceRepository(userId ?? "");
  const userRepo = new UserRepository();
  const getUserRole = function (): Promise<"owner" | "admin" | "member" | "viewer" | null> {
    return Promise.resolve(null);
  };
  const rbac = createRBACService(getUserRole);
  const service = createInvitationService(invitationRepo, workspaceRepo, userRepo, rbac);

  const result = await service.getByToken(token);

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Invitation Not Found</h1>
          <p className="text-muted-foreground">This invitation link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const invitation = result.data;

  if (invitation.status !== "pending") {
    const statusMessages: Record<string, string> = {
      accepted: "You have already accepted this invitation.",
      declined: "You have already declined this invitation.",
      cancelled: "This invitation has been cancelled.",
      expired: "This invitation has expired.",
    };

    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Invitation {invitation.status}</h1>
          <p className="text-muted-foreground">{statusMessages[invitation.status] ?? "This invitation is no longer valid."}</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    if (action === "accept") {
      redirect(`/login?redirect=${encodeURIComponent(`/invitation/${token}?action=accept`)}`);
    }
    if (action === "decline") {
      redirect(`/login?redirect=${encodeURIComponent(`/invitation/${token}?action=decline`)}`);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Workspace Invitation</h1>
        <p className="mb-6 text-muted-foreground">
          You&apos;ve been invited to join <strong>{invitation.workspaceName}</strong> with the role of <strong>{invitation.role}</strong>.
        </p>
        {invitation.message ? (
          <p className="mb-6 rounded-md bg-muted p-3 text-sm italic text-muted-foreground">
            &ldquo;{invitation.message}&rdquo;
          </p>
        ) : null}
        <InvitationActions token={token} userId={userId ?? ""} action={action ?? null} />
      </div>
    </div>
  );
}
