interface PartialToolCall {
  toolCallId: string;
  name: string;
  arguments: string;
  index: number;
}

export class ToolCallAccumulator {
  private partials = new Map<number, PartialToolCall>();

  addDelta(
    index: number,
    toolCallId: string,
    name: string,
    argsDelta: string,
  ): void {
    const existing = this.partials.get(index);

    if (existing) {
      existing.arguments += argsDelta;
      if (name) {
        existing.name = name;
      }
      if (toolCallId) {
        existing.toolCallId = toolCallId;
      }
    } else {
      this.partials.set(index, {
        toolCallId,
        name,
        arguments: argsDelta,
        index,
      });
    }
  }

  getCompleted(): {
    toolCallId: string;
    name: string;
    arguments: Record<string, unknown>;
  }[] | null {
    if (this.partials.size === 0) {
      return null;
    }

    const completed: {
      toolCallId: string;
      name: string;
      arguments: Record<string, unknown>;
    }[] = [];

    for (const partial of this.partials.values()) {
      try {
        const parsed = JSON.parse(partial.arguments) as Record<string, unknown>;
        completed.push({
          toolCallId: partial.toolCallId,
          name: partial.name,
          arguments: parsed,
        });
      } catch {
        return null;
      }
    }

    return completed;
  }

  hasPending(): boolean {
    return this.partials.size > 0;
  }

  reset(): void {
    this.partials.clear();
  }
}
