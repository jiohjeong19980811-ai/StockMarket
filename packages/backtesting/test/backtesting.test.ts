import { describe, expect, it } from "vitest";

import { evaluateStockBacktest, type StockBacktestInput } from "../src/index.js";

const baseBacktestInput: StockBacktestInput = {
  id: "backtest-momentum-v0-2026-05-29",
  strategyFamily: "momentum",
  strategyVersionId: "momentum-v0",
  instrumentType: "stock",
  universe: "mock-liquid-large-cap",
  period: {
    start: "2026-01-02T14:30:00.000Z",
    end: "2026-05-28T20:00:00.000Z",
  },
  benchmarkReturnPct: 4,
  dataFreshness: {
    status: "fresh",
    asOf: "2026-05-28T20:00:00.000Z",
    notes: [],
  },
  sourceCitations: [
    {
      title: "Mock adjusted OHLCV history",
      url: "https://example.test/mock/prices",
      source: "mock-provider",
      publishedAt: "2026-05-28T19:55:00.000Z",
      retrievedAt: "2026-05-28T20:00:00.000Z",
    },
  ],
  assumptions: {
    slippageBps: 5,
    spreadBps: 10,
    feePerTrade: 1,
    minTradesForReview: 4,
    pointInTimeData: true,
    survivorshipBiasControl: true,
    lookaheadBiasControl: true,
    rejectedParameterSets: 2,
    costStressMultipliers: [1, 2, 3],
    notes: ["Mock run uses adjusted close values and conservative cost stress."],
  },
  trades: [
    {
      id: "trade-1",
      ticker: "MSFT",
      sector: "Technology",
      entryAt: "2026-01-05T14:30:00.000Z",
      exitAt: "2026-01-12T20:00:00.000Z",
      entryPrice: 100,
      exitPrice: 110,
      quantity: 10,
    },
    {
      id: "trade-2",
      ticker: "AAPL",
      sector: "Technology",
      entryAt: "2026-02-03T14:30:00.000Z",
      exitAt: "2026-02-07T20:00:00.000Z",
      entryPrice: 100,
      exitPrice: 94,
      quantity: 10,
    },
    {
      id: "trade-3",
      ticker: "XLV",
      sector: "Health Care",
      entryAt: "2026-03-10T14:30:00.000Z",
      exitAt: "2026-03-20T20:00:00.000Z",
      entryPrice: 50,
      exitPrice: 55,
      quantity: 20,
    },
    {
      id: "trade-4",
      ticker: "SPY",
      sector: "Index",
      entryAt: "2026-04-02T14:30:00.000Z",
      exitAt: "2026-04-09T20:00:00.000Z",
      entryPrice: 80,
      exitPrice: 84,
      quantity: 12,
    },
  ],
};

function inputWith(
  overrides: Partial<Omit<StockBacktestInput, "assumptions">> & {
    assumptions?: Partial<StockBacktestInput["assumptions"]>;
  },
): StockBacktestInput {
  return {
    ...baseBacktestInput,
    ...overrides,
    assumptions: {
      ...baseBacktestInput.assumptions,
      ...overrides.assumptions,
    },
  };
}

describe("evaluateStockBacktest", () => {
  it("computes stock-only backtest metrics with conservative evidence status", () => {
    const result = evaluateStockBacktest(baseBacktestInput);

    expect(result).toMatchObject({
      notRecommendation: true,
      promotionGate: "ready_for_review",
      reasonCodes: [],
      strategyFamily: "momentum",
      strategyVersionId: "momentum-v0",
      instrumentType: "stock",
    });
    expect(result.metrics.tradeCount).toBe(4);
    expect(result.metrics.winRatePct).toBe(75);
    expect(result.metrics.averageReturnPct).toBeGreaterThan(4);
    expect(result.metrics.medianReturnPct).toBeGreaterThan(6);
    expect(result.metrics.bestTradeReturnPct).toBeGreaterThan(9);
    expect(result.metrics.worstTradeReturnPct).toBeLessThan(-6);
    expect(result.metrics.profitFactor).toBeGreaterThan(3);
    expect(result.metrics.averageHoldingDays).toBeGreaterThan(6);
    expect(result.metrics.benchmarkRelativeReturnPct).toBeGreaterThan(0);
    expect(result.metrics.costSensitivity.map((scenario) => scenario.multiplier)).toEqual([
      1, 2, 3,
    ]);
    expect(result.metrics.costSensitivity[2]?.netReturnPct).toBeLessThan(
      result.metrics.costSensitivity[0]?.netReturnPct ?? Number.POSITIVE_INFINITY,
    );
  });

  it("keeps an undersized trade sample at needs_more_data", () => {
    const result = evaluateStockBacktest(
      inputWith({
        trades: baseBacktestInput.trades.slice(0, 3),
      }),
    );

    expect(result.promotionGate).toBe("needs_more_data");
    expect(result.reasonCodes).toContain("insufficient_trade_count");
    expect(result.metrics.tradeCount).toBe(3);
  });

  it("blocks runs without point-in-time, survivorship, and lookahead controls", () => {
    const result = evaluateStockBacktest(
      inputWith({
        assumptions: {
          pointInTimeData: false,
          survivorshipBiasControl: false,
          lookaheadBiasControl: false,
        },
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining([
        "missing_point_in_time_control",
        "missing_survivorship_bias_control",
        "missing_lookahead_bias_control",
      ]),
    );
  });

  it("keeps missing citations or missing freshness at needs_more_data", () => {
    const result = evaluateStockBacktest(
      inputWith({
        sourceCitations: [],
        dataFreshness: {
          status: "missing",
          asOf: "2026-05-28T20:00:00.000Z",
          notes: ["Mock freshness intentionally missing."],
        },
      }),
    );

    expect(result.promotionGate).toBe("needs_more_data");
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining(["missing_source_citations", "missing_data_freshness"]),
    );
  });

  it("blocks non-stock instruments and options proxy runs", () => {
    const result = evaluateStockBacktest(
      inputWith({
        instrumentType: "long_call",
        optionsProxy: true,
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining(["non_stock_instrument", "options_backtest_not_supported"]),
    );
  });

  it("keeps empty trade runs at needs_more_data", () => {
    const result = evaluateStockBacktest(
      inputWith({
        trades: [],
      }),
    );

    expect(result.promotionGate).toBe("needs_more_data");
    expect(result.reasonCodes).toContain("no_trades");
    expect(result.metrics.tradeCount).toBe(0);
  });
});
