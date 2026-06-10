# Phase 13: Admin

> Build the administrative dashboard for platform-wide management, monitoring, and configuration.

---

## Objective

Deliver a comprehensive admin application (`apps/admin`) that provides platform operators with full visibility and control over users, workspaces, billing, audit logs, system health, feature flags, and announcements. This phase transforms the admin app from a scaffold into a fully functional operations center.

## Scope

| Area | Coverage |
|------|----------|
| Authentication & Authorization | Admin-only auth guard with role elevation checks |
| User Management | List, search, filter, suspend, delete, impersonate users |
| Workspace Management | List, search, filter, suspend, data export for workspaces |
| Billing Overview | MRR, churn rate, active subscriptions, failed payments read-only view |
| Audit Logs | Immutable log viewer with entity/action/user/date filtering |
| System Health | Service status indicators, uptime tracking, incident history |
| Feature Flags | Toggle management with percentage rollout and user targeting |
| Announcements | In-app notification creation, targeting, and dismissible display |
| Verification | End-to-end testing of all admin flows |

## Dependencies

| Step ID | Dependency | Purpose |
|---------|------------|---------|
| 13.01 | 02.07 (Auth middleware) | Admin auth guard extends session validation with `admin:access` permission check |
| 13.02 | 00.09 (User repository) | User CRUD operations through TenantAwareRepository |
| 13.03 | 03.02 (Workspace repository) | Workspace CRUD through repository layer |
| 13.04 | 14.03 (Subscription management) | Read-only billing aggregation data |
| 13.05 | 00.09 (AuditLog repository) | Audit log query and filtering |
| 13.06 | 13.01 (Admin auth guard) | System status aggregation requires admin context |
| 13.07 | 13.01 (Admin auth guard) | Feature flag mutations require admin elevation |
| 13.08 | 13.01 (Admin auth guard) | Announcement CRUD requires admin permissions |
| 13.09 | All above | Full integration test suite |

## Expected Outputs

1. Admin authentication guard middleware and route protection
2. User management page with data table, search, and actions
3. Workspace management page with data table, search, and actions
4. Billing overview dashboard with aggregate metrics
5. Audit log viewer with multi-axis filtering
6. System health dashboard with service status cards
7. Feature flags management page with toggle controls
8. Announcements system with creation flow and user-facing display
9. Verification suite with admin flows

## Architecture Constraints

- Admin app (`apps/admin`) must NOT import packages not listed in its `package.json`
- All admin API routes must use the admin auth guard before processing
- Admin features must NOT leak into `apps/web` — no cross-app imports
- Audit log viewer is read-only — no delete or edit of log entries
- Feature flag changes must be logged to the audit trail
- Announcements must support targeting: all users, workspace admins, specific workspaces
- Impersonation mode must log every action taken during the session
- All admin mutations must emit audit events

## Completion Criteria

- All 9 steps are verified with passing tests
- Admin can view, search, filter, and manage all users
- Admin can view, search, filter, and manage all workspaces
- Billing overview displays accurate aggregate data
- Audit log viewer supports filtering by entity, action, user, date range
- System health dashboard shows real-time service status
- Feature flags can be toggled with percentage rollout
- Announcements display correctly for targeted users
- TypeScript strict mode passes with no errors
- Lint passes with no errors
- Build succeeds for the admin app

---

## Steps

| # | Step | Depends On | Est. Time | Priority |
|---|------|------------|-----------|----------|
| 13.01 | Admin auth guard | 02.07 | 4h | Critical |
| 13.02 | User management page | 13.01, 00.09 | 8h | Critical |
| 13.03 | Workspace management page | 13.01, 03.02 | 8h | Critical |
| 13.04 | Billing overview page | 13.01, 14.03 | 6h | High |
| 13.05 | Audit log viewer | 13.01, 00.09 | 8h | High |
| 13.06 | System health dashboard | 13.01 | 6h | High |
| 13.07 | Feature flags UI | 13.01 | 6h | Medium |
| 13.08 | Announcements system | 13.01 | 6h | Medium |
| 13.09 | Verification | All above | 4h | Critical |
