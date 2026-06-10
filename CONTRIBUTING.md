# Contributing to Universal MCP Gateway

## Branch Naming

```
feat/<description>      # New features
fix/<description>       # Bug fixes
docs/<description>      # Documentation
refactor/<description>  # Code refactoring
chore/<description>     # Maintenance
perf/<description>      # Performance improvements
test/<description>      # Testing
```

Examples: `feat/workspace-invites`, `fix/pdf-encoding`, `docs/api-auth`

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `perf`, `test`, `style`, `ci`

Scopes: `web`, `admin`, `ai`, `auth`, `database`, `mcp`, `rag`, `ui`, `config`, `connector-sdk`

Examples:
```
feat(ai): add streaming response support
fix(auth): resolve token refresh race condition
docs(mcp): update tool registration guide
```

## Pull Request Flow

1. Create a branch from `main`
2. Implement your changes
3. Write or update tests
4. Run `pnpm lint` and `pnpm typecheck`
5. Open a pull request against `main`
6. Ensure CI passes
7. Request review from maintainers
8. Squash merge after approval

### PR Requirements

- Title follows conventional commits
- Description explains the what and why
- All checks pass
- At least one reviewer approval
- No merge conflicts

## Review Process

- Maintainers review within 48 hours
- Address feedback promptly
- Keep PRs focused (one concern per PR)
- Large changes should be discussed via RFC first

## Coding Standards

### TypeScript

- Strict mode enabled
- Prefer `interface` over `type` for object shapes
- Use `const` assertions where applicable
- Avoid `any` — use `unknown` and narrow
- Explicit return types on public APIs
- No `null` — use `undefined` or `Option<T>` pattern

### Imports

- Use path aliases: `@repo/ai/`, `@repo/database/`, etc.
- Group: external → internal → relative
- No default exports — prefer named exports

### Testing

- Unit tests: `vitest`
- Component tests: `vitest` + `@testing-library/react`
- E2E tests: `Playwright`
- Tests colocated with source: `src/**/*.test.ts`
- Minimum 80% coverage on new code

### Documentation

- Every public API must have JSDoc
- Architecture decisions documented as ADRs
- README updated for user-facing changes
- Diagrams in Mermaid where appropriate

## Folder Conventions

```
packages/<name>/
  src/
    index.ts          # Public API
    <domain>/
      <entity>.ts
      <entity>.test.ts
  package.json
  tsconfig.json

apps/<name>/
  src/
    app/              # Next.js App Router pages
    components/       # Shared components
    lib/              # Domain logic
    hooks/            # React hooks
  package.json
  tsconfig.json
  next.config.ts
```

## File Conventions

- PascalCase for components: `UserAvatar.tsx`
- camelCase for utilities: `formatDate.ts`
- kebab-case for config: `tailwind.config.ts`
- Tests named: `<module>.test.ts`
- Barrel files: `index.ts` (re-exports only)
