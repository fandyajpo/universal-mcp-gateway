# Security Standard

## Authentication

- Better Auth for user authentication
- HTTP-only, Secure, SameSite=Strict cookies for sessions
- API keys for programmatic access (hashed with bcrypt)
- OAuth 2.0 for social login
- MFA with TOTP for sensitive operations
- Session rotation on privilege escalation

## Authorization

- RBAC at service layer (not UI layer)
- Permission checks before every mutation
- Tenant isolation enforced in all queries
- API key scopes limit access

## Input Validation

- Zod schemas for all user input
- Validate at API boundary before any processing
- Sanitize output for XSS prevention
- Maximum length enforcement on all string inputs

## Data Protection

- TLS 1.3 for all data in transit
- Encryption at rest (MongoDB Atlas + R2 SSE)
- Field-level encryption for sensitive PII
- Secrets in environment variables only
- No secrets in client-side code

## Rate Limiting

```
Auth: 10 req/min per IP
API: 100 req/min per user
AI: 50 req/min per user
Upload: 10 req/min per user
```

## Monitoring

- All auth events logged
- All mutations logged
- Failed access attempts flagged
- Anomaly detection on API usage
- Weekly security dependency scanning
