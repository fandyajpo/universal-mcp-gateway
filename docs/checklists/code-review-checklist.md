# Code Review Checklist

## Architecture

- [ ] Follows Clean Architecture boundaries
- [ ] Uses Repository Pattern for DB access
- [ ] No circular dependencies
- [ ] Package boundaries respected
- [ ] Dependency injection used correctly
- [ ] No business logic in route handlers
- [ ] No direct DB access from UI

## Code Quality

- [ ] TypeScript strict mode passes
- [ ] No `any` types without justification
- [ ] No `null` used (use `undefined`)
- [ ] Named exports only
- [ ] Functions < 30 lines
- [ ] JSDoc on all public APIs
- [ ] No console.log (use logger)
- [ ] Error handling consistent
- [ ] Input validation present

## Testing

- [ ] Unit tests for services/repositories
- [ ] Integration tests for API routes
- [ ] Edge cases covered
- [ ] Error cases covered
- [ ] Mocks used appropriately
- [ ] Test isolation maintained

## Security

- [ ] Input validated with Zod
- [ ] Tenant isolation enforced
- [ ] Auth checks in place
- [ ] No secrets exposed
- [ ] Rate limiting considered
- [ ] CSRF protection for mutations

## Performance

- [ ] No N+1 queries
- [ ] Pagination on list endpoints
- [ ] Caching considered
- [ ] Bundle size impact assessed
