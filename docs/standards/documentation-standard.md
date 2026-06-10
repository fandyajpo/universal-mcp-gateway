# Documentation Standard

## Principles

- Document WHY, not WHAT or HOW (code should be self-explanatory for what/how)
- Keep docs close to code (colocated READMEs, JSDoc)
- Diagrams in Mermaid for architecture and flows
- All docs in markdown

## README Required

Every package and app must have a README.md with:
- Purpose (one paragraph)
- Public API (list of exported functions/components)
- Dependencies (other packages)
- Usage example
- Configuration (if any)
- Testing instructions

## JSDoc Required

Every public export (function, type, class, interface) must have JSDoc:

```typescript
/**
 * Creates a new workspace with the given configuration.
 * Validates input, checks permissions, and persists to database.
 *
 * @param input - Workspace creation input validated by Zod schema
 * @param userId - Authenticated user creating the workspace
 * @returns The created workspace entity
 * @throws ForbiddenError if user lacks workspace:create permission
 */
```

## ADRs

- Every significant architecture decision needs an ADR
- ADRs are immutable once accepted (new ADR supersedes old)
- Template in `docs/templates/adr-template.md`

## API Documentation

- OpenAPI 3.1 for REST endpoints
- Examples for request/response
- Error codes documented
- Authentication requirements documented

## Documentation Updates

- Update docs when code changes
- Update CHANGELOG.md with each change
- Update ROADMAP.md when scope changes
- Update STATUS.md with each step
