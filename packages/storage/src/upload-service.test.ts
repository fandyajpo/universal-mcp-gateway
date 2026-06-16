/* eslint-disable @typescript-eslint/unbound-method */

import { describe, expect, it, vi } from "vitest";

import type { StorageService } from "./storage-service";

function createMockStorageService(): StorageService {
  return {
    upload: vi.fn().mockResolvedValue(undefined),
    download: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn(),
    exists: vi.fn(),
    getMetadata: vi.fn(),
  };
}

interface MockDocumentRepo {
  create: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  deleteById: ReturnType<typeof vi.fn>;
}

function createMockDocumentRepo(): MockDocumentRepo {
  return {
    create: vi.fn(),
    findOne: vi.fn(),
    deleteById: vi.fn(),
  };
}

describe("UploadService", () => {
  it("uploadFile uploads to R2 and creates Document record", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const createRepo = vi.fn().mockReturnValue(mockRepo);
    const repoCreate = mockRepo.create;

    vi.mock("@repo/config", () => ({
      getConfig: () => ({
        r2: {
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          bucketName: "test-bucket",
          accountId: "test-account",
          publicUrl: "https://files.example.com",
        },
      }),
    }));

    const { createUploadService } = await import("./upload-service");

    repoCreate.mockResolvedValue({
      id: "doc-123",
      title: "report.pdf",
      source: "upload",
      contentType: "application/pdf",
      fileSize: 1024,
      fileKey: "ws-1/documents/2026-06-15/uuid-report.pdf",
      uploadedBy: "user-1",
      status: "ready",
    });

    const service = createUploadService(mockStorage, createRepo);
    const buffer = new Uint8Array([1, 2, 3, 4]);
    const result = await service.uploadFile(buffer, "report.pdf", "application/pdf", "ws-1", "user-1");

    expect(mockStorage.upload).toHaveBeenCalledOnce();
    expect(repoCreate).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      id: "doc-123",
      filename: "report.pdf",
      size: 4,
      contentType: "application/pdf",
    });
    expect(result.key).toContain("ws-1/documents/");
    expect(result.key).toContain("report.pdf");
    expect(result.url).toContain("https://files.example.com");

    vi.resetModules();
  });

  it("uploadFile rejects disallowed file types", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo);
    const buffer = new Uint8Array([1, 2, 3]);

    await expect(
      service.uploadFile(buffer, "malware.exe", "application/x-msdownload", "ws-1", "user-1"),
    ).rejects.toThrow('File type "application/x-msdownload" is not allowed');

    expect(mockStorage.upload).not.toHaveBeenCalled();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("uploadFile rejects oversized files", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo, { maxFileSize: 10 });
    const buffer = new Uint8Array(20);

    await expect(
      service.uploadFile(buffer, "big.txt", "text/plain", "ws-1", "user-1"),
    ).rejects.toThrow("File size exceeds maximum allowed size");

    expect(mockStorage.upload).not.toHaveBeenCalled();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("uploadFile cleans up R2 on Document creation failure", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const repoCreate = mockRepo.create;
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    repoCreate.mockRejectedValue(new Error("DB error"));

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo);
    const buffer = new Uint8Array([1, 2, 3]);

    await expect(
      service.uploadFile(buffer, "test.txt", "text/plain", "ws-1", "user-1"),
    ).rejects.toThrow("DB error");

    expect(mockStorage.upload).toHaveBeenCalledOnce();
    expect(mockStorage.delete).toHaveBeenCalledOnce();
  });

  it("uploadFiles processes batch with concurrency", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const repoCreate = mockRepo.create;
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    let callCount = 0;
    repoCreate.mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        id: `doc-${callCount}`,
        title: `file-${callCount}.txt`,
        source: "upload",
        fileKey: `ws-1/documents/2026-06-15/uuid-file-${callCount}.txt`,
        uploadedBy: "user-1",
        status: "ready",
      });
    });

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo);

    const files = [
      { buffer: new Uint8Array(1), filename: "a.txt", contentType: "text/plain", size: 1 },
      { buffer: new Uint8Array(2), filename: "b.txt", contentType: "text/plain", size: 2 },
      { buffer: new Uint8Array(3), filename: "c.txt", contentType: "text/plain", size: 3 },
    ];

    const results = await service.uploadFiles(files, "ws-1", "user-1", { concurrency: 2 });

    expect(results).toHaveLength(3);
    expect(mockStorage.upload).toHaveBeenCalledTimes(3);
    expect(repoCreate).toHaveBeenCalledTimes(3);
  });

  it("uploadFiles returns empty array for empty input", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo);
    const results = await service.uploadFiles([], "ws-1", "user-1");

    expect(results).toHaveLength(0);
    expect(mockStorage.upload).not.toHaveBeenCalled();
  });

  it("deleteFile soft-deletes Document and removes from R2", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const repoFindOne = mockRepo.findOne;
    const repoDeleteById = mockRepo.deleteById;
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    repoFindOne.mockResolvedValue({
      _id: "doc-123",
      title: "report.pdf",
      fileKey: "ws-1/documents/report.pdf",
    });

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo);
    await service.deleteFile("ws-1/documents/report.pdf", "ws-1");

    expect(repoFindOne).toHaveBeenCalledWith({ fileKey: "ws-1/documents/report.pdf" });
    expect(repoDeleteById).toHaveBeenCalledWith("doc-123");
    expect(mockStorage.delete).toHaveBeenCalledWith("ws-1/documents/report.pdf");
  });

  it("deleteFile throws when document not found", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    mockRepo.findOne.mockResolvedValue(null);

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo);

    await expect(
      service.deleteFile("nonexistent/file.pdf", "ws-1"),
    ).rejects.toThrow('Document with fileKey "nonexistent/file.pdf" not found');

    expect(mockStorage.delete).not.toHaveBeenCalled();
  });

  it("getFile returns UploadResult with download URL", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const repoFindOne = mockRepo.findOne;
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    repoFindOne.mockResolvedValue({
      _id: "doc-123",
      title: "photo.png",
      fileKey: "ws-1/documents/photo.png",
    });

    mockStorage.getMetadata = vi.fn().mockResolvedValue({
      key: "ws-1/documents/photo.png",
      size: 5000,
      contentType: "image/png",
      etag: '"abc123"',
      lastModified: new Date(),
    });

    vi.mock("@repo/config", () => ({
      getConfig: () => ({
        r2: {
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          bucketName: "test-bucket",
          accountId: "test-account",
          publicUrl: "https://files.example.com",
        },
      }),
    }));

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo);
    const result = await service.getFile("ws-1/documents/photo.png", "ws-1");

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: "doc-123",
      filename: "photo.png",
      size: 5000,
      contentType: "image/png",
    });
    expect(result?.url).toContain("https://files.example.com");

    vi.resetModules();
  });

  it("getFile returns null when document not found", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    mockRepo.findOne.mockResolvedValue(null);

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo);
    const result = await service.getFile("nonexistent/file.pdf", "ws-1");

    expect(result).toBeNull();
  });

  it("getFile returns null when R2 metadata not found", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    mockRepo.findOne.mockResolvedValue({
      _id: "doc-123",
      title: "missing.txt",
      fileKey: "ws-1/documents/missing.txt",
    });

    mockStorage.getMetadata = vi.fn().mockResolvedValue(undefined);

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo);
    const result = await service.getFile("ws-1/documents/missing.txt", "ws-1");

    expect(result).toBeNull();
  });

  it("createDocumentRepo factory is called with correct workspaceId", async () => {
    const mockStorage = createMockStorageService();
    const mockRepo = createMockDocumentRepo();
    const repoCreate = mockRepo.create;
    const createRepo = vi.fn().mockReturnValue(mockRepo);

    repoCreate.mockResolvedValue({
      id: "doc-1",
      title: "test.txt",
      source: "upload",
      fileKey: "ws-42/documents/2026-06-15/uuid-test.txt",
      uploadedBy: "user-1",
      status: "ready",
    });

    const { createUploadService } = await import("./upload-service");

    const service = createUploadService(mockStorage, createRepo);
    const buffer = new Uint8Array([1, 2, 3]);

    await service.uploadFile(buffer, "test.txt", "text/plain", "ws-42", "user-1");

    expect(createRepo).toHaveBeenCalledWith("ws-42");
  });
});
