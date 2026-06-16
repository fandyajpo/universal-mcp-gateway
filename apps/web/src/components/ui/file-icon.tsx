import { File, FileArchive, FileCode, FileImage, FileText, type LucideIcon } from "lucide-react";

import type { ComponentProps } from "react";

interface FileIconEntry {
  icon: LucideIcon;
  className: string;
}

const ICON_MAP: Record<string, FileIconEntry> = {
  pdf: { icon: FileText, className: "text-red-500" },
  png: { icon: FileImage, className: "text-blue-500" },
  jpeg: { icon: FileImage, className: "text-blue-500" },
  jpg: { icon: FileImage, className: "text-blue-500" },
  gif: { icon: FileImage, className: "text-purple-500" },
  webp: { icon: FileImage, className: "text-blue-500" },
  svg: { icon: FileImage, className: "text-orange-500" },
  csv: { icon: FileText, className: "text-green-600" },
  json: { icon: FileCode, className: "text-yellow-600" },
  md: { icon: FileText, className: "text-blue-600" },
  markdown: { icon: FileText, className: "text-blue-600" },
  txt: { icon: FileText, className: "text-muted-foreground" },
  zip: { icon: FileArchive, className: "text-amber-600" },
  gz: { icon: FileArchive, className: "text-amber-600" },
  tar: { icon: FileArchive, className: "text-amber-600" },
  rar: { icon: FileArchive, className: "text-amber-600" },
  ts: { icon: FileCode, className: "text-blue-600" },
  tsx: { icon: FileCode, className: "text-blue-600" },
  js: { icon: FileCode, className: "text-yellow-500" },
  jsx: { icon: FileCode, className: "text-yellow-500" },
  py: { icon: FileCode, className: "text-blue-700" },
  rs: { icon: FileCode, className: "text-orange-600" },
  go: { icon: FileCode, className: "text-cyan-600" },
  html: { icon: FileCode, className: "text-orange-500" },
  css: { icon: FileCode, className: "text-blue-500" },
  yaml: { icon: FileText, className: "text-red-500" },
  yml: { icon: FileText, className: "text-red-500" },
  toml: { icon: FileText, className: "text-red-500" },
};

function extensionFromName(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  const ext = filename.slice(dot + 1).toLowerCase();
  return ext;
}

function contentTypeToExtension(contentType: string, filename: string): string {
  if (!contentType || contentType === "application/octet-stream") {
    return extensionFromName(filename);
  }

  if (contentType.includes("pdf")) return "pdf";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg")) return "jpeg";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("csv")) return "csv";
  if (contentType.includes("json")) return "json";
  if (contentType.includes("zip") || contentType.includes("gzip")) return "zip";
  if (contentType.includes("tar")) return "tar";
  if (contentType.includes("markdown")) return "md";
  if (contentType.includes("yaml")) return "yaml";
  if (contentType.includes("javascript")) return "js";
  if (contentType.includes("typescript")) return "ts";
  if (contentType.includes("html")) return "html";
  if (contentType.includes("css")) return "css";

  return extensionFromName(filename);
}

interface FileIconProps extends ComponentProps<"span"> {
  contentType?: string;
  filename?: string;
  size?: number;
}

export function FileIcon({
  contentType,
  filename,
  size = 20,
  className,
  ...rest
}: FileIconProps): React.ReactElement {
  const ext = contentTypeToExtension(contentType ?? "", filename ?? "");
  const entry = ext ? ICON_MAP[ext] : undefined;
  const Icon = entry?.icon ?? File;

  return (
    <span
      className={`inline-flex items-center justify-center ${entry?.className ?? "text-muted-foreground"} ${className ?? ""}`}
      role="img"
      aria-label={filename ?? "file"}
      {...rest}
    >
      <Icon size={size} />
    </span>
  );
}
