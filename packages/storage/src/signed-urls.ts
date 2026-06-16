import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createR2Client, getBucketName } from "./client";
import { getConfig } from "@repo/config";

const DEFAULT_EXPIRES_IN = 3600;

export async function generateDownloadUrl(key: string, expiresIn = DEFAULT_EXPIRES_IN): Promise<string> {
  const client = createR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function generateUploadUrl(key: string, contentType: string, expiresIn = DEFAULT_EXPIRES_IN): Promise<string> {
  const client = createR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export function getPublicUrl(key: string): string {
  const base = getConfig().r2.publicUrl;
  return base ? `${base}/${key}` : key;
}
