# Phase 06: PDF Processing

> Build the document ingestion pipeline — upload, extract, structure, and index PDF content for downstream embedding and retrieval.

---

## Objective

Implement a robust PDF processing pipeline that accepts uploaded PDFs, performs text extraction (with OCR fallback for scanned documents), splits content into structured chunks, extracts metadata and tables, and tracks processing progress through Inngest event-driven workflows. The output of this phase feeds directly into Phase 07 (Embedding) and Phase 08 (RAG Engine).

## Scope

| In Scope | Out of Scope |
|---|---|
| PDF upload with Inngest-triggered async processing | Client-side PDF editing or annotation |
| Text extraction using pdf.js and PyMuPDF | PDF generation or conversion to other formats |
| OCR via Tesseract.js for scanned/image-only PDFs | Advanced document layout reconstruction |
| Semantic chunking by heading, paragraph, page boundary | ML-based layout analysis |
| Metadata extraction (title, author, dates, page count) | PDF/A compliance validation |
| Table extraction (Camelot/py with Python sidecar) | Form field extraction |
| Progress tracking via Inngest event stream | Real-time WebSocket progress (Phase 12) |
| Error handling with retry and dead-letter queue | Large-scale batch processing UI |

## Dependencies

- **Phase 05: Storage** — R2 client, file upload service, signed URL generation, file type validation, size limits
- **Phase 00: Foundation** — Logger, types, config, validation packages
- **Phase 12: Inngest** (as infrastructure, configured in Phase 00 foundation step 00.12 CI/CD — Inngest client instantiation)

## Expected Outputs

| Artifact | Location |
|---|---|
| PDF upload route handler | `apps/web/src/app/api/documents/pdf/upload/route.ts` |
| Inngest PDF processing functions | `packages/rag/src/pdf/processing.ts` |
| Text extraction service | `packages/rag/src/pdf/extractor.ts` |
| OCR integration module | `packages/rag/src/pdf/ocr.ts` |
| Chunking strategy module | `packages/rag/src/pdf/chunker.ts` |
| Metadata extraction module | `packages/rag/src/pdf/metadata.ts` |
| Table extraction module | `packages/rag/src/pdf/tables.ts` |
| Progress tracking events | `packages/rag/src/pdf/events.ts` |
| PDF processing UI components | `apps/web/src/components/pdf/` |
| Mongoose schema for PDF documents | `packages/database/src/models/pdf-document.ts` |
| Verification tests | `packages/rag/src/pdf/__tests__/` |

## Architecture Constraints

- All PDF processing runs asynchronously via Inngest — never block the upload HTTP response
- Each processing step emits an Inngest event for observability
- Chunking output must conform to the `Chunk` type expected by Phase 07 embedding pipeline
- File size limit of 50 MB enforced before processing begins
- Password-protected PDFs require user-supplied password at upload time
- OCR is a fallback — only invoked when native text extraction yields < 10 characters per page
- Temporary files must be cleaned up after processing completes or fails
- All processing state persisted in MongoDB for dashboard visibility

## Completion Criteria

- [ ] PDF upload successfully triggers Inngest processing pipeline
- [ ] Text extraction works for native PDFs with > 95% character accuracy
- [ ] OCR fallback activates and succeeds for scanned PDFs
- [ ] Semantic chunking produces valid `Chunk[]` output
- [ ] Metadata extraction captures title, author, creation date, page count, PDF version
- [ ] Table extraction outputs structured JSON for detected tables
- [ ] Processing progress visible via Inngest event stream
- [ ] All error states handled with retry logic and dead-letter queue
- [ ] PDF processing UI shows status, progress, and error details
- [ ] `pnpm typecheck` and `pnpm lint` pass across all affected packages
