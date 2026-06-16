"use client";

interface UploadProgressProps {
  progress: number;
  fileName?: string;
}

export function UploadProgress({ progress, fileName }: UploadProgressProps): React.ReactElement {
  return (
    <div className="space-y-1" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Upload progress for ${fileName ?? "file"}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{fileName ? `Uploading ${fileName}` : "Uploading..."}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
