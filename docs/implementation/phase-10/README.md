# Phase 10: MCP Gateway

> Build the core Model Context Protocol gateway that enables AI models to discover and invoke tools dynamically through a standardized JSON-RPC 2.0 interface.

---

## Objective

Implement a production-ready MCP (Model Context Protocol) Gateway that acts as a bridge between AI models and executable tools. The gateway provides protocol handling over SSE and stdio transports, a dynamic tool registry with JSON Schema validation, sandboxed tool execution, streaming responses for long-running tools, versioning support, and comprehensive error handling. This phase is the foundation for the Connector SDK (Phase 11) and Chat tool integration (Phase 12).

## Scope

| In Scope | Out of Scope |
|---|---|
| MCP protocol handler (JSON-RPC 2.0) | MCP client implementation |
| HTTP SSE transport | WebSocket transport (Phase 12 enhancement) |
| Tool registry with dynamic registration | Tool marketplace (Phase 15) |
| JSON Schema-based tool validation | Tool dependency resolution |
| Execution sandbox with timeout, resource limits | Full containerization of tool execution |
| Streaming tool responses via notifications | Tool result caching |
| Tool versioning with semver compatibility | A/B testing of tool versions |
| Structured error handling with error codes | Circuit breaker for failing tools |
| Tool discovery API (`tools/list`, `tools/call`) | Pagination for tool listings |
| Tool invocation audit logging | Real-time tool health monitoring |
| Authentication and authorization per tool | Tool-level rate limiting |

## Dependencies

- **Phase 00: Foundation** — Types (MCP protocol types), Logger, Validation
- **Phase 09: AI Gateway** — The AI Gateway calls MCP tools during model inference (soft dependency for testing)

## Expected Outputs

| Artifact | Location |
|---|---|
| MCP protocol handler | `packages/mcp/src/protocol/handler.ts` |
| JSON-RPC 2.0 message parsing | `packages/mcp/src/protocol/json-rpc.ts` |
| SSE transport layer | `packages/mcp/src/transports/sse.ts` |
| Tool registry | `packages/mcp/src/registry/service.ts` |
| Tool schema validation | `packages/mcp/src/registry/validation.ts` |
| Execution sandbox | `packages/mcp/src/sandbox/service.ts` |
| Streaming tool responses | `packages/mcp/src/sandbox/streaming.ts` |
| Tool versioning | `packages/mcp/src/registry/versioning.ts` |
| Error handler | `packages/mcp/src/protocol/errors.ts` |
| Tool discovery API | `packages/mcp/src/api/routes.ts` |
| MCP Gateway composition | `packages/mcp/src/gateway.ts` |
| MCP type definitions | `packages/mcp/src/types.ts` |
| Verification tests | `packages/mcp/src/__tests__/` |

## Architecture Constraints

- The protocol handler must fully conform to the MCP specification (JSON-RPC 2.0)
- Tool schemas are defined using JSON Schema (draft 2020-12)
- Execution sandbox timeout: 30 seconds default, configurable per tool
- Maximum tool output size: 1 MB (truncated with warning if exceeded)
- Tool versions follow semantic versioning — breaking changes require major version bump
- Tools are tenant-scoped — each workspace sees only its registered tools
- All tool invocations are logged to MongoDB with full request/response
- The gateway must support at least 100 concurrent tool executions
- Streaming tools emit `tool/call:progress` notifications every 500 ms
- The gateway is stateless — tool definitions are loaded from MongoDB at startup

## Completion Criteria

- [ ] Protocol handler parses and responds to valid JSON-RPC 2.0 messages
- [ ] SSE transport successfully streams events and responses
- [ ] Tool registry supports register, list, get, update, and deprecate operations
- [ ] Tool validation rejects invalid parameters with clear error messages
- [ ] Execution sandbox enforces timeout and resource limits correctly
- [ ] Streaming tools emit progress notifications during execution
- [ ] Tool versioning correctly resolves `^` and `~` semver ranges
- [ ] Error handler returns structured MCP error responses for all failure modes
- [ ] Discovery API correctly filters tools based on workspace and permissions
- [ ] All tests pass with > 85% coverage on core MCP logic
- [ ] `pnpm typecheck` and `pnpm lint` pass cleanly
