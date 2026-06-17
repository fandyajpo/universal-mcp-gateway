import type { EvalQuery, PerQueryMetrics, AggregatedMetrics } from "./types";

export function computePerQueryMetrics(
  query: EvalQuery,
  retrievedChunkIds: string[],
  ks: number[] = [1, 3, 5, 10, 20],
): PerQueryMetrics {
  const relevantSet = new Set(query.relevantChunkIds);
  const ranks: number[] = [];

  for (const [i, chunkId] of retrievedChunkIds.entries()) {
    if (relevantSet.has(chunkId)) {
      ranks.push(i + 1);
    }
  }

  const hitAtK: Record<number, boolean> = {};
  for (const k of ks) {
    hitAtK[k] = ranks.some((r) => r <= k);
  }

  const firstRelevantRank = ranks[0];
  const reciprocalRank =
    firstRelevantRank !== undefined ? 1 / firstRelevantRank : 0;

  return {
    queryId: query.id,
    query: query.query,
    retrievedChunkIds,
    relevantChunkIds: query.relevantChunkIds,
    hitAtK,
    reciprocalRank,
    relevantRanks: ranks,
  };
}

export function computeDCG(relevantRanks: Set<number>, k: number): number {
  let dcg = 0;
  for (let i = 0; i < k; i++) {
    if (relevantRanks.has(i + 1)) {
      dcg += 1 / Math.log2(i + 2);
    }
  }
  return dcg;
}

export function computeIDCG(totalRelevant: number, k: number): number {
  if (totalRelevant === 0) return 0;
  let idcg = 0;
  const idealCount = Math.min(totalRelevant, k);
  for (let i = 0; i < idealCount; i++) {
    idcg += 1 / Math.log2(i + 2);
  }
  return idcg;
}

export function computeAggregatedMetrics(
  perQuery: PerQueryMetrics[],
  ks: number[] = [1, 3, 5, 10, 20],
): AggregatedMetrics {
  const queryCount = perQuery.length;
  if (queryCount === 0) {
    return {
      hitRate: Object.fromEntries(ks.map((k) => [k, 0])),
      mrr: Object.fromEntries(ks.map((k) => [k, 0])),
      ndcg: Object.fromEntries(ks.map((k) => [k, 0])),
      precision: Object.fromEntries(ks.map((k) => [k, 0])),
      recall: Object.fromEntries(ks.map((k) => [k, 0])),
      avgFirstRelevantRank: null,
      totalQueries: 0,
    };
  }

  const hitRate: Record<number, number> = {};
  const mrr: Record<number, number> = {};
  const ndcg: Record<number, number> = {};
  const precision: Record<number, number> = {};
  const recall: Record<number, number> = {};
  let rankSum = 0;
  let rankCount = 0;

  for (const k of ks) {
    let hits = 0;
    let rrSum = 0;
    let ndcgSum = 0;
    let precSum = 0;
    let recallSum = 0;

    for (const pq of perQuery) {
      const relevantSet = new Set(pq.relevantChunkIds);
      const retrievedK = pq.retrievedChunkIds.slice(0, k);

      if (pq.hitAtK[k]) hits++;

      rrSum += computeMRRContribution(pq.relevantRanks, k);

      const relevantRanksAtK = new Set(
        pq.relevantRanks.filter((r) => r <= k),
      );
      const dcg = computeDCG(relevantRanksAtK, k);
      const idcg = computeIDCG(pq.relevantChunkIds.length, k);
      ndcgSum += idcg > 0 ? dcg / idcg : 0;

      let relevantCount = 0;
      for (const chunkId of retrievedK) {
        if (relevantSet.has(chunkId)) relevantCount++;
      }
      precSum += relevantCount / k;

      const totalRelevant = pq.relevantChunkIds.length;
      recallSum += totalRelevant > 0 ? relevantCount / totalRelevant : 0;
    }

    hitRate[k] = queryCount > 0 ? hits / queryCount : 0;
    mrr[k] = queryCount > 0 ? rrSum / queryCount : 0;
    ndcg[k] = queryCount > 0 ? ndcgSum / queryCount : 0;
    precision[k] = queryCount > 0 ? precSum / queryCount : 0;
    recall[k] = queryCount > 0 ? recallSum / queryCount : 0;
  }

  for (const pq of perQuery) {
    const firstRank = pq.relevantRanks[0];
    if (firstRank !== undefined) {
      rankSum += firstRank;
      rankCount++;
    }
  }

  return {
    hitRate,
    mrr,
    ndcg,
    precision,
    recall,
    avgFirstRelevantRank: rankCount > 0 ? rankSum / rankCount : null,
    totalQueries: queryCount,
  };
}

function computeMRRContribution(relevantRanks: number[], k: number): number {
  const first = relevantRanks.find((r) => r <= k);
  return first !== undefined ? 1 / first : 0;
}
