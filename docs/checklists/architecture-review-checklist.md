# Architecture Review Checklist

## Package Boundaries

- [ ] Package has clear single responsibility
- [ ] Public API surface is minimal and intentional
- [ ] Internal implementation details not exported
- [ ] Dependencies are justified and minimal
- [ ] No circular dependencies
- [ ] Package README documents purpose and API

## Data Flow

- [ ] Data flow matches ARCHITECTURE.md
- [ ] Repository pattern used correctly
- [ ] Cache invalidation strategy defined
- [ ] Event flow documented
- [ ] Error propagation defined

## Multi-Tenancy

- [ ] Tenant isolation at all layers
- [ ] Tenant context propagation correct
- [ ] No cross-tenant data leakage possible
- [ ] Tenant-aware repositories used

## Scalability

- [ ] Stateless where possible
- [ ] Idempotent operations
- [ ] Async processing for long operations
- [ ] Caching strategy defined
- [ ] Database indexing strategy reviewed

## Security

- [ ] AuthN/AuthZ architecture reviewed
- [ ] RBAC model complete
- [ ] API key scopes sufficient
- [ ] Rate limiting strategy defined
- [ ] Audit logging coverage adequate

## Future Migration

- [ ] Extraction to microservices possible
- [ ] Event-driven integration points
- [ ] Shared contracts in types package
- [ ] No tight coupling to infrastructure
