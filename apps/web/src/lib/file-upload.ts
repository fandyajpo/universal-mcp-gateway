export interface UploadFileOptions {
  entity?: string;
  onProgress?: (percentage: number) => void;
}

export interface UploadFileResult {
  id: string;
  key: string;
  filename: string;
  size: number;
  contentType: string;
  url: string;
}

export interface UploadFilesResponse {
  files: UploadFileResult[];
}

export async function uploadFile(
  file: File,
  options?: UploadFileOptions,
): Promise<UploadFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.entity) {
    formData.append("entity", options.entity);
  }

  const response = await fetch("/api/files/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Upload failed with status ${response.status}`);
  }

  const result = (await response.json()) as UploadFilesResponse;
  const first = result.files[0];
  if (!first) {
    throw new Error("Upload returned no files");
  }
  return first;
}

export async function uploadFiles(
  files: File[],
  options?: UploadFileOptions,
): Promise<UploadFileResult[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("file", file);
  }
  if (options?.entity) {
    formData.append("entity", options.entity);
  }

  const response = await fetch("/api/files/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Upload failed with status ${response.status}`);
  }

  const result = (await response.json()) as UploadFilesResponse;
  return result.files;
}

export async function uploadFileWithXhr(
  file: File,
  options?: UploadFileOptions,
): Promise<UploadFileResult> {
  return new Promise<UploadFileResult>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.entity) {
      formData.append("entity", options.entity);
    }

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event: ProgressEvent) => {
      if (!options?.onProgress) return;
      if (event.lengthComputable && event.total > 0) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as UploadFilesResponse;
          const first = result.files[0];
          if (!first) {
            reject(new Error("Upload returned no files"));
            return;
          }
          resolve(first);
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(body.error ?? `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.open("POST", "/api/files/upload");
    xhr.send(formData);
  });
}

export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(`/api/files/${fileId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Delete failed with status ${response.status}`);
  }
}

export async function getFileMetadata(fileId: string): Promise<UploadFileResult | null> {
  const response = await fetch(`/api/files/${fileId}/metadata`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to fetch metadata with status ${response.status}`);
  }

  return response.json() as Promise<UploadFileResult>;
}
