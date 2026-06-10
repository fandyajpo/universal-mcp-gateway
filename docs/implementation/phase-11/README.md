# Phase 11: Connector SDK

> Build the connector ecosystem that enables third-party service integration through a standardized SDK, and implement the initial set of production connectors.

---

## Objective

Design and implement the Connector SDK (`@repo/connector-sdk`) that provides a standardized interface for building third-party integrations. Then implement eight production-grade connectors (Slack, Notion, GitHub, Linear, Jira, Confluence, Google Drive) that expose external service capabilities as MCP tools. Build the connector registry, installation flow with OAuth2, and the connector management API.

## Scope

| In Scope | Out of Scope |
|---|---|
| Connector interface specification and abstract base class | Connector marketplace UI (Phase 15) |
| OAuth2 helper for connector authorization | Custom connector hosting platform |
| Webhook handler for receiving external events | Connector monitoring dashboard |
| Sync engine for periodic data synchronization | Real-time sync via WebSocket |
| Slack connector (messages, channels, search, files) | Slack app distribution |
| Notion connector (pages, databases, search, comments) | Notion OAuth public integration |
| GitHub connector (repos, issues, PRs, file content) | GitHub App installation |
| Linear connector (issues, projects, comments) | Linear OAuth app creation |
| Jira connector (issues, projects, sprints, search) | Jira Data Center support |
| Confluence connector (pages, spaces, attachments) | Confluence on-premise |
| Google Drive connector (files, folders, search, permissions) | Google Workspace domain-wide delegation |
| Connector registry API | Connector analytics dashboard |
| Connector installation flow with credential encryption | Connector version auto-update |

## Dependencies

- **Phase 10: MCP Gateway** — Connector SDK wraps MCP tools; connectors register with Tool Registry
- **Phase 00: Foundation** — Types, Utils, Logger, Config, Crypto (credential encryption)

## Expected Outputs

| Artifact | Location |
|---|---|
| Connector interface | `packages/connector-sdk/src/interface.ts` |
| Connector base class | `packages/connector-sdk/src/base.ts` |
| OAuth helper | `packages/connector-sdk/src/oauth.ts` |
| Webhook handler | `packages/connector-sdk/src/webhook.ts` |
| Sync engine | `packages/connector-sdk/src/sync.ts` |
| Connector types | `packages/connector-sdk/src/types.ts` |
| Slack connector | `packages/connectors/src/slack/` |
| Notion connector | `packages/connectors/src/notion/` |
| GitHub connector | `packages/connectors/src/github/` |
| Linear connector | `packages/connectors/src/linear/` |
| Jira connector | `packages/connectors/src/jira/` |
| Confluence connector | `packages/connectors/src/confluence/` |
| Google Drive connector | `packages/connectors/src/google-drive/` |
| Connector registry | `packages/connectors/src/registry.ts` |
| Connector installation API | `packages/connectors/src/api/` |
| Verification tests | `packages/connector-sdk/src/__tests__/`, `packages/connectors/src/__tests__/` |

## Architecture Constraints

- Every connector must implement the `Connector` interface defined in `@repo/connector-sdk`
- Connector credentials are encrypted at rest using `@repo/crypto` before storage in MongoDB
- OAuth2 tokens are automatically refreshed when expired; refresh failure triggers a "needs reauthorization" state
- Webhook handlers must verify payload signatures using provider-specific secrets
- Sync engine uses cursor-based pagination where available; falls back to offset-based
- Connectors run in a worker thread for fault isolation — a crash in one connector must not affect others
- Rate limits are per-connector-instance with configurable RPM (requests per minute)
- All connector API calls are logged with timing, status code, and error details
- The sync engine supports incremental sync (only fetch changed data since last sync)
- Connector definitions are stored in MongoDB and loaded dynamically at startup

## Completion Criteria

- [ ] Connector interface is documented and implemented with abstract base class
- [ ] OAuth helper supports authorization code flow with automatic token refresh
- [ ] Webhook handler validates signatures and dispatches typed events
- [ ] Sync engine runs scheduled syncs and respects rate limits
- [ ] Slack connector fetches messages, channels, and files; supports search
- [ ] Notion connector reads pages, databases, and comments; supports search
- [ ] GitHub connector reads repos, issues, PRs, and file content
- [ ] Linear connector reads issues, projects, and comments
- [ ] Jira connector reads issues, projects, sprints, and supports JQL search
- [ ] Confluence connector reads pages, spaces, and attachments
- [ ] Google Drive connector reads files, folders, and supports full-text search
- [ ] Connector registry provides CRUD operations for installed connectors
- [ ] Installation API manages OAuth flow and credential encryption
- [ ] All tests pass with > 80% coverage on connector SDK and implementations
