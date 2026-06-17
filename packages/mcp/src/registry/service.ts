import { ToolCache } from "./cache";
import type { Logger } from "@repo/logger";
import type {
  ToolDefinition,
  ToolHandler,
  ToolMetadata,
  RegisterToolInput,
  UpdateToolInput,
  DeprecateToolInput,
  ToolFilter,
  RegistryConfig,
  RegistryResponse,
} from "./types";
import { DEFAULT_REGISTRY_CONFIG } from "./types";
import { validateToolName, validateJSONSchema, validateToolFilter } from "./validation";

interface ToolDoc {
  workspaceId: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  handlerRef: string;
  metadata: {
    version: string;
    author: string;
    tags: string[];
    categories: string[];
    deprecated: boolean;
    deprecationMessage?: string;
    removed: boolean;
  };
}

export interface ToolRegistryOptions {
  model: {
    findOne: (filter: Record<string, unknown>) => Promise<ToolDoc | null>;
    create: (doc: Record<string, unknown>) => Promise<ToolDoc>;
    updateOne: (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => Promise<{ modifiedCount: number }>;
    deleteOne: (filter: Record<string, unknown>) => Promise<{ deletedCount: number }>;
    countDocuments: (filter: Record<string, unknown>) => Promise<number>;
    find: (filter: Record<string, unknown>) => Promise<ToolDoc[]>;
    distinct: (field: string, filter: Record<string, unknown>) => Promise<string[]>;
  };
  logger: Logger;
  config?: Partial<RegistryConfig>;
}

function buildMetadata(input: RegisterToolInput): ToolMetadata {
  return {
    version: "1.0.0",
    author: input.metadata?.author ?? "system",
    tags: input.metadata?.tags ?? [],
    categories: input.metadata?.categories ?? [],
    deprecated: false,
    removed: false,
    ...input.metadata,
  };
}

function toDefinition(tool: ToolDoc, handler: ToolHandler): ToolDefinition {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    handler,
    handlerRef: tool.handlerRef,
    metadata: {
      version: tool.metadata.version,
      author: tool.metadata.author,
      tags: tool.metadata.tags,
      categories: tool.metadata.categories,
      deprecated: tool.metadata.deprecated,
      deprecationMessage: tool.metadata.deprecationMessage,
      removed: tool.metadata.removed,
    },
  };
}

export function createToolRegistry(opts: ToolRegistryOptions) {
  const cache = new ToolCache(opts.config?.cacheTTLMs ?? DEFAULT_REGISTRY_CONFIG.cacheTTLMs);
  const logger = opts.logger;
  const model = opts.model;
  const handlerMap = new Map<string, ToolHandler>();
  const config = { ...DEFAULT_REGISTRY_CONFIG, ...opts.config };

  function handlerKey(workspaceId: string, name: string): string {
    return `${workspaceId}:${name}`;
  }

  function buildMongoFilter(
    workspaceId: string,
    filter?: ToolFilter,
  ): Record<string, unknown> {
    void filter;
    const mongoFilter: Record<string, unknown> = {
      workspaceId,
      "metadata.removed": filter?.includeRemoved ?? false,
    };
    if (!filter?.includeDeprecated) {
      mongoFilter["metadata.deprecated"] = false;
    }
    if (filter?.category) {
      mongoFilter["metadata.categories"] = filter.category;
    }
    if (filter?.tag) {
      mongoFilter["metadata.tags"] = filter.tag;
    }
    return mongoFilter;
  }

  async function registerTool(
    workspaceId: string,
    input: RegisterToolInput,
  ): Promise<RegistryResponse<ToolDefinition>> {
    const nameErr = validateToolName(input.name);
    if (nameErr) {
      return { ok: false, error: nameErr };
    }

    const schemaErr = validateJSONSchema(input.inputSchema);
    if (schemaErr) {
      return { ok: false, error: schemaErr };
    }

    if (input.outputSchema !== undefined) {
      const outputErr = validateJSONSchema(input.outputSchema);
      if (outputErr) {
        return { ok: false, error: `outputSchema: ${outputErr}` };
      }
    }

    const existing = await model.findOne({ workspaceId, name: input.name });
    if (existing && !existing.metadata.removed) {
      return { ok: false, error: `Tool '${input.name}' already exists in workspace ${workspaceId}` };
    }

    const count = await model.countDocuments({ workspaceId, "metadata.removed": false });
    if (count >= config.maxToolsPerWorkspace) {
      return { ok: false, error: `Maximum ${config.maxToolsPerWorkspace} tools per workspace reached` };
    }

    const metadata = buildMetadata(input);
    const handlerRef = `builtin:${input.name}`;

    const doc = await model.create({
      workspaceId,
      name: input.name,
      description: input.description,
      inputSchema: input.inputSchema,
      outputSchema: input.outputSchema,
      handlerRef,
      metadata,
    });

    const hKey = handlerKey(workspaceId, input.name);
    handlerMap.set(hKey, input.handler);

    const definition = toDefinition(doc as ToolDoc, input.handler);
    cache.set(workspaceId, input.name, definition);

    logger.info({ workspaceId, toolName: input.name }, "Tool registered");
    return { ok: true, data: definition };
  }

  async function getTool(
    workspaceId: string,
    name: string,
  ): Promise<RegistryResponse<ToolDefinition>> {
    const cached = cache.get(workspaceId, name);
    if (cached) {
      return { ok: true, data: cached };
    }

    const doc = await model.findOne({ workspaceId, name });
    if (!doc) {
      return { ok: false, error: `Tool '${name}' not found in workspace ${workspaceId}` };
    }

    const hKey = handlerKey(workspaceId, name);
    const handler = handlerMap.get(hKey);
    if (!handler) {
      return { ok: false, error: `Handler for tool '${name}' is not loaded` };
    }

    const toolDoc = doc as ToolDoc;
    const definition = toDefinition(toolDoc, handler);
    cache.set(workspaceId, name, definition);
    return { ok: true, data: definition };
  }

  async function listTools(
    workspaceId: string,
    filter?: ToolFilter,
  ): Promise<RegistryResponse<ToolDefinition[]>> {
    const filterErr = filter ? validateToolFilter(filter) : undefined;
    if (filterErr) {
      return { ok: false, error: filterErr };
    }

    const mongoFilter = buildMongoFilter(workspaceId, filter);
    const docs = await model.find(mongoFilter);

    const definitions: ToolDefinition[] = [];
    for (const doc of docs) {
      const hKey = handlerKey(workspaceId, doc.name);
      const handler = handlerMap.get(hKey);
      if (handler) {
        const def = toDefinition(doc as unknown as ToolDoc, handler);
        definitions.push(def);
        cache.set(workspaceId, doc.name, def);
      }
    }

    return { ok: true, data: definitions };
  }

  async function updateTool(
    workspaceId: string,
    name: string,
    updates: UpdateToolInput,
  ): Promise<RegistryResponse<ToolDefinition>> {
    const existing = await getTool(workspaceId, name);
    if (!existing.ok) {
      return existing;
    }

    const setFields: Record<string, unknown> = {};
    if (updates.description !== undefined) {
      setFields.description = updates.description;
    }
    if (updates.inputSchema !== undefined) {
      const schemaErr = validateJSONSchema(updates.inputSchema);
      if (schemaErr) {
        return { ok: false, error: schemaErr };
      }
      setFields.inputSchema = updates.inputSchema;
    }
    if (updates.outputSchema !== undefined) {
      const outputErr = validateJSONSchema(updates.outputSchema);
      if (outputErr) {
        return { ok: false, error: `outputSchema: ${outputErr}` };
      }
      setFields.outputSchema = updates.outputSchema;
    }

    const currentVersion = existing.data.metadata.version;
    const parts = currentVersion.split(".").map(Number);
    const newVersion = `${parts[0]}.${parts[1]}.${(parts[2] ?? 0) + 1}`;
    setFields["metadata.version"] = newVersion;

    if (updates.metadata) {
      if (updates.metadata.author !== undefined) {
        setFields["metadata.author"] = updates.metadata.author;
      }
      if (updates.metadata.tags !== undefined) {
        setFields["metadata.tags"] = updates.metadata.tags;
      }
      if (updates.metadata.categories !== undefined) {
        setFields["metadata.categories"] = updates.metadata.categories;
      }
    }

    await model.updateOne({ workspaceId, name }, { $set: setFields });

    if (updates.handler) {
      const hKey = handlerKey(workspaceId, name);
      handlerMap.set(hKey, updates.handler);
    }

    cache.delete(workspaceId, name);
    const refreshed = await getTool(workspaceId, name);
    if (!refreshed.ok) {
      return refreshed;
    }

    logger.info({ workspaceId, toolName: name, newVersion }, "Tool updated");
    return refreshed;
  }

  async function deprecateTool(
    workspaceId: string,
    name: string,
    input: DeprecateToolInput,
  ): Promise<RegistryResponse<ToolDefinition>> {
    const existing = await getTool(workspaceId, name);
    if (!existing.ok) {
      return existing;
    }

    await model.updateOne(
      { workspaceId, name },
      {
        $set: {
          "metadata.deprecated": true,
          "metadata.deprecationMessage": input.deprecationMessage ?? "",
        },
      },
    );

    cache.delete(workspaceId, name);
    const refreshed = await getTool(workspaceId, name);
    if (!refreshed.ok) {
      return refreshed;
    }

    logger.info({ workspaceId, toolName: name }, "Tool deprecated");
    return refreshed;
  }

  async function removeTool(
    workspaceId: string,
    name: string,
  ): Promise<RegistryResponse<undefined>> {
    const existing = await getTool(workspaceId, name);
    if (!existing.ok) {
      return existing;
    }

    await model.updateOne(
      { workspaceId, name },
      { $set: { "metadata.removed": true } },
    );

    cache.delete(workspaceId, name);
    handlerMap.delete(handlerKey(workspaceId, name));

    logger.info({ workspaceId, toolName: name }, "Tool removed");
    return { ok: true, data: undefined };
  }

  async function getToolVersions(
    workspaceId: string,
    name: string,
  ): Promise<RegistryResponse<string[]>> {
    const existing = await getTool(workspaceId, name);
    if (!existing.ok) {
      return existing;
    }
    return { ok: true, data: [existing.data.metadata.version] };
  }

  async function loadHandlers(
    handlerLoader: (handlerRef: string) => ToolHandler | undefined,
  ): Promise<void> {
    const docs = await model.find({ "metadata.removed": false });
    let loaded = 0;
    for (const doc of docs) {
      const handler = handlerLoader(doc.handlerRef);
      if (handler) {
        const hKey = handlerKey(doc.workspaceId, doc.name);
        handlerMap.set(hKey, handler);
        loaded++;
      }
    }
    logger.info({ loaded, total: docs.length }, "Tool handlers loaded from registry");
  }

  return {
    registerTool,
    getTool,
    listTools,
    updateTool,
    deprecateTool,
    removeTool,
    getToolVersions,
    loadHandlers,
    getConfig: () => ({ ...config }),
    invalidateCache: () => cache.invalidateAll(),
  };
}

export type ToolRegistry = ReturnType<typeof createToolRegistry>;
