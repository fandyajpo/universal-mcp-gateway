import { Schema, model, Model } from "mongoose";

import { timestampsPlugin, toJSONTransform, softDeletePlugin } from "../schema";

export interface IProcessedContentPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: {
    bbox: { x0: number; y0: number; x1: number; y1: number };
    lines: {
      bbox: { x0: number; y0: number; x1: number; y1: number };
      text: string;
      font: { name: string; size: number };
    }[];
  }[];
}

export interface IProcessedContent {
  text: string;
  pages: IProcessedContentPage[];
}

export interface IPdfTocEntry {
  title: string;
  page: number;
  children?: IPdfTocEntry[];
}

export interface IPdfPageDimension {
  pageNumber: number;
  width: number;
  height: number;
}

export interface IPdfInfoMetadata {
  title?: string | null;
  author?: string | null;
  subject?: string | null;
  keywords?: string | null;
  creator?: string | null;
  producer?: string | null;
  creationDate?: string | null;
  modDate?: string | null;
}

export interface IPdfMetadata {
  info: IPdfInfoMetadata;
  pdfVersion?: string | null;
  pageDimensions: IPdfPageDimension[];
  toc: IPdfTocEntry[];
  language?: string | null;
}

export interface IStepMetric {
  step: string;
  status: "started" | "completed" | "failed";
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  retries: number;
  error?: string;
}

export interface IExtractionMetadata {
  charCount: number;
  pageCount: number;
  extractionMethod: "native" | "ocr";
  confidenceScore: number;
  language?: string;
  extractedAt: Date;
}

export interface ITableCell {
  text: string;
  rowspan: number;
  colspan: number;
  isHeader: boolean;
  bold: boolean;
  italic: boolean;
  numeric: boolean;
  confidence: number;
}

export interface ITableRow {
  cells: ITableCell[];
}

export interface ITableFormats {
  json: string;
  csv: string;
  markdown: string;
}

export interface ITable {
  id: string;
  pageNumber: number;
  pageCount: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  caption: string | null;
  headers: string[];
  rows: ITableRow[];
  columnCount: number;
  rowCount: number;
  confidence: number;
  detectionMethod: "positional" | "camelot";
  formats: ITableFormats;
}

export interface IDocument {
  tenantId: string;
  title: string;
  description?: string;
  source: string;
  sourceUrl?: string;
  contentType?: string;
  fileSize?: number;
  fileKey?: string;
  fileHash?: string;
  pageCount?: number;
  status: string;
  currentStep?: string;
  stepsCompleted?: string[];
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  error?: string;
  progress?: number;
  stepMetrics?: IStepMetric[];
  metadata?: Record<string, unknown>;
  tags?: string[];
  pdfMetadata?: IPdfMetadata;
  processedContent?: IProcessedContent;
  extractionMetadata?: IExtractionMetadata;
  tables?: ITable[];
  lowConfidenceTables?: ITable[];
  processedAt?: Date;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const processedContentSchema = new Schema<IProcessedContent>(
  {
    text: { type: String, default: "" },
    pages: [
      {
        pageNumber: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        blocks: [
          {
            bbox: {
              x0: { type: Number, required: true },
              y0: { type: Number, required: true },
              x1: { type: Number, required: true },
              y1: { type: Number, required: true },
            },
            lines: [
              {
                bbox: {
                  x0: { type: Number, required: true },
                  y0: { type: Number, required: true },
                  x1: { type: Number, required: true },
                  y1: { type: Number, required: true },
                },
                text: { type: String, default: "" },
                font: {
                  name: { type: String, default: "" },
                  size: { type: Number, default: 0 },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  { _id: false },
);

const extractionMetadataSchema = new Schema<IExtractionMetadata>(
  {
    charCount: { type: Number, required: true },
    pageCount: { type: Number, required: true },
    extractionMethod: { type: String, required: true, enum: ["native", "ocr"] },
    confidenceScore: { type: Number, required: true },
    language: { type: String },
    extractedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const pdfTocEntrySchema = new Schema<IPdfTocEntry>(
  {
    title: { type: String, required: true },
    page: { type: Number, required: true },
    children: [{ type: Schema.Types.Mixed }],
  },
  { _id: false },
);

const pdfPageDimensionSchema = new Schema<IPdfPageDimension>(
  {
    pageNumber: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false },
);

const pdfInfoMetadataSchema = new Schema<IPdfInfoMetadata>(
  {
    title: { type: String },
    author: { type: String },
    subject: { type: String },
    keywords: { type: String },
    creator: { type: String },
    producer: { type: String },
    creationDate: { type: String },
    modDate: { type: String },
  },
  { _id: false },
);

const pdfMetadataSchema = new Schema<IPdfMetadata>(
  {
    info: { type: pdfInfoMetadataSchema, default: (): Record<string, unknown> => ({}) },
    pdfVersion: { type: String },
    pageDimensions: [pdfPageDimensionSchema],
    toc: [pdfTocEntrySchema],
    language: { type: String },
  },
  { _id: false },
);

const tableCellSchema = new Schema<ITableCell>(
  {
    text: { type: String, default: "" },
    rowspan: { type: Number, default: 1 },
    colspan: { type: Number, default: 1 },
    isHeader: { type: Boolean, default: false },
    bold: { type: Boolean, default: false },
    italic: { type: Boolean, default: false },
    numeric: { type: Boolean, default: false },
    confidence: { type: Number, default: 1 },
  },
  { _id: false },
);

const tableRowSchema = new Schema<ITableRow>(
  {
    cells: [tableCellSchema],
  },
  { _id: false },
);

const tableFormatsSchema = new Schema<ITableFormats>(
  {
    json: { type: String, default: "" },
    csv: { type: String, default: "" },
    markdown: { type: String, default: "" },
  },
  { _id: false },
);

const tableSchema = new Schema<ITable>(
  {
    id: { type: String, required: true },
    pageNumber: { type: Number, required: true },
    pageCount: { type: Number, default: 1 },
    bbox: {
      x0: { type: Number, required: true },
      y0: { type: Number, required: true },
      x1: { type: Number, required: true },
      y1: { type: Number, required: true },
    },
    caption: { type: String, default: null },
    headers: [{ type: String }],
    rows: [tableRowSchema],
    columnCount: { type: Number, required: true },
    rowCount: { type: Number, required: true },
    confidence: { type: Number, required: true },
    detectionMethod: { type: String, required: true, enum: ["positional", "camelot"] },
    formats: { type: tableFormatsSchema, default: (): ITableFormats => ({ json: "", csv: "", markdown: "" }) },
  },
  { _id: false },
);

const documentSchema = new Schema<IDocument>({
  tenantId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  source: { type: String, required: true, enum: ["upload", "webhook", "connector", "api"] },
  sourceUrl: { type: String },
  contentType: { type: String },
  fileSize: { type: Number },
  fileKey: { type: String },
  fileHash: { type: String },
  pageCount: { type: Number },
  status: { type: String, required: true, enum: ["uploading", "processing", "ready", "error", "failed"], default: "uploading" },
  currentStep: { type: String },
  stepsCompleted: { type: [String], default: [] },
  processingStartedAt: { type: Date },
  processingCompletedAt: { type: Date },
  error: { type: String },
  progress: { type: Number, min: 0, max: 100 },
  stepMetrics: [{
    step: { type: String, required: true },
    status: { type: String, enum: ["started", "completed", "failed"], required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    durationMs: { type: Number },
    retries: { type: Number, default: 0 },
    error: { type: String },
  }],
  metadata: { type: Schema.Types.Mixed, default: {} },
  tags: { type: [String], default: [] },
  pdfMetadata: { type: pdfMetadataSchema },
  processedContent: { type: processedContentSchema },
  extractionMetadata: { type: extractionMetadataSchema },
  tables: [tableSchema],
  lowConfidenceTables: [tableSchema],
  processedAt: { type: Date },
  uploadedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

documentSchema.index({ tenantId: 1, status: 1 }, { name: "idx_documents_tenantId_status" });
documentSchema.index({ tenantId: 1, contentType: 1 }, { name: "idx_documents_tenantId_contentType" });
documentSchema.index({ tenantId: 1, createdAt: -1 }, { name: "idx_documents_tenantId_createdAt" });
documentSchema.index({ tenantId: 1, fileHash: 1 }, { name: "idx_documents_tenantId_fileHash" });
documentSchema.index(
  { title: "text", description: "text", tags: "text" },
  { name: "idx_documents_title_text_description_text_tags_text", weights: { title: 10, description: 5, tags: 3 } },
);
documentSchema.index({ tenantId: 1, updatedAt: 1 }, { name: "idx_documents_tenantId_updatedAt" });

timestampsPlugin(documentSchema);
softDeletePlugin(documentSchema);
toJSONTransform(documentSchema);

export const DocumentModel: Model<IDocument> = model<IDocument>("Document", documentSchema);
