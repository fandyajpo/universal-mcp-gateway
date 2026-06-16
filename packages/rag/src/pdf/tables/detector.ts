import type { PdfExtractedLine, PdfExtractedPage } from "../types";
import type { PdfTable, PdfTableCell, PdfTableRow } from "./types";
import { DETECTION_MIN_COLUMNS, DETECTION_MIN_ROWS, HIGH_CONFIDENCE_THRESHOLD, ROW_GROUP_TOLERANCE } from "./types";

interface TextRow {
  y0: number;
  y1: number;
  lines: PdfExtractedLine[];
}

interface DetectedGrid {
  pageNumber: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  columnBoundaries: number[];
  cellGrid: string[][];
  confidence: number;
}

let nextId = 0;

function generateId(): string {
  nextId++;
  return `table-${nextId}`;
}

export function detectTables(pages: PdfExtractedPage[]): PdfTable[] {
  const allTables: PdfTable[] = [];
  for (const page of pages) {
    const pageTables = detectTablesOnPage(page);
    allTables.push(...pageTables);
  }
  return allTables;
}

function detectTablesOnPage(page: PdfExtractedPage): PdfTable[] {
  const allLines = collectLines(page);
  if (allLines.length < DETECTION_MIN_ROWS * 2) return [];

  const rows = groupIntoRows(allLines);
  if (rows.length < DETECTION_MIN_ROWS) return [];

  const grids = findTableGrids(rows, page.pageNumber);
  return grids.map((g) => gridToTable(g));
}

function collectLines(page: PdfExtractedPage): PdfExtractedLine[] {
  const lines: PdfExtractedLine[] = [];
  for (const block of page.blocks) {
    for (const line of block.lines) {
      lines.push(line);
    }
  }
  return lines;
}

function groupIntoRows(lines: PdfExtractedLine[]): TextRow[] {
  const sorted = [...lines].sort((a, b) => a.bbox.y0 - b.bbox.y0);
  const rows: TextRow[] = [];
  let current: PdfExtractedLine[] = [];

  for (const line of sorted) {
    if (current.length === 0) {
      current.push(line);
      continue;
    }
    const avgH = avgHeight(current);
    const lastLineIdx = current.length - 1;
    const lastLine = current[lastLineIdx];
    if (!lastLine) {
      current.push(line);
      continue;
    }
    const rowGap = line.bbox.y0 - lastLine.bbox.y1;
    if (rowGap <= avgH * ROW_GROUP_TOLERANCE) {
      current.push(line);
    } else {
      rows.push(toRow(current));
      current = [line];
    }
  }
  if (current.length > 0) rows.push(toRow(current));
  return rows;
}

function avgHeight(lines: PdfExtractedLine[]): number {
  let total = 0;
  for (const l of lines) total += l.bbox.y1 - l.bbox.y0;
  return lines.length > 0 ? total / lines.length : 0;
}

function toRow(lines: PdfExtractedLine[]): TextRow {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;

  for (const l of lines) {
    if (l.bbox.x0 < x0) x0 = l.bbox.x0;
    if (l.bbox.y0 < y0) y0 = l.bbox.y0;
    if (l.bbox.x1 > x1) x1 = l.bbox.x1;
    if (l.bbox.y1 > y1) y1 = l.bbox.y1;
  }
  const sortedLines = [...lines].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  return { y0, y1, lines: sortedLines };
}

function findTableGrids(rows: TextRow[], pageNumber: number): DetectedGrid[] {
  const grids: DetectedGrid[] = [];
  const maxStart = rows.length - DETECTION_MIN_ROWS + 1;

  for (let i = 0; i < maxStart; i++) {
    for (let j = i + DETECTION_MIN_ROWS; j <= rows.length; j++) {
      const slice = rows.slice(i, j);
      const grid = buildGrid(slice, pageNumber);
      if (grid && grid.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
        grids.push(grid);
      }
    }
  }

  return mergeOverlapping(grids);
}

function buildGrid(rows: TextRow[], pageNumber: number): DetectedGrid | null {
  const boundaries = detectColumnBoundaries(rows);
  if (!boundaries || boundaries.length < DETECTION_MIN_COLUMNS + 1) return null;

  const cellGrid: string[][] = [];
  for (const row of rows) {
    const cells = assignCells(row, boundaries);
    cellGrid.push(cells);
  }

  const confidence = calcGridConfidence(cellGrid, boundaries);
  const bbox = calcBbox(rows);

  return { pageNumber, bbox, columnBoundaries: boundaries, cellGrid, confidence };
}

function detectColumnBoundaries(rows: TextRow[]): number[] | null {
  const wordCounts = rows.map((r) => countColumnCandidates(r));
  if (wordCounts.length === 0) return null;

  const median = medianOf(wordCounts);
  if (median < DETECTION_MIN_COLUMNS) return null;

  const consistentRows = rows.filter((r) => {
    const c = countColumnCandidates(r);
    return Math.abs(c - median) <= 1;
  });
  if (consistentRows.length < rows.length * 0.5) return null;

  const grid = computeColumnGrid(consistentRows, median);
  if (!grid) return null;

  const firstCol = grid[0];
  if (!firstCol) return null;

  const columnBoundaries: number[] = [firstCol.start];
  for (const col of grid) {
    columnBoundaries.push(col.end);
  }
  return columnBoundaries;
}

function countColumnCandidates(row: TextRow): number {
  return row.lines.filter((l) => l.text.trim().length > 0).length;
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  const mid = Math.floor(len / 2);
  if (len % 2 === 0 && mid > 0) {
    const a = sorted[mid - 1];
    const b = sorted[mid];
    if (a !== undefined && b !== undefined) return (a + b) / 2;
  }
  return sorted[mid] ?? 0;
}

function computeColumnGrid(
  rows: TextRow[],
  columnCount: number,
): { start: number; end: number }[] | null {
  const allColumns: { start: number; end: number }[][] = [];

  for (const row of rows) {
    const lineStarts = row.lines.map((l) => l.bbox.x0);
    const lineEnds = row.lines.map((l) => l.bbox.x1);
    if (lineStarts.length < columnCount) continue;

    const cols: { start: number; end: number }[] = [];
    for (let i = 0; i < columnCount; i++) {
      const s = lineStarts[i];
      const e = lineEnds[i];
      if (s === undefined || e === undefined) break;
      cols.push({ start: s, end: e });
    }
    if (cols.length === columnCount) {
      allColumns.push(cols);
    }
  }

  if (allColumns.length < Math.ceil(rows.length * 0.3)) return null;

  const boundaries: { start: number; end: number }[] = [];
  for (let c = 0; c < columnCount; c++) {
    let startSum = 0;
    let endSum = 0;
    let count = 0;
    for (const cols of allColumns) {
      const col = cols[c];
      if (col) {
        startSum += col.start;
        endSum += col.end;
        count++;
      }
    }
    if (count === 0) return null;
    boundaries.push({ start: startSum / count, end: endSum / count });
  }

  return boundaries;
}

function assignCells(row: TextRow, boundaries: number[]): string[] {
  const cellCount = boundaries.length - 1;
  const cells = new Array<string>(cellCount).fill("");

  const sortedLines = [...row.lines].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  for (const line of sortedLines) {
    const midX = (line.bbox.x0 + line.bbox.x1) / 2;
    for (let i = 0; i < cellCount; i++) {
      const start = boundaries[i];
      const end = boundaries[i + 1];
      if (start === undefined || end === undefined) continue;
      if (midX >= start && midX <= end) {
        const current = cells[i];
        cells[i] = current ? `${current} ${line.text}` : line.text;
        break;
      }
    }
  }

  return cells;
}

function calcGridConfidence(cellGrid: string[][], boundaries: number[]): number {
  const colCount = boundaries.length - 1;
  const rowCount = cellGrid.length;
  if (rowCount < 2 || colCount < 2) return 0;

  const sizeScore = Math.min(1, (rowCount * colCount) / 16);
  const filledTotal = cellGrid.reduce((score, row) => {
    const filled = row.filter((c) => c.length > 0).length;
    return score + filled / Math.max(colCount, 1);
  }, 0);
  const rowConsistency = filledTotal / Math.max(rowCount, 1);
  const boundaryScore = Math.min(1, colCount / 6);

  return Math.round((sizeScore * 0.25 + rowConsistency * 0.45 + boundaryScore * 0.3) * 100) / 100;
}

function calcBbox(rows: TextRow[]): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;

  for (const r of rows) {
    if (r.y0 < y0) y0 = r.y0;
    if (r.y1 > y1) y1 = r.y1;
    for (const l of r.lines) {
      if (l.bbox.x0 < x0) x0 = l.bbox.x0;
      if (l.bbox.x1 > x1) x1 = l.bbox.x1;
    }
  }
  return { x0, y0, x1, y1 };
}

function mergeOverlapping(grids: DetectedGrid[]): DetectedGrid[] {
  if (grids.length <= 1) return grids;
  const sorted = [...grids].sort((a, b) => a.bbox.y0 - b.bbox.y0);
  const result: DetectedGrid[] = [];
  for (const g of sorted) {
    const last = result.length > 0 ? result[result.length - 1] : undefined;
    if (last && last.bbox.y0 < g.bbox.y1 && last.bbox.y1 > g.bbox.y0) {
      if (g.confidence > last.confidence) {
        result[result.length - 1] = g;
      }
    } else {
      result.push(g);
    }
  }
  return result;
}

function gridToTable(grid: DetectedGrid): PdfTable {
  const firstRow = grid.cellGrid.length > 0 ? grid.cellGrid[0] : null;
  const headers: string[] = firstRow
    ? firstRow.map((h) => h.trim())
    : [];

  const rows: PdfTableRow[] = grid.cellGrid.map((cellRow, ri) => ({
    cells: cellRow.map((cellText) => toCell(cellText, ri === 0)),
  }));
  const bbox = grid.bbox;

  return {
    id: generateId(),
    pageNumber: grid.pageNumber,
    pageCount: 1,
    bbox,
    caption: null,
    headers,
    rows,
    columnCount: grid.columnBoundaries.length - 1,
    rowCount: rows.length,
    confidence: grid.confidence,
    detectionMethod: "positional",
    formats: { json: "", csv: "", markdown: "" },
  };
}

function toCell(text: string, isHeader: boolean): PdfTableCell {
  const trimmed = text.trim();
  const stripped = trimmed.replace(/[$€£¥,%]/g, "");
  const numeric = trimmed.length > 0 && !Number.isNaN(Number(stripped));
  return {
    text: trimmed,
    rowspan: 1,
    colspan: 1,
    isHeader,
    bold: false,
    italic: false,
    numeric,
    confidence: trimmed.length > 0 ? 1 : 0,
  };
}

export function resetTableIdCounter(): void {
  nextId = 0;
}
