import { compileTemplate } from "./engine";
import { BUILT_IN_TEMPLATES } from "./templates";
import type { PromptRegistry, RenderOptions, Template } from "./types";

export function createPromptRegistry(): PromptRegistry {
  const templateMap = new Map<string, Map<number, Template>>();

  function init(): void {
    for (const tpl of BUILT_IN_TEMPLATES) {
      register(tpl);
    }
  }

  function register(template: Template): void {
    const name = template.name;
    if (!templateMap.has(name)) {
      templateMap.set(name, new Map());
    }
    const versions = templateMap.get(name);
    if (!versions) return;
    const existing = versions.get(template.version);
    if (existing) {
      versions.set(template.version, { ...existing, ...template });
    } else {
      versions.set(template.version, template);
    }
  }

  function get(name: string, version?: number): Template | undefined {
    const versions = templateMap.get(name);
    if (!versions) return undefined;
    if (version !== undefined) return versions.get(version);
    const maxVersion = Math.max(...versions.keys());
    return versions.get(maxVersion);
  }

  function list(tag?: string): Template[] {
    const all: Template[] = [];
    for (const versions of templateMap.values()) {
      const maxVersion = Math.max(...versions.keys());
      const tpl = versions.get(maxVersion);
      if (tpl) all.push(tpl);
    }
    if (tag) {
      return all.filter((t) => t.tags?.includes(tag));
    }
    return all;
  }

  function render(name: string, variables: Record<string, unknown>, options?: RenderOptions): ReturnType<PromptRegistry["render"]> {
    const template = get(name, options?.version);
    if (!template) {
      return { text: "", usedVariables: [], unresolvedVariables: [] };
    }

    const compiled = compileTemplate(template.content, template.variables);

    if (template.variables) {
      for (const v of template.variables) {
        if (v.required && variables[v.name] === undefined) {
          const msg = `Missing required variable: "${v.name}" in template "${name}"`;
          throw new Error(msg);
        }
      }
    }

    const result = compiled.render(variables, (nestedName) => {
      const nested = get(nestedName);
      return nested?.content;
    });

    if (options?.strict) {
      const providedNames = new Set(Object.keys(variables));
      for (const vn of result.usedVariables) {
        providedNames.delete(vn);
      }
      for (const unresolved of result.unresolvedVariables) {
        providedNames.delete(unresolved);
      }
      if (providedNames.size > 0) {
        const unused = [...providedNames].join(", ");
        const msg = `Unused variables provided to template "${name}": ${unused}`;
        throw new Error(msg);
      }
    }

    return result;
  }

  function renderMessages(
    name: string,
    variables: Record<string, unknown>,
    options?: RenderOptions,
  ): { role: "system" | "user" | "assistant"; content: string }[] {
    const result = render(name, variables, options);

    if (name.startsWith("system/")) {
      return [{ role: "system", content: result.text }];
    }

    if (name.startsWith("user/")) {
      return [{ role: "user", content: result.text }];
    }

    return [{ role: "user", content: result.text }];
  }

  function estimateTokens(name: string, variables: Record<string, unknown>): number {
    const result = render(name, variables);
    return Math.ceil(result.text.length / 4);
  }

  function validate(name: string, variables: Record<string, unknown>): string[] {
    const template = get(name);
    if (!template) {
      return [`Template "${name}" not found`];
    }

    const errors: string[] = [];

    if (template.variables) {
      for (const v of template.variables) {
        if (v.required && variables[v.name] === undefined) {
          errors.push(`Missing required variable: "${v.name}"`);
        }
      }
    }

    const compiled = compileTemplate(template.content, template.variables);
    const result = compiled.render(variables, (nestedName) => {
      const nested = get(nestedName);
      return nested?.content;
    });

    for (const unresolved of result.unresolvedVariables) {
      const variableDef = template.variables?.find((v) => v.name === unresolved);
      if (!variableDef || variableDef.required) {
        errors.push(`Unresolved variable: "${unresolved}"`);
      }
    }

    return errors;
  }

  init();

  return { register, get, list, render, renderMessages, estimateTokens, validate };
}
