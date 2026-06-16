import { describe, expect, it, vi } from "vitest";

import type { S3Client } from "@aws-sdk/client-s3";

function createMockS3Client(): { client: S3Client; sendMock: ReturnType<typeof vi.fn> } {
  const sendMock = vi.fn();

  const mock = {
    send: sendMock,
    config: {},
    middlewareStack: {
      identify: vi.fn(),
      add: vi.fn(),
      addRelativeTo: vi.fn(),
      clone: vi.fn(),
      concat: vi.fn(),
      remove: vi.fn(),
      removeByTag: vi.fn(),
      resolve: vi.fn().mockReturnValue({ handler: vi.fn() }),
    },
    destroy: vi.fn(),
  } as unknown as S3Client;

  return { client: mock, sendMock };
}

describe("StorageService", () => {
  it("upload sends PutObjectCommand with correct params", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    const body = new Uint8Array([1, 2, 3]);
    await service.upload("test.txt", body, "text/plain", { author: "test" });

    expect(sendMock).toHaveBeenCalledOnce();
    const command = sendMock.mock.calls[0]?.[0];
    expect(command.constructor.name).toBe("PutObjectCommand");
    expect(command.input).toMatchObject({
      Bucket: "test-bucket",
      Key: "test.txt",
      ContentType: "text/plain",
      Metadata: { author: "test" },
    });
  });

  it("download returns bytes from GetObjectCommand", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();
    const transformMock = vi.fn().mockResolvedValue(new Uint8Array([4, 5, 6]));
    sendMock.mockResolvedValue({
      Body: { transformToByteArray: transformMock },
    });

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    const result = await service.download("test.txt");

    expect(result).toBeDefined();
    expect(result).toEqual(new Uint8Array([4, 5, 6]));
    expect(sendMock).toHaveBeenCalledOnce();
    const command = sendMock.mock.calls[0]?.[0];
    expect(command.constructor.name).toBe("GetObjectCommand");
  });

  it("download returns undefined when body is missing", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();
    sendMock.mockResolvedValue({ Body: undefined });

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    const result = await service.download("missing.txt");
    expect(result).toBeUndefined();
  });

  it("delete sends DeleteObjectCommand", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    await service.delete("test.txt");

    expect(sendMock).toHaveBeenCalledOnce();
    const command = sendMock.mock.calls[0]?.[0];
    expect(command.constructor.name).toBe("DeleteObjectCommand");
    expect(command.input.Key).toBe("test.txt");
  });

  it("list returns items from ListObjectsV2Command", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();
    const now = new Date();
    sendMock.mockResolvedValue({
      Contents: [
        { Key: "dir/file1.txt", Size: 100, LastModified: now, ETag: '"abc"' },
        { Key: "dir/file2.txt", Size: 200, LastModified: now, ETag: '"def"' },
      ],
      IsTruncated: false,
      NextContinuationToken: undefined,
    });

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    const result = await service.list("dir/");

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ key: "dir/file1.txt", size: 100 });
    expect(result.items[1]).toMatchObject({ key: "dir/file2.txt", size: 200 });
    expect(result.isTruncated).toBe(false);
  });

  it("list handles empty results", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();
    sendMock.mockResolvedValue({ Contents: undefined, IsTruncated: false });

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    const result = await service.list("nonexistent/");
    expect(result.items).toHaveLength(0);
    expect(result.isTruncated).toBe(false);
  });

  it("exists returns true when object found", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();
    sendMock.mockResolvedValue(undefined);

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    const result = await service.exists("test.txt");
    expect(result).toBe(true);
  });

  it("exists returns false when object not found", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();
    const notFoundError = new Error("Not Found");
    notFoundError.name = "NotFound";
    sendMock.mockRejectedValue(notFoundError);

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    const result = await service.exists("missing.txt");
    expect(result).toBe(false);
  });

  it("exists rethrows non-NotFound errors", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();
    const otherError = new Error("Access Denied");
    otherError.name = "AccessDenied";
    sendMock.mockRejectedValue(otherError);

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    await expect(service.exists("test.txt")).rejects.toThrow("Access Denied");
  });

  it("getMetadata returns file info from HeadObjectCommand", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();
    const now = new Date();
    sendMock.mockResolvedValue({
      ContentLength: 1024,
      ContentType: "image/png",
      ETag: '"xyz"',
      LastModified: now,
      Metadata: { width: "800" },
    });

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    const result = await service.getMetadata("photo.png");

    expect(result).toBeDefined();
    expect(result).toMatchObject({
      key: "photo.png",
      size: 1024,
      contentType: "image/png",
      etag: '"xyz"',
      metadata: { width: "800" },
    });
  });

  it("getMetadata returns undefined when object not found", async () => {
    const { client: mockClient, sendMock } = createMockS3Client();
    const notFoundError = new Error("Not Found");
    notFoundError.name = "NotFound";
    sendMock.mockRejectedValue(notFoundError);

    const { createStorageService } = await import("./storage-service");
    const service = createStorageService(mockClient, { bucketName: "test-bucket" });

    const result = await service.getMetadata("missing.txt");
    expect(result).toBeUndefined();
  });
});

describe("R2Client", () => {
  it("createR2Client creates a configured S3Client", async () => {
    vi.mock("@repo/config", () => ({
      getConfig: () => ({
        r2: {
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          bucketName: "test-bucket",
          accountId: "test-account",
          publicUrl: "",
        },
      }),
    }));

    const { createR2Client } = await import("./client");
    const { S3Client } = await import("@aws-sdk/client-s3");

    const client = createR2Client();
    expect(client).toBeInstanceOf(S3Client);
    vi.resetModules();
  });

  it("createR2Client returns the same instance on subsequent calls", async () => {
    vi.mock("@repo/config", () => ({
      getConfig: () => ({
        r2: {
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          bucketName: "test-bucket",
          accountId: "test-account",
          publicUrl: "",
        },
      }),
    }));

    const { createR2Client, resetR2Client } = await import("./client");

    const first = createR2Client();
    const second = createR2Client();
    expect(first).toBe(second);

    resetR2Client();
    const third = createR2Client();
    expect(third).not.toBe(first);
    vi.resetModules();
  });
});
