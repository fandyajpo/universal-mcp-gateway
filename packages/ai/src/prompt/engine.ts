import type { CompiledTemplate, RenderResult, SegmentNode, TemplateVariable } from "./types";

function parseVariable(token: string): { name: string; defaultValue?: string } {
  const trimmed = token.trim();
  const colonIdx = trimmed.indexOf(":");
  if (colonIdx > 0 && !trimmed.startsWith("#") && !trimmed.startsWith(">")) {
    return { name: trimmed.slice(0, colonIdx).trim(), defaultValue: trimmed.slice(colonIdx + 1).trim() };
  }
  return { name: trimmed };
}

function parseTemplate(template: string): SegmentNode[] {
  const result: SegmentNode[] = [];
  let i = 0;

  while (i < template.length) {
    const nextOpen = template.indexOf("{{", i);

    if (nextOpen === -1) {
      result.push({ type: "text", value: template.slice(i) });
      break;
    }

    if (nextOpen > i) {
      result.push({ type: "text", value: template.slice(i, nextOpen) });
    }

    const closeIdx = template.indexOf("}}", nextOpen);
    if (closeIdx === -1) {
      result.push({ type: "text", value: template.slice(nextOpen) });
      break;
    }

    const token = template.slice(nextOpen + 2, closeIdx).trim();

    if (token.startsWith(">")) {
      const name = token.slice(1).trim();
      result.push({ type: "include", name });
      i = closeIdx + 2;
      continue;
    }

    if (token.startsWith("#if ")) {
      const condition = token.slice(4).trim();
      const endIdx = findMatchingEndTag(template, closeIdx + 2, "if");
      const innerContent = template.slice(closeIdx + 2, endIdx);
      const children = parseTemplate(innerContent);
      result.push({ type: "if", condition, children });
      i = endIdx + 7;
      continue;
    }

    if (token.startsWith("#each ")) {
      const variable = token.slice(6).trim();
      const endIdx = findMatchingEndTag(template, closeIdx + 2, "each");
      const innerContent = template.slice(closeIdx + 2, endIdx);
      const children = parseTemplate(innerContent);
      result.push({ type: "each", variable, children });
      i = endIdx + 9;
      continue;
    }

    if (token === "/if" || token === "/each") {
      result.push({ type: "text", value: token });
      i = closeIdx + 2;
      continue;
    }

    const parsed = parseVariable(token);
    result.push({ type: "variable", name: parsed.name, defaultValue: parsed.defaultValue });
    i = closeIdx + 2;
  }

  return result;
}

function findMatchingEndTag(template: string, startIdx: number, tagName: string): number {
  let depth = 1;
  let i = startIdx;

  while (i < template.length && depth > 0) {
    const nextOpen = template.indexOf("{{", i);
    if (nextOpen === -1) break;

    const closeIdx = template.indexOf("}}", nextOpen);
    if (closeIdx === -1) break;

    const token = template.slice(nextOpen + 2, closeIdx).trim();

    if (token === `#${tagName}` || token.startsWith(`#${tagName} `)) {
      depth++;
    } else if (token === `/${tagName}`) {
      depth--;
      if (depth === 0) {
        return nextOpen;
      }
    }

    i = closeIdx + 2;
  }

  return template.length;
}

function renderNode(
  node: SegmentNode,
  variables: Record<string, unknown>,
  resolveNested?: (name: string) => string | undefined,
  context?: unknown,
): string {
  switch (node.type) {
    case "text":
      return node.value;

    case "variable": {
      const value = resolveVariable(node.name, variables, context);
      if (value === undefined) {
        if (node.defaultValue !== undefined) {
          return node.defaultValue;
        }
        return "";
      }
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
      }
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }
      return "";
    }

    case "if": {
      const value = resolveVariable(node.condition, variables, context);
      if (value && value !== 0 && value !== false) {
        return renderNodes(node.children, variables, resolveNested, context);
      }
      return "";
    }

    case "each": {
      const list = resolveVariable(node.variable, variables, context);
      if (!Array.isArray(list)) {
        return "";
      }
      return list
        .map((item) => renderNodes(node.children, variables, resolveNested, item))
        .join("");
    }

    case "include": {
      if (!resolveNested) {
        return "";
      }
      const nestedContent = resolveNested(node.name);
      if (nestedContent === undefined) {
        return "";
      }
      const compiled = compileTemplate(nestedContent, []);
      const nestedResult = compiled.render(variables, resolveNested);
      return nestedResult.text;
    }
  }
}

function renderNodes(
  nodes: SegmentNode[],
  variables: Record<string, unknown>,
  resolveNested?: (name: string) => string | undefined,
  context?: unknown,
): string {
  return nodes.map((node) => renderNode(node, variables, resolveNested, context)).join("");
}

function resolveVariable(
  name: string,
  variables: Record<string, unknown>,
  context?: unknown,
): unknown {
  if (name === "this") {
    return context;
  }
  return variables[name];
}

function extractVariableNames(nodes: SegmentNode[]): Set<string> {
  const names = new Set<string>();
  for (const node of nodes) {
    switch (node.type) {
      case "variable":
        names.add(node.name);
        break;
      case "if":
        names.add(node.condition);
        for (const n of extractVariableNames(node.children)) {
          names.add(n);
        }
        break;
      case "each":
        for (const n of extractVariableNames(node.children)) {
          names.add(n);
        }
        break;
      case "include":
        break;
    }
  }
  return names;
}

export function compileTemplate(
  template: string,
  expectedVariables?: TemplateVariable[],
): CompiledTemplate {
  const nodes = parseTemplate(template);
  const extractedNames = extractVariableNames(nodes);

  const variables: TemplateVariable[] = expectedVariables ?? [];
  if (!expectedVariables) {
    for (const name of extractedNames) {
      if (name === "this") continue;
      variables.push({ name, required: true });
    }
  }

  return {
    render(vars, resolveNested): RenderResult {
      const text = renderNodes(nodes, vars, resolveNested);

      const usedVariables: string[] = [];
      const unresolvedVariables: string[] = [];

      for (const name of extractedNames) {
        if (name === "this") continue;
        const value = vars[name];
        if (value !== undefined && value !== null) {
          usedVariables.push(name);
        } else {
          unresolvedVariables.push(name);
        }
      }

      return { text, usedVariables, unresolvedVariables };
    },
    variables,
    source: template,
  };
}

export function createPromptEngine(): { compile: (template: string, expectedVariables?: TemplateVariable[]) => CompiledTemplate } {
  return { compile: compileTemplate };
}
