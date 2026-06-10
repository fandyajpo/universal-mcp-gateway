# Security Checklist

## Authentication

- [ ] All routes require authentication (except public)
- [ ] Sessions use HTTP-only cookies
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints
- [ ] Password hashing with bcrypt (cost >= 12)
- [ ] MFA available for sensitive actions

## Authorization

- [ ] RBAC enforced at service layer
- [ ] Tenant isolation in all queries
- [ ] API key scopes enforced
- [ ] Admin actions logged

## Data

- [ ] Input validated with Zod
- [ ] Output sanitized
- [ ] Sensitive fields encrypted at rest
- [ ] Secrets never logged
- [ ] CSP headers set
- [ ] XSS protection in place
- [ ] No secrets in client bundles

## Infrastructure

- [ ] TLS 1.3 for all traffic
- [ ] Dependencies scanned for vulnerabilities
- [ ] Secrets scanning in CI
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Incident response plan documented
