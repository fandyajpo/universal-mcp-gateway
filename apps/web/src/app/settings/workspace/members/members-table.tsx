"use client";

import { useMemo, useState } from "react";

import { changeMemberRoleAction, removeMemberAction } from "@/actions/workspace/members";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";

import { ChangeRoleDialog } from "./change-role-dialog";
import { InvitationsList } from "./invitations-list";
import { InviteDialog } from "./invite-dialog";
import { MemberRow } from "./member-row";
import { RemoveMemberDialog } from "./remove-member-dialog";

const PAGE_SIZE = 20;

const ROLE_FILTERS = [
  { value: "", label: "All" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
] as const;

interface MemberEntry {
  userId: string;
  role: string;
  joinedAt: Date | string;
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  } | null;
}

interface MembersTableProps {
  workspaceId: string;
  ownerId: string;
  currentUserId: string;
  members: MemberEntry[];
  total: number;
}

export function MembersTable({
  workspaceId,
  ownerId,
  currentUserId,
  members,
  total,
}: MembersTableProps): React.ReactNode {
  const [membersState, setMembersState] = useState<MemberEntry[]>(members);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [changeRoleTarget, setChangeRoleTarget] = useState<{ userId: string; name: string; role: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; name: string } | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isAdmin = membersState.some(
    (m) => m.userId === currentUserId && (m.role === "admin" || m.role === "owner"),
  );

  const filtered = useMemo(function (): MemberEntry[] {
    let result = membersState;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(function (m): boolean {
        if (!m.user) return false;
        return m.user.name.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q);
      });
    }

    if (roleFilter) {
      result = result.filter(function (m): boolean {
        return m.role === roleFilter;
      });
    }

    return result;
  }, [membersState, searchQuery, roleFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function handleSearch(value: string): void {
    setSearchQuery(value);
    setCurrentPage(0);
  }

  function handleRoleFilter(value: string): void {
    setRoleFilter(value);
    setCurrentPage(0);
  }

  async function handleRoleChange(userId: string, newRole: string): Promise<void> {
    setIsPending(true);
    const result = await changeMemberRoleAction(workspaceId, userId, newRole);
    if (result.success) {
      setMembersState(function (prev): MemberEntry[] {
        return prev.map(function (m): MemberEntry {
          if (m.userId === userId) {
            return { ...m, role: newRole };
          }
          return m;
        });
      });
    }
    setIsPending(false);
    setChangeRoleTarget(null);
  }

  async function handleRemove(userId: string): Promise<void> {
    setIsPending(true);
    const result = await removeMemberAction(workspaceId, userId);
    if (result.success) {
      setMembersState(function (prev): MemberEntry[] {
        return prev.filter(function (m): boolean {
          return m.userId !== userId;
        });
      });
    }
    setIsPending(false);
    setRemoveTarget(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-medium">
              {total} member{total !== 1 ? "s" : ""}
            </CardTitle>
            {isAdmin ? (
              <InviteDialog workspaceId={workspaceId} />
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="member-search" className="sr-only">Search members</Label>
              <Input
                id="member-search"
                type="search"
                placeholder="Search by name or email\u2026"
                value={searchQuery}
                onChange={function (e: React.ChangeEvent<HTMLInputElement>): void {
                  handleSearch(e.target.value);
                }}
              />
            </div>

            <div className="flex gap-1 rounded-md border p-1">
              {ROLE_FILTERS.map(function (filter): React.ReactNode {
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={function (): void { handleRoleFilter(filter.value); }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      roleFilter === filter.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {paginated.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No members found.
            </p>
          ) : (
            paginated.map(function (member): React.ReactNode {
              return (
                <MemberRow
                  key={member.userId}
                  member={member}
                  ownerId={ownerId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onRoleChangeClick={function (): void {
                    setChangeRoleTarget({
                      userId: member.userId,
                      name: member.user?.name ?? "Unknown",
                      role: member.role,
                    });
                  }}
                  onRemoveClick={function (): void {
                    setRemoveTarget({
                      userId: member.userId,
                      name: member.user?.name ?? "Unknown",
                    });
                  }}
                />
              );
            })
          )}
        </CardContent>
      </Card>

      {isAdmin ? (
        <InvitationsList workspaceId={workspaceId} isAdmin={isAdmin} />
      ) : null}

      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 0}
            onClick={function (): void { setCurrentPage(function (p): number { return p - 1; }); }}
          >
            Previous
          </Button>

          {Array.from({ length: pageCount }, function (_, i): React.ReactNode {
            return (
              <Button
                key={i}
                variant={i === currentPage ? "default" : "outline"}
                size="sm"
                onClick={function (): void { setCurrentPage(i); }}
                className="min-w-9"
              >
                {i + 1}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount - 1}
            onClick={function (): void { setCurrentPage(function (p): number { return p + 1; }); }}
          >
            Next
          </Button>
        </div>
      ) : null}

      {changeRoleTarget ? (
        <ChangeRoleDialog
          memberName={changeRoleTarget.name}
          currentRole={changeRoleTarget.role}
          open={true}
          onOpenChange={function (open: boolean): void {
            if (!open) setChangeRoleTarget(null);
          }}
          onConfirm={function (newRole: string): void {
            void handleRoleChange(changeRoleTarget.userId, newRole);
          }}
          isPending={isPending}
        />
      ) : null}

      {removeTarget ? (
        <RemoveMemberDialog
          memberName={removeTarget.name}
          open={true}
          onOpenChange={function (open: boolean): void {
            if (!open) setRemoveTarget(null);
          }}
          onConfirm={function (): void {
            void handleRemove(removeTarget.userId);
          }}
          isPending={isPending}
        />
      ) : null}
    </>
  );
}
