"use client";

import { AlertCircle, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { UploadProgress } from "@/components/pdf/upload-progress";
import { useToastStore } from "@/lib/stores/toast";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["application/pdf"];
const ACCEPTED_EXTENSIONS = [".pdf", ".PDF"];

interface PdfUploadZoneProps {
  onUploadComplete?: (documentId: string) => void;
  className?: string;
}

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  documentId?: string;
}

export function PdfUploadZone({ onUploadComplete, className }: PdfUploadZoneProps): React.ReactElement {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToastStore((s) => s.toast);

  const addItem = useCallback((file: File) => {
    const item: UploadItem = {
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "pending",
    };
    setItems((prev) => [...prev, item]);
    return item;
  }, []);

  const updateItem = useCallback((id: string, update: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...update } : item)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const uploadFile = useCallback(
    (item: UploadItem) => {
      return new Promise<void>((resolve) => {
        const formData = new FormData();
        formData.append("file", item.file);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event: ProgressEvent) => {
          if (event.lengthComputable && event.total > 0) {
            const progress = Math.round((event.loaded / event.total) * 100);
            updateItem(item.id, { progress, status: "uploading" });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText) as { documentId: string };
              updateItem(item.id, { status: "success", progress: 100, documentId: result.documentId });
              onUploadComplete?.(result.documentId);
              toast({ title: "Upload complete", description: `${item.file.name} uploaded successfully.`, variant: "success" });
            } catch {
              updateItem(item.id, { status: "error", error: "Invalid response from server" });
              toast({ title: "Upload failed", description: `${item.file.name}: invalid response.`, variant: "destructive" });
            }
          } else {
            let errorMsg = `Upload failed with status ${xhr.status}`;
            try {
              const body = JSON.parse(xhr.responseText) as { error?: string };
              if (body.error) errorMsg = body.error;
            } catch {
              // use default message
            }
            updateItem(item.id, { status: "error", error: errorMsg });
            toast({ title: "Upload failed", description: `${item.file.name}: ${errorMsg}`, variant: "destructive" });
          }
          resolve();
        });

        xhr.addEventListener("error", () => {
          updateItem(item.id, { status: "error", error: "Network error" });
          toast({ title: "Upload failed", description: `${item.file.name}: network error.`, variant: "destructive" });
          resolve();
        });

        xhr.open("POST", "/api/documents/pdf/upload");
        xhr.send(formData);
      });
    },
    [updateItem, onUploadComplete, toast],
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newItems: UploadItem[] = [];
      for (const file of Array.from(fileList)) {
        const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
        const hasValidMime = ACCEPTED_MIME_TYPES.includes(file.type);
        const hasValidExt = ACCEPTED_EXTENSIONS.includes(ext) || ACCEPTED_EXTENSIONS.includes("." + (file.name.split(".").pop()?.toLowerCase() ?? ""));

        if (!hasValidMime && !hasValidExt) {
          toast({ title: "Invalid file", description: `${file.name} is not a PDF file.`, variant: "destructive" });
          continue;
        }
        if (file.size === 0) {
          toast({ title: "Empty file", description: `${file.name} is empty.`, variant: "destructive" });
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "File too large", description: `${file.name} exceeds 50 MB limit.`, variant: "destructive" });
          continue;
        }
        const item = addItem(file);
        newItems.push(item);
      }
      for (const item of newItems) {
        void uploadFile(item);
      }
    },
    [addItem, uploadFile, toast],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        className={[
          "flex cursor-pointer flex-col items-center justify-center",
          "rounded-lg border-2 border-dashed p-8",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/50",
        ].join(" ")}
        aria-label="PDF upload drop zone. Click or drag and drop to upload."
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple={false}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />
        {isDragOver ? (
          <p className="text-sm font-medium text-primary">Drop PDF here</p>
        ) : (
          <>
            <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Upload PDF Document</p>
            <p className="mt-1 text-xs text-muted-foreground">Drag & drop or click to browse (max 50 MB)</p>
          </>
        )}
      </div>

      {items.length > 0 && (
        <ul className="space-y-2" aria-label="Upload queue">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                {item.status === "uploading" && <UploadProgress progress={item.progress} fileName={item.file.name} />}
                {item.status === "error" && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive" role="alert">
                    <AlertCircle className="h-3 w-3" />
                    {item.error}
                  </p>
                )}
                {item.status === "success" && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Uploaded successfully
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {item.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {item.status !== "uploading" && (
                  <button
                    type="button"
                    onClick={() => { removeItem(item.id); }}
                    className="rounded p-1 text-muted-foreground hover:bg-accent"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
