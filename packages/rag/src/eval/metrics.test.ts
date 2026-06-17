import { describe, it, expect } from "vitest";

import {
  computePerQueryMetrics,
  computeAggregatedMetrics,
  computeDCG,
  computeIDCG,
} from "./metrics";
import type { EvalQuery, PerQueryMetrics } from "./types";

function makeQuery(overrides?: Partial<EvalQuery>): EvalQuery {
  return {
    id: "test-1",
    query: "test query",
    relevantChunkIds: ["a", "b"],
    ...overrides,
  };
}

describe("computePerQueryMetrics", () => {
  it("all relevant at top of results", () => {
    const q = makeQuery({ relevantChunkIds: ["a", "b"] });
    const result = computePerQueryMetrics(q, ["a", "b", "c", "d", "e"]);
    expect(result.reciprocalRank).toBe(1);
    expect(result.hitAtK[1]).toBe(true);
    expect(result.hitAtK[3]).toBe(true);
    expect(result.relevantRanks).toEqual([1, 2]);
  });

  it("relevant at deeper ranks", () => {
    const q = makeQuery({ relevantChunkIds: ["x", "y"] });
    const result = computePerQueryMetrics(q, ["a", "b", "x", "c", "y"]);
    expect(result.reciprocalRank).toBe(1 / 3);
    expect(result.hitAtK[1]).toBe(false);
    expect(result.hitAtK[3]).toBe(true);
    expect(result.relevantRanks).toEqual([3, 5]);
  });

  it("no relevant results", () => {
    const q = makeQuery({ relevantChunkIds: ["z"] });
    const result = computePerQueryMetrics(q, ["a", "b", "c"]);
    expect(result.reciprocalRank).toBe(0);
    expect(result.hitAtK[1]).toBe(false);
    expect(result.hitAtK[5]).toBe(false);
    expect(result.relevantRanks).toEqual([]);
  });

  it("empty retrieved list", () => {
    const q = makeQuery({ relevantChunkIds: ["a"] });
    const result = computePerQueryMetrics(q, []);
    expect(result.reciprocalRank).toBe(0);
    expect(result.retrievedChunkIds).toEqual([]);
  });

  it("all retrieved are relevant", () => {
    const q = makeQuery({ relevantChunkIds: ["a", "b", "c"] });
    const result = computePerQueryMetrics(q, ["a", "b", "c"]);
    expect(result.reciprocalRank).toBe(1);
    expect(result.relevantRanks).toEqual([1, 2, 3]);
  });

  it("custom K values", () => {
    const q = makeQuery({ relevantChunkIds: ["x"] });
    const result = computePerQueryMetrics(q, ["a", "b", "c", "x", "d"], [2, 4]);
    expect(result.hitAtK[2]).toBe(false);
    expect(result.hitAtK[4]).toBe(true);
  });
});

describe("computeDCG", () => {
  it("perfect ranking", () => {
    const dcg = computeDCG(new Set([1, 2, 3]), 3);
    const idcg = computeIDCG(3, 3);
    expect(dcg).toBeCloseTo(idcg, 10);
  });

  it("no relevant", () => {
    expect(computeDCG(new Set(), 5)).toBe(0);
  });

  it("single relevant at rank 1", () => {
    const dcg = computeDCG(new Set([1]), 3);
    expect(dcg).toBeCloseTo(1 / Math.log2(2), 10);
  });

  it("single relevant at rank 3", () => {
    const dcg = computeDCG(new Set([3]), 5);
    expect(dcg).toBeCloseTo(1 / Math.log2(4), 10);
  });
});

describe("computeIDCG", () => {
  it("no relevant documents", () => {
    expect(computeIDCG(0, 5)).toBe(0);
  });

  it("fewer relevant than K", () => {
    const idcg = computeIDCG(2, 5);
    const expected = 1 / Math.log2(2) + 1 / Math.log2(3);
    expect(idcg).toBeCloseTo(expected, 10);
  });

  it("more relevant than K", () => {
    const idcg = computeIDCG(10, 3);
    const expected = 1 / Math.log2(2) + 1 / Math.log2(3) + 1 / Math.log2(4);
    expect(idcg).toBeCloseTo(expected, 10);
  });
});

describe("computeAggregatedMetrics", () => {
  it("empty perQuery list", () => {
    const m = computeAggregatedMetrics([], [1, 5]);
    expect(m.totalQueries).toBe(0);
    expect(m.avgFirstRelevantRank).toBeNull();
    expect(m.hitRate[1]).toBe(0);
  });

  it("perfect retrieval", () => {
    const queries: PerQueryMetrics[] = [
      {
        queryId: "q1",
        query: "q1",
        retrievedChunkIds: ["a", "b", "c"],
        relevantChunkIds: ["a", "b"],
        hitAtK: { 1: true, 3: true },
        reciprocalRank: 1,
        relevantRanks: [1, 2],
      },
    ];
    const m = computeAggregatedMetrics(queries, [1, 3]);
    expect(m.hitRate[1]).toBe(1);
    expect(m.hitRate[3]).toBe(1);
    expect(m.mrr[1]).toBe(1);
    expect(m.avgFirstRelevantRank).toBeCloseTo(1, 10);
  });

  it("mixed retrieval quality", () => {
    const queries: PerQueryMetrics[] = [
      {
        queryId: "q1",
        query: "q1",
        retrievedChunkIds: ["x", "a", "b", "c"],
        relevantChunkIds: ["a"],
        hitAtK: { 1: false, 3: true, 5: true },
        reciprocalRank: 0.5,
        relevantRanks: [2],
      },
      {
        queryId: "q2",
        query: "q2",
        retrievedChunkIds: ["z", "y"],
        relevantChunkIds: ["a"],
        hitAtK: { 1: false, 3: false, 5: false },
        reciprocalRank: 0,
        relevantRanks: [],
      },
    ];
    const m = computeAggregatedMetrics(queries, [1, 3, 5]);
    expect(m.hitRate[1]).toBe(0);
    expect(m.hitRate[3]).toBe(0.5);
    expect(m.mrr[3]).toBeCloseTo(0.25, 10);
    expect(m.mrr[5]).toBeCloseTo(0.25, 10);
    expect(m.avgFirstRelevantRank).toBeCloseTo(2, 10);
  });

  it("no relevant found for any query", () => {
    const queries: PerQueryMetrics[] = [
      {
        queryId: "q1",
        query: "q1",
        retrievedChunkIds: ["a", "b"],
        relevantChunkIds: ["x"],
        hitAtK: { 1: false, 5: false },
        reciprocalRank: 0,
        relevantRanks: [],
      },
    ];
    const m = computeAggregatedMetrics(queries, [1, 5]);
    expect(m.hitRate[1]).toBe(0);
    expect(m.hitRate[5]).toBe(0);
    expect(m.mrr[5]).toBe(0);
    expect(m.avgFirstRelevantRank).toBeNull();
  });
});
