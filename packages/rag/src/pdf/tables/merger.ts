import type { PdfTable } from "./types";

const MERGE_COLUMN_TOLERANCE = 1;
const MERGE_CONFIDENCE_BOOST = 0.05;

export function mergeTables(tables: PdfTable[]): PdfTable[] {
  if (tables.length <= 1) return tables;

  const sorted = [...tables].sort(
    (a, b) => a.pageNumber - b.pageNumber || a.bbox.y0 - b.bbox.y0,
  );

  const merged: PdfTable[] = [];
  let i = 0;

  while (i < sorted.length) {
    const first = sorted[i];
    if (!first) break;

    let current = first;
    let j = i + 1;

    while (j < sorted.length) {
      const next = sorted[j];
      if (!next) break;

      const mergedTable = tryMergePair(current, next);
      if (mergedTable) {
        current = mergedTable;
        j++;
      } else {
        break;
      }
    }

    merged.push(current);
    i = j;
  }

  return merged;
}

function tryMergePair(first: PdfTable, second: PdfTable): PdfTable | null {
  if (first.pageNumber === second.pageNumber) return null;
  if (first.pageNumber + 1 !== second.pageNumber) return null;

  if (first.columnCount !== second.columnCount) {
    if (Math.abs(first.columnCount - second.columnCount) > MERGE_COLUMN_TOLERANCE) {
      return null;
    }
  }

  if (first.confidence < 0.5 || second.confidence < 0.5) return null;

  if (headersAreCompatible(first, second)) {
    return performMerge(first, second);
  }

  return null;
}

function headersAreCompatible(first: PdfTable, second: PdfTable): boolean {
  const h1 = first.headers;
  const h2 = second.headers;

  if (h1.length === 0 || h2.length === 0) return false;

  const minLen = Math.min(h1.length, h2.length);
  let matchCount = 0;

  for (let i = 0; i < minLen; i++) {
    const a = h1[i];
    const b = h2[i];
    if (a?.trim().toLowerCase() === b?.trim().toLowerCase()) {
      matchCount++;
    }
  }

  return matchCount >= minLen * 0.5;
}

function performMerge(first: PdfTable, second: PdfTable): PdfTable {
  const mergedRows = [...first.rows, ...second.rows];
  const mergedConfidence = Math.min(1, (first.confidence + second.confidence) / 2 + MERGE_CONFIDENCE_BOOST);

  const columns = Math.max(first.columnCount, second.columnCount);

  const headers = first.headers.length >= second.headers.length ? first.headers : second.headers;

  return {
    id: first.id,
    pageNumber: first.pageNumber,
    pageCount: first.pageCount + 1,
    bbox: {
      x0: Math.min(first.bbox.x0, second.bbox.x0),
      y0: first.bbox.y0,
      x1: Math.max(first.bbox.x1, second.bbox.x1),
      y1: second.bbox.y1,
    },
    caption: first.caption ?? second.caption,
    headers,
    rows: mergedRows,
    columnCount: columns,
    rowCount: mergedRows.length,
    confidence: mergedConfidence,
    detectionMethod: first.detectionMethod,
    formats: { json: "", csv: "", markdown: "" },
  };
}
