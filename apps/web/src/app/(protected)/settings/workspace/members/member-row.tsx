"use client";

import { Avatar, AvatarFallback, Badge, getInitials } from "@/components/ui";

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  admin: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  member: "bg-slate-100 text-slate-800 hover:bg-slate-100",
  viewer: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

interface MemberRowProps {
  member: {
    userId: string;
    role: string;
    joinedAt: Date | string;
    user?: {
      id: string;
      email: string;
      name: string;
      avatarUrl?: string;
    } | null;
  };
  ownerId: string;
  currentUserId: string;
  onRoleChangeClick: () => void;
  onRemoveClick: () => void;
  isAdmin: boolean;
}

export function MemberRow({
  member,
  ownerId,
  currentUserId,
  onRoleChangeClick,
  onRemoveClick,
  isAdmin,
}: MemberRowProps): React.ReactNode {
  const userName = member.user?.name ?? "Unknown";
  const userEmail = member.user?.email ?? "";
  const isOwner = member.userId === ownerId;
  const isSelf = member.userId === currentUserId;
  const joinedDate = new Date(member.joinedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <Avatar className="h-10 w-10">
        <AvatarFallback>{getInitials(userName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{userName}</span>
          {isOwner ? (
            <Badge variant="outline" className="text-[10px]">Owner</Badge>
          ) : null}
          {isSelf ? (
            <span className="text-xs text-muted-foreground">(you)</span>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <Badge className={ROLE_BADGE_COLORS[member.role] ?? ""}>
          {member.role}
        </Badge>
      </div>

      <div className="hidden text-xs text-muted-foreground md:block">
        {joinedDate}
      </div>

      <Badge variant="secondary" className="text-[10px]">
        Active
      </Badge>

      {isAdmin && !isOwner ? (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onRoleChangeClick}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Change Role
          </button>
          <button
            type="button"
            onClick={onRemoveClick}
            className="rounded-md px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
          >
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}
