import * as http from "node:http";

import type { Transport } from "./transport";
import type { Logger } from "@repo/logger";

export interface SSETransportConfig {
  port?: number;
  host?: string;
  path?: string;
  logger: Logger;
}

export class SSETransport implements Transport {
  private server?: http.Server;
  private messageHandler?: (data: string) => void;
  private sseResponse?: http.ServerResponse;
  private logger: Logger;
  private port: number;
  private host: string;
  private path: string;
  private closed = false;

  constructor(config: SSETransportConfig) {
    this.logger = config.logger;
    this.port = config.port ?? 3001;
    this.host = config.host ?? "0.0.0.0";
    this.path = config.path ?? "/mcp";
  }

  onMessage(handler: (data: string) => void): void {
    this.messageHandler = handler;
  }

  async send(data: string): Promise<void> {
    if (this.closed || !this.sseResponse) return;
    return new Promise((resolve, reject) => {
      try {
        this.sseResponse!.write(`data: ${data}\n\n`);
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  async close(): Promise<void> {
    this.closed = true;
    return new Promise((resolve) => {
      if (this.sseResponse) {
        try { this.sseResponse.end(); } catch { /* ignore */ }
        this.sseResponse = undefined;
      }
      if (this.server) {
        this.server.close(() => { resolve(); });
      } else {
        resolve();
      }
    });
  }

  private sseEndpoint(req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    res.write(`data: ${JSON.stringify({ jsonrpc: "2.0", method: "endpoint", params: { path: this.path } })}\n\n`);

    this.sseResponse = res;

    req.on("close", () => {
      this.sseResponse = undefined;
    });
  }

  private messageEndpoint(req: http.IncomingMessage, res: http.ServerResponse): void {
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end();
      return;
    }

    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      res.writeHead(202, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ accepted: true }));

      if (this.messageHandler && body) {
        this.messageHandler(body);
      }
    });
  }

  async listen(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.url === `${this.path}/sse` || req.url === `${this.path}/sse/`) {
          this.sseEndpoint(req, res);
        } else if (req.url === this.path || req.url === `${this.path}/`) {
          this.messageEndpoint(req, res);
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      this.server.listen(this.port, this.host, () => {
        this.logger.info({ port: this.port, path: this.path }, "SSE transport listening");
        resolve(this.port);
      });

      this.server.on("error", (err) => {
        reject(err);
      });
    });
  }
}
