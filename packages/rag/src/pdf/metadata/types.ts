export interface PdfInfoMetadata {
  title: string | null;
  author: string | null;
  subject: string | null;
  keywords: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modDate: string | null;
}

export interface PdfPageDimension {
  pageNumber: number;
  width: number;
  height: number;
}

export interface PdfTocEntry {
  title: string;
  page: number;
  children?: PdfTocEntry[];
}

export interface PdfMetadataResult {
  info: PdfInfoMetadata;
  pdfVersion: string | null;
  pageCount: number;
  pageDimensions: PdfPageDimension[];
  toc: PdfTocEntry[];
  language: string | null;
}

export function normalizePdfDate(pdfDate: string | null): string | null {
  if (!pdfDate) return null;

  const PDF_DATE_RE = /^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})([+-]\d{2})?'?(\d{2})?'?$/;
  const match = PDF_DATE_RE.exec(pdfDate);
  if (!match) return pdfDate;

  const [, year, month, day, hour, min, sec, tzSign, tzHour] = match;
  const tz = tzSign && tzHour ? `${tzSign}${tzHour}:00` : "Z";

  return `${year}-${month}-${day}T${hour}:${min}:${sec}${tz}`;
}
