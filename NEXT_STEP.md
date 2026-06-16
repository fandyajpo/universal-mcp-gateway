# Next Step

## Current Position

- **Phase:** 06 (PDF Processing)
- **Step:** 06.08 — PDF Processing UI — Complete. Drag-and-drop upload zone, document list with status badges/processing progress/retry-delete actions, document detail page with metadata/extraction results/error details, search/filter, polling for in-progress documents.
- **Progress:** Phase 0 complete. Phase 1 complete. Phase 2 complete. Phase 3 complete. Phase 4 complete. Phase 5 complete. Phase 6 Steps 06.01-06.08 complete.

## Next Implementation

**Step 06.09 — PDF Pipeline Orchestration**

Integrate the progress tracker into the actual PDF pipeline stages — emit `pdf/{step}/started` / `pdf/{step}/completed` / `pdf/{step}/failed` events from each processing step (extract, ocr, chunk, embed, index) and wire the pipeline up in an Inngest function chain.

## Dependencies

| Dependency | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Phase 0 | Done | Foundation complete |
| Phase 1 | Done | Bootstrap complete |
| Phase 2 | Done | Auth complete |
| Phase 3 | Done | Workspace complete |
| Phase 4 | Done | Database complete |

## Quick Reference

```bash
pnpm dev --filter @repo/web     # Start web app
pnpm typecheck                   # TypeScript check
pnpm lint                        # ESLint check
pnpm build                       # Build all
pnpm verify                      # Run verification suite
```
