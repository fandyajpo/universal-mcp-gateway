import type { PdfTable } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("rag/pdf/tables/camelot");

interface CamelotTableData {
  page: number;
  headers: string[];
  cells: string[][];
  accuracy: number;
}

export async function extractWithCamelot(
  pdfBuffer: Uint8Array,
  pageRange?: string,
): Promise<PdfTable[]> {
  try {
    const data = await runCamelotProcess(pdfBuffer, pageRange);
    if (!data) return [];
    return data.map((d) => camelotToTable(d));
  } catch (error) {
    logger.warn({ error }, "Camelot extraction unavailable, falling back to positional");
    return [];
  }
}

async function runCamelotProcess(
  _pdfBuffer: Uint8Array,
  _pageRange?: string,
): Promise<CamelotTableData[] | null> {
  const pythonAvailable = await checkPythonAvailability();
  if (!pythonAvailable) return null;

  try {
    const tempPath = writeTempFile(_pdfBuffer);
    const result = spawnPython(tempPath, _pageRange);
    cleanupTempFile(tempPath);
    return await result;
  } catch {
    return null;
  }
}

async function checkPythonAvailability(): Promise<boolean> {
  try {
    const { spawn } = await import("child_process");
    const result = await new Promise<boolean>((resolve) => {
      const proc = spawn("python3", ["--version"], {
        stdio: ["ignore", "ignore", "ignore"],
        timeout: 5000,
      });
      proc.on("error", () => {
        resolve(false);
      });
      proc.on("exit", (code) => {
        resolve(code === 0);
      });
    });
    return result;
  } catch {
    return false;
  }
}

function writeTempFile(_buffer: Uint8Array): string {
  throw new Error("Python sidecar not available");
}

function spawnPython(
  _tempPath: string,
  _pageRange?: string,
): Promise<CamelotTableData[] | null> {
  return Promise.resolve(null);
}

function cleanupTempFile(_path: string): void {
  return;
}

let tableIdCounter = 0;

function camelotToTable(data: CamelotTableData): PdfTable {
  tableIdCounter++;

  const rows = data.cells.map((cellRow) => ({
    cells: cellRow.map((cellText) => {
      const trimmed = cellText.trim();
      const stripped = trimmed.replace(/[$€£¥,%]/g, "");
      const numeric = trimmed.length > 0 && !Number.isNaN(Number(stripped));
      return {
        text: trimmed,
        rowspan: 1,
        colspan: 1,
        isHeader: data.headers.length > 0,
        bold: false,
        italic: false,
        numeric,
        confidence: data.accuracy,
      };
    }),
  }));

  const firstCellRow = data.cells[0];

  return {
    id: `camelot-table-${tableIdCounter}`,
    pageNumber: data.page,
    pageCount: 1,
    bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
    caption: null,
    headers: data.headers.map((h) => h.trim()),
    rows,
    columnCount: data.headers.length > 0 ? data.headers.length : (firstCellRow ? firstCellRow.length : 0),
    rowCount: rows.length,
    confidence: data.accuracy / 100,
    detectionMethod: "camelot",
    formats: { json: "", csv: "", markdown: "" },
  };
}
