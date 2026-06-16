export interface R2ClientConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  accountId?: string;
  publicUrl?: string;
}

export interface StorageFile {
  key: string;
  body: Uint8Array | string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StorageFileInfo {
  key: string;
  size: number;
  contentType: string;
  etag: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export interface StorageListItem {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

export interface StorageListResult {
  items: StorageListItem[];
  prefix: string;
  isTruncated: boolean;
  nextContinuationToken?: string;
}

export interface UploadedFile {
  buffer: Uint8Array;
  filename: string;
  contentType: string;
  size: number;
}

export interface UploadResult {
  id: string;
  key: string;
  filename: string;
  size: number;
  contentType: string;
  url: string;
}

export interface UploadOptions {
  concurrency?: number;
  entity?: string;
}
