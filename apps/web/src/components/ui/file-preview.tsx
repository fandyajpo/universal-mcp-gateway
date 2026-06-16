"use client";

import { useMemo, useState } from "react";

import { FileIcon } from "@/components/ui/file-icon";

import type { ComponentProps } from "react";

interface FilePreviewProps extends ComponentProps<"div"> {
  contentType?: string;
  filename?: string;
  url?: string;
  size?: number;
  showIconSize?: number;
}

function isImage(contentType: string): boolean {
  return contentType.startsWith("image/");
}

export function FilePreview({
  contentType,
  filename,
  url,
  size = 80,
  showIconSize = 28,
  className,
  ...rest
}: FilePreviewProps): React.ReactElement {
  const [imgError, setImgError] = useState(false);

  const showThumbnail = useMemo(
    () => contentType && isImage(contentType) && url && !imgError,
    [contentType, url, imgError],
  );

  if (showThumbnail) {
    return (
      <div
        className={`relative overflow-hidden rounded-md border ${className ?? ""}`}
        style={{ width: size, height: size }}
        {...rest}
      >
        <img
          src={url}
          alt={filename ?? "Preview"}
          className="h-full w-full object-cover"
          onError={() => { setImgError(true); }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-md border bg-muted ${className ?? ""}`}
      style={{ width: size, height: size }}
      {...rest}
    >
      <FileIcon contentType={contentType} filename={filename} size={showIconSize} />
    </div>
  );
}
