import { S3Client } from "@aws-sdk/client-s3";

import type { R2ClientConfig } from "./types";
import { getConfig } from "@repo/config";
import { createLogger } from "@repo/logger";

const logger = createLogger("storage-client");

let client: S3Client | undefined;

function buildEndpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function createR2Client(config?: R2ClientConfig): S3Client {
  if (client) return client;

  const appConfig = getConfig();

  const accessKeyId = config?.accessKeyId ?? appConfig.r2.accessKeyId;
  const secretAccessKey = config?.secretAccessKey ?? appConfig.r2.secretAccessKey;
  const accountId = config?.accountId ?? appConfig.r2.accountId;

  client = new S3Client({
    region: "auto",
    endpoint: buildEndpoint(accountId),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  logger.info("R2 client created");

  return client;
}

export function getBucketName(config?: R2ClientConfig): string {
  const appConfig = getConfig();
  return config?.bucketName ?? appConfig.r2.bucketName;
}

export function getPublicUrl(config?: R2ClientConfig): string {
  const appConfig = getConfig();
  return config?.publicUrl ?? appConfig.r2.publicUrl;
}

export function resetR2Client(): void {
  client = undefined;
}
