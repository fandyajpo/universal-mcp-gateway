import type { MethodHandler } from "../types";

export class MethodRegistry {
  private handlers = new Map<string, MethodHandler>();

  register(method: string, handler: MethodHandler): void {
    this.handlers.set(method, handler);
  }

  find(method: string): MethodHandler | undefined {
    return this.handlers.get(method);
  }

  has(method: string): boolean {
    return this.handlers.has(method);
  }

  remove(method: string): void {
    this.handlers.delete(method);
  }

  clear(): void {
    this.handlers.clear();
  }

  get methods(): string[] {
    return Array.from(this.handlers.keys());
  }
}
