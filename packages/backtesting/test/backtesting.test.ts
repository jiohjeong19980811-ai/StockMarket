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
    minAverageDailyDollarVolume: 20_000_000,
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
      averageDailyDollarVolume: 80_000_000,
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
      averageDailyDollarVolume: 60_000_000,
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
      averageDailyDollarVolume: 30_000_000,
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
      averageDailyDollarVolume: 100_000_000,
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
    expect(result.metrics.averageReturnPct).toBe(4.499);
    expect(result.metrics.medianReturnPct).toBe(7.2479);
    expect(result.metrics.maxDrawdownPct).toBe(6.25);
    expect(result.metrics.netReturnPct).toBe(18.2815);
    expect(result.metrics.benchmarkRelativeReturnPct).toBe(14.2815);
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

  it("blocks options-family stock proxy runs", () => {
    const result = evaluateStockBacktest(
      inputWith({
        strategyFamily: "options",
        instrumentType: "stock",
        optionsProxy: false,
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toContain("options_backtest_not_supported");
  });

  it("blocks invalid source, freshness, and backtest period timestamps", () => {
    const result = evaluateStockBacktest(
      inputWith({
        period: {
          start: "not-a-date",
          end: "2026-05-28T20:00:00.000Z",
        },
        dataFreshness: {
          status: "fresh",
          asOf: "",
          notes: [],
        },
        sourceCitations: [
          {
            title: "Missing timestamps",
            url: "https://example.test/mock/prices",
            source: "mock-provider",
            publishedAt: "",
            retrievedAt: "not-a-date",
          },
        ],
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining([
        "invalid_backtest_period",
        "invalid_source_timestamps",
        "invalid_freshness_timestamp",
      ]),
    );
  });

  it("blocks citations retrieved before publication", () => {
    const result = evaluateStockBacktest(
      inputWith({
        sourceCitations: [
          {
            ...baseBacktestInput.sourceCitations[0]!,
            publishedAt: "2026-05-28T20:00:00.000Z",
            retrievedAt: "2026-05-28T19:55:00.000Z",
          },
        ],
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toContain("invalid_source_timestamps");
  });

  it("blocks invalid cost assumptions and missing required stress multipliers", () => {
    const result = evaluateStockBacktest(
      inputWith({
        assumptions: {
          slippageBps: -1,
          spreadBps: 0,
          feePerTrade: -1,
          costStressMultipliers: [1],
        },
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining(["invalid_cost_assumptions", "missing_cost_stress_scenarios"]),
    );
  });

  it("downgrades heavily tuned parameter searches", () => {
    const result = evaluateStockBacktest(
      inputWith({
        assumptions: {
          rejectedParameterSets: 100,
        },
      }),
    );

    expect(result.promotionGate).toBe("needs_more_data");
    expect(result.reasonCodes).toContain("excessive_parameter_search");
  });

  it("blocks illiquid stock samples", () => {
    const result = evaluateStockBacktest(
      inputWith({
        trades: baseBacktestInput.trades.map((trade) => ({
          ...trade,
          averageDailyDollarVolume: 1_000_000,
        })),
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toContain("liquidity_filter_failed");
  });

  it("blocks trades outside the declared backtest period", () => {
    const result = evaluateStockBacktest(
      inputWith({
        trades: baseBacktestInput.trades.map((trade) =>
          trade.id === "trade-1"
            ? {
                ...trade,
                entryAt: "2026-01-01T14:30:00.000Z",
              }
            : trade,
        ),
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toContain("trade_outside_backtest_period");
  });

  it("blocks duplicate trade identifiers", () => {
    const result = evaluateStockBacktest(
      inputWith({
        trades: baseBacktestInput.trades.map((trade) =>
          trade.id === "trade-2"
            ? {
                ...trade,
                id: "trade-1",
              }
            : trade,
        ),
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toContain("duplicate_trade");
  });

  it("blocks duplicate trade observations", () => {
    const result = evaluateStockBacktest(
      inputWith({
        trades: baseBacktestInput.trades.map((trade) =>
          trade.id === "trade-2"
            ? {
                ...baseBacktestInput.trades[0]!,
                id: "trade-1-copy",
              }
            : trade,
        ),
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toContain("duplicate_trade");
  });

  it("blocks duplicate trade observations even when quantity differs", () => {
    const result = evaluateStockBacktest(
      inputWith({
        trades: baseBacktestInput.trades.map((trade) =>
          trade.id === "trade-2"
            ? {
                ...baseBacktestInput.trades[0]!,
                id: "trade-1-resized",
                quantity: 99,
              }
            : trade,
        ),
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toContain("duplicate_trade");
  });

  it("excludes duplicate and out-of-period rows from returned evidence metrics", () => {
    const result = evaluateStockBacktest(
      inputWith({
        trades: [
          baseBacktestInput.trades[0]!,
          {
            ...baseBacktestInput.trades[0]!,
            id: "trade-1-copy",
            quantity: 99,
          },
          {
            ...baseBacktestInput.trades[1]!,
            entryAt: "2026-01-01T14:30:00.000Z",
            exitAt: "2026-01-02T20:00:00.000Z",
          },
          baseBacktestInput.trades[2]!,
          baseBacktestInput.trades[3]!,
        ],
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining(["duplicate_trade", "trade_outside_backtest_period"]),
    );
    expect(result.metrics.tradeCount).toBe(3);
    expect(result.trades.map((trade) => trade.id)).toEqual(["trade-1", "trade-3", "trade-4"]);
  });

  it("blocks freshness timestamps before the backtest period ends", () => {
    const result = evaluateStockBacktest(
      inputWith({
        dataFreshness: {
          status: "fresh",
          asOf: "2026-04-01T20:00:00.000Z",
          notes: [],
        },
      }),
    );

    expect(result.promotionGate).toBe("blocked");
    expect(result.reasonCodes).toContain("invalid_freshness_timestamp");
  });

  it("sorts trades chronologically before computing drawdown", () => {
    const chronological = evaluateStockBacktest(baseBacktestInput);
    const reversed = evaluateStockBacktest(
      inputWith({
        trades: [...baseBacktestInput.trades].reverse(),
      }),
    );

    expect(reversed.metrics.maxDrawdownPct).toBe(chronological.metrics.maxDrawdownPct);
    expect(reversed.trades.map((trade) => trade.id)).toEqual([
      "trade-1",
      "trade-2",
      "trade-3",
      "trade-4",
    ]);
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
