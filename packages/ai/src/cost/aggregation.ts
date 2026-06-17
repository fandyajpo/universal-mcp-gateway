import type { CostBreakdown, DailyCostPoint } from "./types";

export interface CostAggregationService {
  getWorkspaceCost(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number>;

  getModelCostBreakdown(
    startDate: Date,
    endDate: Date,
  ): Promise<CostBreakdown[]>;

  getUserCost(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number>;

  getDailyCostTrend(
    workspaceId: string,
    days: number,
  ): Promise<DailyCostPoint[]>;
}

export type CostAggregationQuery = (
  pipeline: Record<string, unknown>[],
) => Promise<Record<string, unknown>[]>;

export function createCostAggregationService(
  query: CostAggregationQuery,
): CostAggregationService {
  function createMatchStage(
    startDate: Date,
    endDate: Date,
    extraFilter?: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        ...extraFilter,
      },
    };
  }

  const DATE_FORMAT = { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };

  async function getWorkspaceCost(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const pipeline = [
      createMatchStage(startDate, endDate, { workspaceId }),
      { $group: { _id: null, totalCost: { $sum: "$cost" } } },
    ];

    const results = await query(pipeline);
    return results.length > 0 ? (results[0]?.totalCost as number) : 0;
  }

  async function getModelCostBreakdown(
    startDate: Date,
    endDate: Date,
  ): Promise<CostBreakdown[]> {
    const pipeline = [
      createMatchStage(startDate, endDate),
      {
        $group: {
          _id: "$model",
          totalCost: { $sum: "$cost" },
          requestCount: { $sum: 1 },
        },
      },
      { $sort: { totalCost: -1 } },
      {
        $project: {
          _id: 0,
          model: "$_id",
          totalCost: 1,
          requestCount: 1,
        },
      },
    ];

    const results = await query(pipeline);
    return results.map((r) => ({
      model: r.model as string,
      totalCost: r.totalCost as number,
      requestCount: r.requestCount as number,
    }));
  }

  async function getUserCost(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const pipeline = [
      createMatchStage(startDate, endDate, { userId }),
      { $group: { _id: null, totalCost: { $sum: "$cost" } } },
    ];

    const results = await query(pipeline);
    return results.length > 0 ? (results[0]?.totalCost as number) : 0;
  }

  async function getDailyCostTrend(
    workspaceId: string,
    days: number,
  ): Promise<DailyCostPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      createMatchStage(startDate, new Date(), { workspaceId }),
      {
        $group: {
          _id: DATE_FORMAT,
          cost: { $sum: "$cost" },
        },
      },
      { $sort: { _id: 1 as const } as Record<string, unknown> },
      {
        $project: {
          _id: 0,
          date: "$_id",
          cost: 1,
        },
      },
    ];

    const results = await query(pipeline);
    return results.map((r) => ({
      date: r.date as string,
      cost: r.cost as number,
    }));
  }

  return {
    getWorkspaceCost,
    getModelCostBreakdown,
    getUserCost,
    getDailyCostTrend,
  };
}
