import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";

import { getBucketName } from "./client";
import type { R2ClientConfig, StorageFileInfo, StorageListResult, StorageListItem } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("storage-service");

export interface StorageService {
  upload(key: string, body: Uint8Array | string, contentType: string, metadata?: Record<string, string>): Promise<void>;
  download(key: string): Promise<Uint8Array | undefined>;
  delete(key: string): Promise<void>;
  list(prefix: string, maxKeys?: number, continuationToken?: string): Promise<StorageListResult>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<StorageFileInfo | undefined>;
}

export function createStorageService(client: S3Client, config?: R2ClientConfig): StorageService {
  const bucketName = getBucketName(config);

  async function upload(key: string, body: Uint8Array | string, contentType: string, metadata?: Record<string, string>): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    });

    await client.send(command);
    logger.debug(`Uploaded ${key} (${contentType})`);
  }

  async function download(key: string): Promise<Uint8Array | undefined> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await client.send(command);

    if (response.Body === undefined) {
      return undefined;
    }

    const bytes = await response.Body.transformToByteArray();
    logger.debug(`Downloaded ${key} (${bytes.length} bytes)`);
    return bytes;
  }

  async function deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
    logger.debug(`Deleted ${key}`);
  }

  async function list(prefix: string, maxKeys = 100, continuationToken?: string): Promise<StorageListResult> {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    });

    const response = await client.send(command);

    const items: StorageListItem[] = (response.Contents ?? []).filter((item): item is NonNullable<typeof item> & { Key: string } => {
      return item.Key !== undefined;
    }).map((item) => ({
      key: item.Key,
      size: item.Size ?? 0,
      lastModified: item.LastModified ?? new Date(0),
      etag: item.ETag,
    }));

    return {
      items,
      prefix,
      isTruncated: response.IsTruncated ?? false,
      nextContinuationToken: response.NextContinuationToken,
    };
  }

  async function exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await client.send(command);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  async function getMetadata(key: string): Promise<StorageFileInfo | undefined> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await client.send(command);

      return {
        key,
        size: response.ContentLength ?? 0,
        contentType: response.ContentType ?? "application/octet-stream",
        etag: response.ETag ?? "",
        lastModified: response.LastModified ?? new Date(0),
        metadata: response.Metadata,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "NotFound") {
        return undefined;
      }
      throw error;
    }
  }

  return {
    upload,
    download,
    delete: deleteObject,
    list,
    exists,
    getMetadata,
  };
}
