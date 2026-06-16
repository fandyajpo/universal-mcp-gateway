import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

import { createR2Client, getBucketName } from "./client";
import type { StorageListItem, StorageListResult } from "./types";

export const STORAGE_ENTITIES = ["documents", "avatars", "attachments", "exports", "connectors", "temp"] as const;

export type StorageEntity = (typeof STORAGE_ENTITIES)[number];

export interface ParsedStorageKey {
  workspaceId: string;
  entity: string;
  date: string;
  uuid: string;
  originalName: string;
}

function sanitizeFilename(filename: string): string {
  let s = filename.toLowerCase();
  s = s.replace(/\0/g, "");
  s = s.replace(/[\\/]/g, "");
  s = s.replace(/\.\./g, "");
  s = s.replace(/\s+/g, "-");
  s = s.replace(/[^a-z0-9._-]/g, "");
  s = s.replace(/^[.-]+/, "");
  return s;
}

export function generateStorageKey(workspaceId: string, entity: string, filename: string): string {
  const date = new Date().toISOString().split("T")[0];
  const uuid = randomUUID();
  const sanitized = sanitizeFilename(filename);
  return `${workspaceId}/${entity}/${date}/${uuid}-${sanitized}`;
}

const STORAGE_KEY_PATTERN = /^([^/]+)\/([^/]+)\/(\d{4}-\d{2}-\d{2})\/([a-f0-9-]+)-(.*)$/;

function extractGroup(match: RegExpExecArray, index: number): string {
  const value = match[index];
  if (value === undefined) {
    throw new Error(`Missing capture group ${index} in storage key pattern`);
  }
  return value;
}

export function parseStorageKey(key: string): ParsedStorageKey | null {
  const match = STORAGE_KEY_PATTERN.exec(key);
  if (!match) return null;

  return {
    workspaceId: extractGroup(match, 1),
    entity: extractGroup(match, 2),
    date: extractGroup(match, 3),
    uuid: extractGroup(match, 4),
    originalName: extractGroup(match, 5),
  };
}

export async function listWorkspaceFiles(
  workspaceId: string,
  entity?: string,
  prefix?: string,
): Promise<StorageListResult> {
  const client = createR2Client();
  const bucketName = getBucketName();

  const searchPrefix = entity ? `${workspaceId}/${entity}/` : `${workspaceId}/`;
  const fullPrefix = prefix ? `${searchPrefix}${prefix}` : searchPrefix;

  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: fullPrefix,
  });

  const response = await client.send(command);

  const items: StorageListItem[] = (response.Contents ?? []).map((item) => ({
    key: item.Key ?? "",
    size: item.Size ?? 0,
    lastModified: item.LastModified ?? new Date(0),
    etag: item.ETag,
  }));

  return {
    items: items.filter((i) => i.key.length > 0),
    prefix: fullPrefix,
    isTruncated: response.IsTruncated ?? false,
    nextContinuationToken: response.NextContinuationToken,
  };
}
