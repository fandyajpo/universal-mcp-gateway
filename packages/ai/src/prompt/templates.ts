import type { Template } from "./types";

export const DEFAULT_SYSTEM_TEMPLATE: Template = {
  name: "system/default",
  content: `You are a helpful AI assistant. Answer the user's question accurately and concisely.

{{#if conversationHistory}}
Previous conversation:
{{#each conversationHistory}}
{{role}}: {{content}}
{{/each}}
{{/if}}

User question: {{query}}`,
  version: 1,
  description: "Default system prompt for general chat",
  tags: ["system", "chat"],
  variables: [
    { name: "query", required: true, description: "The user's question" },
    { name: "conversationHistory", required: false, description: "Array of previous messages with role and content" },
  ],
};

export const RAG_SYSTEM_TEMPLATE: Template = {
  name: "system/rag",
  content: `You are a helpful AI assistant. Answer the user's question based on the provided context. If the context does not contain enough information to answer the question, say so clearly. Do not make up information.

{{#if context}}
Context:
{{context}}
{{/if}}

{{#if conversationHistory}}
Previous conversation:
{{#each conversationHistory}}
{{role}}: {{content}}
{{/each}}
{{/if}}

User question: {{query}}`,
  version: 1,
  description: "System prompt for RAG-grounded chat with context",
  tags: ["system", "rag"],
  variables: [
    { name: "query", required: true, description: "The user's question" },
    { name: "context", required: false, description: "Retrieved context from knowledge base" },
    { name: "conversationHistory", required: false, description: "Array of previous messages" },
  ],
};

export const TOOLS_SYSTEM_TEMPLATE: Template = {
  name: "system/tools",
  content: `You are a helpful AI assistant with access to the following tools:

{{#if tools}}
Available tools:
{{#each tools}}
- {{name}}: {{description}}
{{/each}}
{{/if}}

Use tools when necessary to complete the user's request. If you use a tool, explain what you are doing.

{{#if conversationHistory}}
Previous conversation:
{{#each conversationHistory}}
{{role}}: {{content}}
{{/each}}
{{/if}}

User request: {{query}}`,
  version: 1,
  description: "System prompt for tool-using chat",
  tags: ["system", "tools"],
  variables: [
    { name: "query", required: true, description: "The user's request" },
    { name: "tools", required: false, description: "Array of available tools with name and description" },
    { name: "conversationHistory", required: false, description: "Array of previous messages" },
  ],
};

export const USER_QUERY_TEMPLATE: Template = {
  name: "user/query",
  content: `{{query}}`,
  version: 1,
  description: "Default user query wrapper",
  tags: ["user", "query"],
  variables: [
    { name: "query", required: true, description: "The user's query text" },
  ],
};

export const BUILT_IN_TEMPLATES: Template[] = [
  DEFAULT_SYSTEM_TEMPLATE,
  RAG_SYSTEM_TEMPLATE,
  TOOLS_SYSTEM_TEMPLATE,
  USER_QUERY_TEMPLATE,
];
