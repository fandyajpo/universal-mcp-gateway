export interface FileTypeSignature {
  name: string;
  mimeTypes: string[];
  check: (buffer: Uint8Array) => boolean;
}

function byteAt(buffer: Uint8Array, index: number): number {
  const value = buffer[index];
  if (value === undefined) {
    throw new Error(`Index ${index} out of bounds for buffer of length ${buffer.length}`);
  }
  return value;
}

function matchBytes(buffer: Uint8Array, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (byteAt(buffer, offset + i) !== bytes[i]) return false;
  }
  return true;
}

function isPrintableAscii(byte: number): boolean {
  return byte >= 0x20 && byte <= 0x7E;
}

function isUtf8Continuation(byte: number): boolean {
  return byte >= 0x80 && byte <= 0xBF;
}

function isLikelyText(buffer: Uint8Array): boolean {
  const sampleLen = Math.min(buffer.length, 512);
  if (sampleLen === 0) return false;

  let printableCount = 0;

  for (let i = 0; i < sampleLen; i++) {
    const byte = byteAt(buffer, i);
    if (byte === 0x09 || byte === 0x0A || byte === 0x0D) {
      printableCount++;
    } else if (isPrintableAscii(byte)) {
      printableCount++;
    } else if (isUtf8Continuation(byte)) {
      printableCount++;
    } else if (byte >= 0xC2 && byte <= 0xF4) {
      printableCount++;
    } else if (byte === 0x00) {
      return false;
    }
  }

  return printableCount / sampleLen > 0.9;
}

function trimLeadingWhitespace(buffer: Uint8Array): Uint8Array {
  let start = 0;
  while (start < buffer.length) {
    const byte = byteAt(buffer, start);
    if (byte !== 0x20 && byte !== 0x09 && byte !== 0x0A && byte !== 0x0D) break;
    start++;
  }
  return buffer.slice(start);
}

export const SIGNATURES: FileTypeSignature[] = [
  {
    name: "pdf",
    mimeTypes: ["application/pdf"],
    check: (buffer: Uint8Array): boolean => matchBytes(buffer, [0x25, 0x50, 0x44, 0x46]),
  },
  {
    name: "png",
    mimeTypes: ["image/png"],
    check: (buffer: Uint8Array): boolean =>
      matchBytes(buffer, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  },
  {
    name: "jpeg",
    mimeTypes: ["image/jpeg"],
    check: (buffer: Uint8Array): boolean => matchBytes(buffer, [0xFF, 0xD8, 0xFF]),
  },
  {
    name: "gif",
    mimeTypes: ["image/gif"],
    check: (buffer: Uint8Array): boolean => matchBytes(buffer, [0x47, 0x49, 0x46, 0x38]),
  },
  {
    name: "webp",
    mimeTypes: ["image/webp"],
    check: (buffer: Uint8Array): boolean => {
      if (!matchBytes(buffer, [0x52, 0x49, 0x46, 0x46])) return false;
      if (buffer.length < 12) return false;
      return matchBytes(buffer, [0x57, 0x45, 0x42, 0x50], 8);
    },
  },
  {
    name: "svg",
    mimeTypes: ["image/svg+xml"],
    check: (buffer: Uint8Array): boolean => {
      const text = new TextDecoder().decode(buffer.slice(0, 512)).toLowerCase();
      return text.includes("<svg") || (text.includes("<?xml") && text.includes("<svg"));
    },
  },
  {
    name: "json",
    mimeTypes: ["application/json"],
    check: (buffer: Uint8Array): boolean => {
      const trimmed = trimLeadingWhitespace(buffer);
      if (trimmed.length === 0) return false;
      return byteAt(trimmed, 0) === 0x7B || byteAt(trimmed, 0) === 0x5B;
    },
  },
  {
    name: "csv",
    mimeTypes: ["text/csv", "text/tab-separated-values"],
    check: (buffer: Uint8Array): boolean => {
      if (!isLikelyText(buffer)) return false;
      const text = new TextDecoder().decode(buffer.slice(0, 1024));
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length < 1) return false;
      const delimiter = text.includes("\t") ? "\t" : ",";
      return lines.every((line) => line.includes(delimiter));
    },
  },
  {
    name: "markdown",
    mimeTypes: ["text/markdown"],
    check: (buffer: Uint8Array): boolean => {
      if (!isLikelyText(buffer)) return false;
      const text = new TextDecoder().decode(buffer.slice(0, 512));
      return (
        text.includes("# ") ||
        text.includes("## ") ||
        text.includes("### ") ||
        text.includes("---\n") ||
        text.includes("```") ||
        text.includes("> ") ||
        text.includes("* ") ||
        text.includes("- ")
      );
    },
  },
  {
    name: "plain",
    mimeTypes: ["text/plain"],
    check: (buffer: Uint8Array): boolean => isLikelyText(buffer),
  },
  {
    name: "zip",
    mimeTypes: [
      "application/zip",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    check: (buffer: Uint8Array): boolean => matchBytes(buffer, [0x50, 0x4B]),
  },
];
