# Phase 12: Chat

> Build the conversational AI interface with streaming, context management, file attachments, MCP tool integration, citations, and full conversation history.

---

## Objective

Implement the complete chat experience — the primary user-facing feature of the platform. This phase covers the chat schema and data layer, streaming AI responses via SSE, the React UI components (thread list, message area, input composition), MCP tool invocation inline within conversations, citation display from RAG sources, multi-turn context management, and conversation history with search.

## Scope

| In Scope | Out of Scope |
|---|---|
| Chat thread schema and MongoDB repository | Real-time collaborative chat (multi-user editing) |
| Chat service orchestrating AI + RAG + MCP | Chat branching and version history |
| Streaming chat API via SSE | Voice/video chat |
| Chat UI: thread list sidebar | Chat embeds for external sites |
| Chat UI: message area with streaming display | Mobile-native chat app |
| Message composition with file attachments | Drag-and-drop file reordering |
| MCP tool invocation inline in chat | Tool output visualization components |
| Citations display with source hover preview | Citation export to documents |
| Multi-turn conversation context management | Conversation summarization |
| Chat history with search | Chat export (JSON, PDF) export UI |
| Message feedback (thumbs up/down) | Suggested follow-up questions |
| Optimistic UI updates for user messages | Chat presence indicators |

## Dependencies

- **Phase 09: AI Gateway** — Model routing, streaming, cost tracking
- **Phase 08: RAG Engine** — Context retrieval for grounded responses
- **Phase 10: MCP Gateway** — Tool discovery and execution
- **Phase 01: Bootstrap** — Next.js app scaffold, UI components, TailwindCSS theme
- **Phase 02: Authentication** — Session management for chat API auth
- **Phase 05: Storage** — File upload for chat attachments
- **Phase 00: Foundation** — Types, Validation, Database repository pattern, Cache

## Expected Outputs

| Artifact | Location |
|---|---|
| Chat thread schema | `packages/validation/src/chat.ts` |
| Chat thread repository | `packages/database/src/repositories/chat-thread.ts` |
| Chat message schema | `packages/validation/src/chat-message.ts` |
| Chat message repository | `packages/database/src/repositories/chat-message.ts` |
| Chat service | `packages/rag/src/chat/service.ts` (or `apps/web/src/services/chat.ts`) |
| Streaming chat API route | `apps/web/src/app/api/chat/stream/route.ts` |
| Chat API routes | `apps/web/src/app/api/chat/` |
| Thread list component | `apps/web/src/components/chat/thread-list.tsx` |
| Message area component | `apps/web/src/components/chat/message-area.tsx` |
| Message bubble component | `apps/web/src/components/chat/message-bubble.tsx` |
| Message input component | `apps/web/src/components/chat/message-input.tsx` |
| Attachment preview component | `apps/web/src/components/chat/attachment-preview.tsx` |
| Tool invocation display | `apps/web/src/components/chat/tool-invocation.tsx` |
| Citations display | `apps/web/src/components/chat/citations.tsx` |
| Chat store (Zustand) | `apps/web/src/stores/chat.ts` |
| Verification tests | `apps/web/src/__tests__/chat/` |

## Architecture Constraints

- Chat API uses SSE for streaming — never return a complete response synchronously
- User messages are optimistically added to the UI before the API responds
- The chat service orchestrates: retrieve context (RAG) → call AI (Gateway) → execute tools (MCP) → stream response
- Context window allocation: 50% conversation history, 30% retrieved documents, 20% system prompt + tool results
- MCP tool invocations are detected via tool_use in the model response stream
- Citations are rendered as inline reference markers with hover-over source preview
- Message persistence happens after the response is complete (not during streaming)
- Chat search uses MongoDB text index on message content and thread titles
- All chat operations are tenant-scoped and user-scoped
- File attachments in chat respect the same size limits and type validation from Phase 05

## Completion Criteria

- [ ] Chat threads can be created, listed, and deleted with proper tenant isolation
- [ ] Messages stream in real-time via SSE with token-by-token display
- [ ] RAG context is retrieved and injected into the model prompt
- [ ] MCP tools are invoked inline and results are incorporated into the response
- [ ] Citations display correctly with source preview on hover
- [ ] File attachments can be uploaded and previewed within chat messages
- [ ] Multi-turn conversation maintains context within token budget
- [ ] Chat history can be searched by content keywords
- [ ] Message feedback (thumbs up/down) is persisted and retrievable
- [ ] Optimistic UI updates provide instant feedback for user messages
- [ ] All tests pass with > 80% coverage on chat logic and components
- [ ] `pnpm typecheck` and `pnpm lint` pass cleanly across all affected packages
