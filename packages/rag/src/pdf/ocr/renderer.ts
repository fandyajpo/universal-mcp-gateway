import { createLogger } from "@repo/logger";

const logger = createLogger("rag/pdf/ocr/renderer");

const PAGE_RENDER_TIMEOUT_MS = 30_000;

type SharpInstance = (
  input?: Buffer | Uint8Array,
  options?: import("sharp").SharpOptions,
) => import("sharp").Sharp;

export class PageRenderError extends Error {
  constructor(message: string, public readonly pageNumber: number) {
    super(message);
    this.name = "PageRenderError";
  }
}

export async function renderPageToPng(
  pdfBuffer: Uint8Array,
  pageNumber: number,
  dpi = 300,
): Promise<Buffer> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new PageRenderError(`Page ${pageNumber} rendering timed out after ${PAGE_RENDER_TIMEOUT_MS}ms`, pageNumber));
    }, PAGE_RENDER_TIMEOUT_MS);
  });

  const renderPromise = renderWithSharp(pdfBuffer, pageNumber, dpi);

  try {
    return await Promise.race([renderPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof PageRenderError) throw error;
    throw new PageRenderError(
      `Failed to render page ${pageNumber}: ${error instanceof Error ? error.message : String(error)}`,
      pageNumber,
    );
  }
}

async function renderWithSharp(
  pdfBuffer: Uint8Array,
  pageNumber: number,
  dpi: number,
): Promise<Buffer> {
  const sharp = await importSharp();

  try {
    const buffer = await sharp(pdfBuffer, {
      page: pageNumber - 1,
      density: dpi,
    })
      .png()
      .toBuffer();

    logger.debug({ pageNumber, dpi, size: buffer.length }, "Page rendered to PNG");
    return buffer;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("unsupported") || msg.includes("pdf") || msg.includes("PDF")) {
      throw new Error(
        "PDF rendering via sharp requires libvips compiled with PDF support " +
        "(poppler/librsvg). Install system deps: brew install poppler (macOS) " +
        "or apt-get install libpoppler-glib-dev (Linux). " +
        "Original error: " + msg,
      );
    }
    throw error;
  }
}

async function importSharp(): Promise<SharpInstance> {
  try {
    const mod = await import("sharp");
    return mod.default;
  } catch {
    throw new Error(
      "sharp package is required for PDF page rendering. Install it: pnpm add sharp",
    );
  }
}
