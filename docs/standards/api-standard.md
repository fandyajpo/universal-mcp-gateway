# API Standard

## Design Principles

- RESTful for CRUD operations
- Consistent resource naming
- Versioned URLs (`/api/v1/`)
- JSON request/response bodies
- Stateless server (auth in headers)

## URL Patterns

```
GET    /api/v1/workspaces              # List workspaces
POST   /api/v1/workspaces              # Create workspace
GET    /api/v1/workspaces/:id          # Get workspace
PATCH  /api/v1/workspaces/:id          # Update workspace
DELETE /api/v1/workspaces/:id          # Delete workspace
GET    /api/v1/workspaces/:id/members  # Nested resource
POST   /api/v1/workspaces/:id/invite   # Action
```

## Response Format

Success:
```json
{
  "data": {},
  "meta": { "page": 1, "total": 100 }
}
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "field": "email", "message": "Invalid email" }]
  }
}
```

## HTTP Status Codes

- 200: Success (GET, PATCH)
- 201: Created (POST)
- 204: No Content (DELETE)
- 400: Bad Request (validation)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not authorized)
- 404: Not Found
- 409: Conflict (duplicate)
- 429: Rate Limited
- 500: Internal Server Error

## Pagination

- Query params: `?page=1&limit=20`
- Response meta: `{ page, limit, total, totalPages }`
- Default limit: 20
- Max limit: 100

## Error Codes

| Code | Meaning |
|---|---|
| VALIDATION_ERROR | Input validation failed |
| NOT_FOUND | Resource not found |
| UNAUTHORIZED | Not authenticated |
| FORBIDDEN | Not authorized |
| CONFLICT | Resource conflict |
| RATE_LIMITED | Too many requests |
| INTERNAL_ERROR | Server error |
| TENANT_MISMATCH | Cross-tenant access |
