# Security Policy

## Secret Management

- All secrets stored in environment variables, never committed
- .env files are gitignored
- Production secrets managed via platform secrets (Vercel, Docker secrets)
- Database credentials rotated every 90 days
- API keys stored hashed (bcrypt) in database

## Role-Based Access Control (RBAC)

- Roles: `owner`, `admin`, `member`, `viewer`
- Fine-grained permissions per workspace
- Permission matrix:
  - `workspace:read`, `workspace:write`, `workspace:delete`
  - `agent:read`, `agent:write`, `agent:deploy`
  - `connector:read`, `connector:write`, `connector:install`
  - `rag:read`, `rag:write`, `rag:index`
  - `admin:users`, `admin:billing`, `admin:audit`
- Permissions enforced at API gateway layer and database query level

## Tenant Isolation

- MongoDB: separate databases per tenant (isolated deployment) or collection-level tenant filter
- Redis: key prefixed by `tenant:<id>:`
- R2: bucket path isolation per tenant
- Queue: event filtering by tenant ID
- All queries include mandatory `tenantId` filter
- Row-Level Security pattern via repository layer

## Prompt Injection Mitigation

- Input sanitization at API boundary
- Role-based system prompt separation (system vs user)
- Parameterized prompts — user input placed in `{user_input}` slots
- Output validation — reject unexpected control tokens
- Rate limiting on AI completions per user
- Maximum prompt length enforcement

## RAG Poisoning Mitigation

- Document source tracking (blame metadata)
- Content hash verification before indexing
- Access control on document ingestion
- Periodic re-indexing with integrity checks
- Source reputation scoring for marketplace connectors
- Human-in-the-loop approval for sensitive document ingestion

## Tool Execution Policy

- Tools are sandboxed per workspace
- Execution timeout enforced (default 30s)
- No filesystem access from tools
- Network access restricted to whitelisted domains
- Tool output is logged and audited
- Rate limiting per tool per workspace

## API Key Policy

- API keys have expiration (max 90 days)
- Keys are one-way hashed at rest
- Key rotation enforced on security events
- Granular scopes per key
- Usage tracking and anomaly detection
- Keys visible only at creation time

## Rate Limiting

```
Global:        1000 req/min per IP
Auth:          10 req/min per IP
AI Gateway:    100 req/min per user
RAG Engine:    50 req/min per user
MCP Gateway:   200 req/min per workspace
API Keys:      500 req/min per key
```

## Audit Logging

- All authentication events logged
- All schema mutations logged
- All AI completions logged (metadata only, not content)
- All admin actions logged
- Logs immutable (append-only)
- Retention: 90 days online, 1 year archived

## Encryption

- Data in transit: TLS 1.3
- Data at rest: MongoDB Atlas encryption at rest
- Sensitive fields: AES-256-GCM field-level encryption
- Secrets: hashed with bcrypt (cost 12)
- R2: server-side encryption with SSE-C

## CSP Headers

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: *.r2.dev;
connect-src 'self' *.openrouter.ai *.upstash.io *.inngest.com *.sentry.io;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

## XSS Prevention

- React's built-in XSS protection (JSX escaping)
- Content Security Policy headers
- Input sanitization with DOMPurify for markdown rendering
- HTTP-only cookies for session tokens
- No `dangerouslySetInnerHTML` without security review

## CSRF Protection

- SameSite=Strict cookies
- CSRF tokens for state-changing operations
- Origin/Referer header validation on API
- Double-submit cookie pattern for API routes

## Incident Response

1. **Triage** (30 min): Assess severity and impact
2. **Contain** (2 hrs): Isolate affected systems, rotate credentials
3. **Eradicate** (4 hrs): Remove root cause
4. **Recover** (8 hrs): Restore from clean backup
5. **Post-mortem** (48 hrs): Document incident, update playbooks

Severity levels:
- **SEV-1**: Data breach, service outage — response within 30 min
- **SEV-2**: Degraded performance, non-critical data exposure — response within 2 hrs
- **SEV-3**: Minor incidents — next business day

## Vulnerability Reporting

Report vulnerabilities to `security@universal-mcp-gateway.dev`

Response SLA:
- Critical: 24 hours
- High: 48 hours
- Medium: 5 days
- Low: 14 days

## Secure Development

- Dependency scanning (pnpm audit, Snyk)
- SAST in CI pipeline
- Secrets scanning (git leaks prevention)
- Dependency pinning with lockfile
- Regular dependency updates (automated weekly)
- Third-party package review for AI/LLM dependencies
