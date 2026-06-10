# Phase 03: Workspace

> Build the multi-tenant workspace layer — workspace CRUD, member management, invitations, settings, and the workspace switcher UI.

---

## Objective

Implement the workspace system that provides multi-tenant isolation. Every user belongs to at least one workspace (created automatically on registration). Workspace owners can manage members, roles, and settings. The workspace switcher lets users navigate between workspaces they belong to.

---

## Scope

| Step | Description |
|------|-------------|
| 03.01 | Workspace schema and validation |
| 03.02 | Workspace repository |
| 03.03 | Workspace service |
| 03.04 | Workspace API routes |
| 03.05 | Create workspace flow |
| 03.06 | Workspace settings page |
| 03.07 | Member management |
| 03.08 | Invitation system |
| 03.09 | Workspace switcher UI |
| 03.10 | Verification |

---

## Dependencies

Depends on Phase 02 (auth, RBAC). Workspace CRUD API depends on Phase 00 database repositories.

---

## Expected Outputs

1. Workspace CRUD API (create, read, update, delete, archive)
2. Workspace settings page (name, slug, avatar, timezone)
3. Member management with role assignment and removal
4. Email invitation flow with accept/decline
5. Workspace deletion with soft-delete and admin transfer
6. Workspace switcher component in web app sidebar header
7. Slug uniqueness validation
8. Default workspace creation on user registration

---

## Step Map

| File | Step | Description |
|------|------|-------------|
| `03.01-workspace-schema.md` | 03.01 | Schema and validation |
| `03.02-workspace-repository.md` | 03.02 | Repository |
| `03.03-workspace-service.md` | 03.03 | Service |
| `03.04-workspace-api.md` | 03.04 | API routes |
| `03.05-create-workspace.md` | 03.05 | Create workspace flow |
| `03.06-workspace-settings.md` | 03.06 | Settings page |
| `03.07-member-management.md` | 03.07 | Member management |
| `03.08-invitation-system.md` | 03.08 | Invitations |
| `03.09-workspace-switcher.md` | 03.09 | Workspace switcher UI |
| `03.10-verification.md` | 03.10 | Verification |
