"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { FilePreview } from "@/components/ui/file-preview";
import { useFileUpload, type UploadFileItem } from "@/hooks/use-file-upload";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  entity?: string;
  onUploadComplete?: (files: UploadFileItem[]) => void;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unit = i > 0 ? i : 0;
  return `${(bytes / Math.pow(1024, unit)).toFixed(unit > 0 ? 1 : 0)} ${units[unit]}`;
}

export function FileUpload({
  accept,
  multiple = true,
  entity,
  onUploadComplete,
  className,
}: FileUploadProps): React.ReactElement {
  const {
    files,
    addFiles,
    removeFile,
    retry,
    retryAll,
    cancel,
    upload,
    isUploading,
    overallProgress,
  } = useFileUpload({ entity });

  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadStartedRef = useRef(false);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: File[] = [];
      for (const file of Array.from(fileList)) {
        newFiles.push(file);
        if (!multiple) break;
      }
      addFiles(newFiles);
    },
    [addFiles, multiple],
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [],
  );

  const handleUploadClick = useCallback(async () => {
    uploadStartedRef.current = true;
    await upload();
  }, [upload]);

  useEffect(() => {
    if (uploadStartedRef.current && !isUploading) {
      uploadStartedRef.current = false;
      const completed = files.filter((f) => f.status === "success");
      if (completed.length > 0) {
        onUploadComplete?.(completed);
      }
    }
  }, [isUploading, files, onUploadComplete]);

  const hasPending = files.some((f) => f.status === "pending");
  const hasErrors = files.some((f) => f.status === "error");
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const hasCompleted = files.some((f) => f.status === "success");
  const allDone = files.every((f) => f.status !== "pending");

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
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
        aria-label="File upload drop zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />

        {isDragOver ? (
          <p className="text-sm font-medium text-primary">Drop files here</p>
        ) : (
          <>
            <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Drag & drop files here</p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <FilePreview
                contentType={item.file.type}
                filename={item.file.name}
                url={item.result?.url}
                size={40}
                showIconSize={18}
                className="shrink-0"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.file.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(item.file.size)}
                  </span>
                  {item.status === "uploading" && (
                    <span className="text-xs text-muted-foreground">
                      {item.progress}%
                    </span>
                  )}
                </div>

                {item.status === "uploading" && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === "error" && item.error && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {item.error}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {item.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {item.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {item.status === "error" && (
                  <button
                    type="button"
                    onClick={() => { retry(item.id); }}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    aria-label={`Retry upload of ${item.file.name}`}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                {item.status !== "uploading" && (
                  <button
                    type="button"
                    onClick={() => { removeFile(item.id); }}
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

      {files.length > 0 && (
        <div className="flex items-center gap-2">
          {hasPending && (
            <Button onClick={() => { void handleUploadClick(); }} disabled={isUploading}>
              {isUploading
                ? `Uploading (${overallProgress}%)`
                : `Upload ${pendingCount} file${pendingCount > 1 ? "s" : ""}`}
            </Button>
          )}

          {isUploading && (
            <Button variant="outline" onClick={cancel}>
              Cancel
            </Button>
          )}

          {hasErrors && !isUploading && (
            <Button variant="outline" onClick={retryAll}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Retry Failed
            </Button>
          )}

          {allDone && hasCompleted && !isUploading && (
            <Button
              variant="ghost"
              onClick={() => {
                for (const f of files) removeFile(f.id);
              }}
            >
              Clear All
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
