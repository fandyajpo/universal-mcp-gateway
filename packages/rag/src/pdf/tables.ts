import { extractWithCamelot } from "./tables/camelot";
import { detectTables } from "./tables/detector";
import { formatTableAsCsv, formatTableAsJson, formatTableAsMarkdown } from "./tables/formatter";
import { mergeTables } from "./tables/merger";
import type { ExtractTablesOptions, ExtractTablesResult, PdfTable } from "./tables/types";
import { HIGH_CONFIDENCE_THRESHOLD } from "./tables/types";
import type { PdfExtractedPage } from "./types";
import { createLogger } from "@repo/logger";

export type { ExtractTablesOptions, ExtractTablesResult, PdfTable } from "./tables/types";
export type { PdfTableCell, PdfTableRow, PdfTableFormats } from "./tables/types";

const logger = createLogger("rag/pdf/tables");

export async function extractTables(
  pages: PdfExtractedPage[],
  options: ExtractTablesOptions,
): Promise<ExtractTablesResult> {
  logger.info({ pageCount: pages.length }, "Starting table extraction");

  const positionalTables = detectTables(pages);
  logger.info({ count: positionalTables.length }, "Positional table detection complete");

  let camelotTables: PdfTable[] = [];
  if (options.enableCamelot) {
    camelotTables = await extractWithCamelot(options.pdfBuffer);
    logger.info({ count: camelotTables.length }, "Camelot table extraction complete");
  }

  const allTables = mergeTables([...positionalTables, ...camelotTables]);

  for (const table of allTables) {
    table.formats.json = formatTableAsJson(table);
    table.formats.csv = formatTableAsCsv(table);
    table.formats.markdown = formatTableAsMarkdown(table);
  }

  const highConfidenceTables = allTables.filter((t) => t.confidence >= HIGH_CONFIDENCE_THRESHOLD);
  const lowConfidence = allTables.filter((t) => t.confidence < HIGH_CONFIDENCE_THRESHOLD);

  logger.info(
    { highConfidence: highConfidenceTables.length, lowConfidence: lowConfidence.length },
    "Table extraction completed",
  );

  return { tables: highConfidenceTables, lowConfidenceTables: lowConfidence };
}
