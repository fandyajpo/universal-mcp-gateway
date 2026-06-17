import { describe, it, expect, beforeEach } from "vitest";

import { createPromptRegistry, compileTemplate, estimateTokens } from "../prompt";
import type { PromptRegistry } from "../prompt/types";

describe("Prompt Template System", () => {
  let registry: PromptRegistry;

  beforeEach(() => {
    registry = createPromptRegistry();
  });

  describe("render", () => {
    it("renders system/default template", () => {
      const result = registry.render("system/default", { query: "Hello" });

      expect(result.text).toContain("Hello");
      expect(result.text).toContain("AI assistant");
    });

    it("renders system/rag template with context", () => {
      const result = registry.render("system/rag", {
        query: "What is X?",
        context: "X is a variable",
      });

      expect(result.text).toContain("What is X?");
      expect(result.text).toContain("X is a variable");
    });

    it("renders user/query template", () => {
      const result = registry.render("user/query", { query: "Test" });

      expect(result.text).toBe("Test");
    });

    it("renders variable with default value", () => {
      const compiled = compileTemplate("{{greeting:Hello}}");
      const result = compiled.render({});

      expect(result.text).toBe("Hello");
    });

    it("renders variable with provided value over default", () => {
      const compiled = compileTemplate("{{greeting:Hello}}");
      const result = compiled.render({ greeting: "Hi" });

      expect(result.text).toBe("Hi");
    });

    it("handles conditional sections", () => {
      const compiled = compileTemplate("Before{{#if show}}Middle{{/if}}After");
      const withCondition = compiled.render({ show: true });
      const withoutCondition = compiled.render({ show: false });

      expect(withCondition.text).toBe("BeforeMiddleAfter");
      expect(withoutCondition.text).toBe("BeforeAfter");
    });

    it("handles iteration with each", () => {
      const compiled = compileTemplate("{{#each items}}{{this}}{{/each}}");
      const result = compiled.render({ items: ["A", "B", "C"] });

      expect(result.text).toBe("ABC");
    });

    it("handles nested templates with > syntax", () => {
      registry.register({
        name: "shared/header",
        content: "Header: {{title}}",
        version: 1,
      });

      const compiled = compileTemplate("{{> shared/header}} Body");
      const result = compiled.render({ title: "Hello" }, (name) => {
        const t = registry.get(name);
        return t?.content;
      });

      expect(result.text).toBe("Header: Hello Body");
    });

    it("tracks used and unresolved variables", () => {
      const compiled = compileTemplate("{{greeting}} {{name}}");
      const result = compiled.render({ greeting: "Hi" });

      expect(result.usedVariables).toContain("greeting");
      expect(result.unresolvedVariables).toContain("name");
    });

    it("throws on missing required variable", () => {
      expect(() => {
        registry.render("system/default", {});
      }).toThrow("Missing required variable");
    });

    it("supports version-specific rendering", () => {
      registry.register({
        name: "system/default",
        content: "v1 content",
        version: 1,
      });
      registry.register({
        name: "system/default",
        content: "v2 content",
        version: 2,
      });

      const v1Result = registry.render("system/default", { query: "x" }, { version: 1 });
      expect(v1Result.text).toContain("v1 content");
    });
  });

  describe("renderMessages", () => {
    it("returns system message for system/ template", () => {
      const messages = registry.renderMessages("system/default", { query: "Hi" });

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("system");
    });

    it("returns user message for user/ template", () => {
      const messages = registry.renderMessages("user/query", { query: "Hi" });

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("user");
    });
  });

  describe("estimateTokens", () => {
    it("returns token estimate for a template", () => {
      const count = registry.estimateTokens("system/default", { query: "Hello world" });

      expect(count).toBeGreaterThan(0);
    });

    it("returns higher count for longer text", () => {
      const short = registry.estimateTokens("user/query", { query: "Hi" });
      const long = registry.estimateTokens("user/query", { query: "Hello world this is a longer query" });

      expect(long).toBeGreaterThan(short);
    });
  });

  describe("validate", () => {
    it("returns no errors for valid template with variables", () => {
      const errors = registry.validate("user/query", { query: "Hi" });
      expect(errors).toHaveLength(0);
    });

    it("returns error for missing required variable", () => {
      const errors = registry.validate("system/default", {});
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("list", () => {
    it("lists all registered templates", () => {
      const templates = registry.list();
      expect(templates.length).toBeGreaterThanOrEqual(4);
    });

    it("filters by tag", () => {
      const systemTemplates = registry.list("system");
      expect(systemTemplates.length).toBeGreaterThanOrEqual(3);
    });
  });
});
