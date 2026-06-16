"use client";

import { useCallback, useRef, useState } from "react";

import { uploadFileWithXhr } from "@/lib/file-upload";

import type { UploadFileResult } from "@/lib/file-upload";

export type UploadStatus = "pending" | "uploading" | "success" | "error";

export interface UploadFileItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  result?: UploadFileResult;
}

export interface UseFileUploadOptions {
  concurrency?: number;
  entity?: string;
}

export function useFileUpload(options: UseFileUploadOptions = {}): {
  files: UploadFileItem[];
  addFiles: (newFiles: File[]) => void;
  removeFile: (id: string) => void;
  retry: (id: string) => void;
  retryAll: () => void;
  cancel: () => void;
  upload: () => Promise<void>;
  isUploading: boolean;
  overallProgress: number;
} {
  const { concurrency = 3, entity } = options;

  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const currentIndexRef = useRef(0);
  const abortRef = useRef(false);

  const addFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...newFiles.map(
        (file): UploadFileItem => ({
          id: crypto.randomUUID(),
          file,
          status: "pending",
          progress: 0,
        }),
      ),
    ]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retry = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: "pending", progress: 0, error: undefined }
          : f,
      ),
    );
  }, []);

  const retryAll = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "error"
          ? { ...f, status: "pending", progress: 0, error: undefined }
          : f,
      ),
    );
  }, []);

  const cancel = useCallback(() => {
    abortRef.current = true;
    setIsUploading(false);
  }, []);

  const uploadFile = useCallback(
    async (item: UploadFileItem): Promise<void> => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: "uploading", progress: 0 }
            : f,
        ),
      );

      try {
        const result = await uploadFileWithXhr(item.file, {
          entity,
          onProgress: (progress: number) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, progress } : f)),
            );
          },
        });

        if (abortRef.current) return;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "success", progress: 100, result }
              : f,
          ),
        );
      } catch (error) {
        if (abortRef.current) return;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        );
      }
    },
    [entity],
  );

  const upload = useCallback(async () => {
    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0) return;

    abortRef.current = false;
    setIsUploading(true);
    currentIndexRef.current = 0;

    const queue = [...pending];

    async function processNext(): Promise<void> {
      while (currentIndexRef.current < queue.length) {
        if (abortRef.current) return;
        const item = queue[currentIndexRef.current];
        if (!item) return;
        currentIndexRef.current++;
        await uploadFile(item);
      }
    }

    const workers = Array.from(
      { length: Math.min(concurrency, queue.length) },
      () => processNext(),
    );

    await Promise.all(workers);
    setIsUploading(false);
  }, [files, concurrency, uploadFile]);

  const overallProgress =
    files.length > 0
      ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
      : 0;

  return {
    files,
    addFiles,
    removeFile,
    retry,
    retryAll,
    cancel,
    upload,
    isUploading,
    overallProgress,
  };
}
