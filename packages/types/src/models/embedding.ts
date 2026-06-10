export type EmbeddingModel = string;

export interface Embedding {
  vector: number[];
  model: EmbeddingModel;
  dimensions: number;
}

export interface EmbeddingConfig {
  model: EmbeddingModel;
  dimensions: number;
  batchSize?: number;
}
