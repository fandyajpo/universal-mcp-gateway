import type { ConnectorStatus, ConnectorType } from "../enums";
import type { ConnectorId, WorkspaceId } from "../types/branded";

export type ConnectorConfig = Record<string, unknown>;

export interface Connector {
  id: ConnectorId;
  workspaceId: WorkspaceId;
  name: string;
  type: ConnectorType;
  config: ConnectorConfig;
  status: ConnectorStatus;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
