import * as readline from "node:readline";

import type { Transport } from "./transport";
import type { Logger } from "@repo/logger";

export class StdioTransport implements Transport {
  private messageHandler?: (data: string) => void;
  private rl?: readline.Interface;
  private logger: Logger;
  private closed = false;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  onMessage(handler: (data: string) => void): void {
    this.messageHandler = handler;
  }

  async send(data: string): Promise<void> {
    if (this.closed) return;
    return new Promise((resolve, reject) => {
      try {
        process.stdout.write(data + "\n");
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  async close(): Promise<void> {
    this.closed = true;
    if (this.rl) {
      this.rl.close();
    }
  }

  start(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      terminal: false,
    });

    this.rl.on("line", (line: string) => {
      const trimmed = line.trim();
      if (trimmed && this.messageHandler) {
        this.messageHandler(trimmed);
      }
    });

    this.rl.on("close", () => {
      this.logger.info("Stdio transport input closed");
    });
  }
}
