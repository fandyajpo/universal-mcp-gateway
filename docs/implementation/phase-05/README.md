# Phase 05: Storage

> Implement file storage infrastructure using Cloudflare R2 with signed URLs, file validation, size enforcement, tenant isolation, and upload API routes with a reusable upload UI component.

---

## Objective

Build a production-grade file storage system on Cloudflare R2 (S3-compatible object storage). The system supports file upload/download, signed URL generation for secure access, type validation via magic bytes, size limits per workspace tier, tenant-isolated storage paths, and a reusable upload UI component with drag-and-drop and progress tracking.

---

## Scope

| Step | Description |
|------|-------------|
| 05.01 | R2 client setup with S3 SDK |
| 05.02 | File upload service |
| 05.03 | Signed URL generation |
| 05.04 | File type validation (magic bytes) |
| 05.05 | Size limits and enforcement |
| 05.06 | Tenant-isolated storage paths |
| 05.07 | Upload API routes |
| 05.08 | Upload UI component |
| 05.09 | Verification |

---

## Dependencies

Depends on Phase 00 (types, logger, validation, config). Upload UI component depends on Phase 01 web app layout.

---

## Expected Outputs

1. Cloudflare R2 client configured and tested
2. File upload service with multipart support (streaming upload to R2)
3. Signed URL generation for secure downloads (expiring links)
4. File type validation using magic bytes (not just file extension)
5. Size limit enforcement per workspace tier (configurable)
6. Tenant-isolated storage paths: `/{workspaceId}/{entity}/{date}/{filename}`
7. Upload API routes: POST /api/files/upload, GET /api/files/:id/download
8. Upload UI component with drag-and-drop, progress bar, file preview
9. File storage documentation in `docs/architecture/file-storage.md`

---

## Step Map

| File | Step | Description |
|------|------|-------------|
| `05.01-r2-client.md` | 05.01 | R2 client setup |
| `05.02-upload-service.md` | 05.02 | File upload service |
| `05.03-signed-urls.md` | 05.03 | Signed URL generation |
| `05.04-file-type-validation.md` | 05.04 | File type validation |
| `05.05-size-limits.md` | 05.05 | Size limits |
| `05.06-tenant-paths.md` | 05.06 | Tenant-isolated paths |
| `05.07-upload-api.md` | 05.07 | Upload API routes |
| `05.08-upload-ui.md` | 05.08 | Upload UI component |
| `05.09-verification.md` | 05.09 | Verification |
