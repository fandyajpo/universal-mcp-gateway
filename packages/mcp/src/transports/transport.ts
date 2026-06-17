export interface Transport {
  onMessage(handler: (data: string) => void): void;
  send(data: string): Promise<void>;
  close(): Promise<void>;
}
