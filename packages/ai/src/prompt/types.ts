export interface TemplateVariable {
  name: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface Template {
  name: string;
  content: string;
  version: number;
  description?: string;
  tags?: string[];
  variables?: TemplateVariable[];
}

export interface RenderOptions {
  version?: number;
  strict?: boolean;
  escapeHtml?: boolean;
}

export interface RenderResult {
  text: string;
  usedVariables: string[];
  unresolvedVariables: string[];
}

export interface CompiledTemplate {
  render: (variables: Record<string, unknown>, resolveNested?: (name: string) => string | undefined) => RenderResult;
  variables: TemplateVariable[];
  source: string;
}

export interface PromptRegistry {
  register(template: Template): void;
  get(name: string, version?: number): Template | undefined;
  list(tag?: string): Template[];
  render(name: string, variables: Record<string, unknown>, options?: RenderOptions): RenderResult;
  renderMessages(name: string, variables: Record<string, unknown>, options?: RenderOptions): { role: "system" | "user" | "assistant"; content: string }[];
  estimateTokens(name: string, variables: Record<string, unknown>): number;
  validate(name: string, variables: Record<string, unknown>): string[];
}

export interface PromptEngine {
  compile(template: string, expectedVariables?: TemplateVariable[]): CompiledTemplate;
}

export type SegmentNode =
  | { type: "text"; value: string }
  | { type: "variable"; name: string; defaultValue?: string }
  | { type: "if"; condition: string; children: SegmentNode[] }
  | { type: "each"; variable: string; children: SegmentNode[] }
  | { type: "include"; name: string };
