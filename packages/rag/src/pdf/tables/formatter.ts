import type { PdfTable } from "./types";

export function formatTableAsJson(table: PdfTable): string {
  const headers = table.headers.length > 0 ? table.headers : generateColumnLabels(table.columnCount);

  const rows = table.rows.map((row) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < row.cells.length && i < headers.length; i++) {
      const cell = row.cells[i];
      const headerLabel = headers[i];
      if (cell && headerLabel) {
        obj[headerLabel] = cell.text;
      }
    }
    return obj;
  });

  return JSON.stringify(rows);
}

export function formatTableAsCsv(table: PdfTable): string {
  const headers = table.headers.length > 0 ? table.headers : generateColumnLabels(table.columnCount);

  const lines: string[] = [];
  lines.push(headers.map(escapeCsvField).join(","));

  for (const row of table.rows) {
    const values: string[] = [];
    for (let i = 0; i < table.columnCount; i++) {
      const cell = row.cells[i];
      values.push(escapeCsvField(cell ? cell.text : ""));
    }
    lines.push(values.join(","));
  }

  return lines.join("\n");
}

export function formatTableAsMarkdown(table: PdfTable): string {
  const headers = table.headers.length > 0 ? table.headers : generateColumnLabels(table.columnCount);

  const lines: string[] = [];

  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);

  for (const row of table.rows) {
    const values: string[] = [];
    for (let i = 0; i < table.columnCount; i++) {
      const cell = row.cells[i];
      values.push(cell ? cell.text : "");
    }
    lines.push(`| ${values.join(" | ")} |`);
  }

  return lines.join("\n");
}

function generateColumnLabels(count: number): string[] {
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    labels.push(`Column ${i + 1}`);
  }
  return labels;
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
