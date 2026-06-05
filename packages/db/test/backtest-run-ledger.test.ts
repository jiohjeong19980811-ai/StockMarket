import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { evaluateStockBacktest, type StockBacktestInput } from "@stockmarket/backtesting";
import {
  createLocalClient,
  listPersistedStockBacktestRuns,
  persistStockBacktestRun,
  runMigrations,
} from "../src/index.js";
import type { Client } from "@libsql/client";

const now = "2026-05-29T18:00:00.000Z";

let client: Client;

async function execute(sql: string, args: unknown[] = []) {
  return client.execute({ sql, args });
}

async function seedStrategy() {
  await execute(
    `INSERT INTO strategy_definitions
      (id, family, name, description, allowed_instrument_types_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    [
      "strategy_momentum",
      "momentum",
      "Momentum",
      "Liquid stock momentum research.",
      '["stock"]',
      now,
    ],
  );
  await execute(
    `INSERT INTO strategy_versions
      (id, strategy_definition_id, version, validation_status, promotion_state,
       required_data_json, risk_policy_version, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "momentum-v0",
      "strategy_momentum",
      "v0",
      "research_only",
      "research_only",
      '["prices","backtests","audit"]',
      "risk-v0",
      now,
    ],
  );
}

const backtestInput: StockBacktestInput = {
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
      entryAt: "2026-01-05T14:30:00.000Z",
      exitAt: "2026-01-12T20:00:00.000Z",
      entryPrice: 100,
      exitPrice: 110,
      quantity: 10,
      averageDailyDollarVolume: 80_000_000,
    },
    {
      id: "trade-2",
      ticker: "MSFT",
      entryAt: "2026-02-03T14:30:00.000Z",
      exitAt: "2026-02-07T20:00:00.000Z",
      entryPrice: 100,
      exitPrice: 94,
      quantity: 10,
      averageDailyDollarVolume: 60_000_000,
    },
    {
      id: "trade-3",
      ticker: "MSFT",
      entryAt: "2026-03-10T14:30:00.000Z",
      exitAt: "2026-03-20T20:00:00.000Z",
      entryPrice: 50,
      exitPrice: 55,
      quantity: 20,
      averageDailyDollarVolume: 30_000_000,
    },
    {
      id: "trade-4",
      ticker: "MSFT",
      entryAt: "2026-04-02T14:30:00.000Z",
      exitAt: "2026-04-09T20:00:00.000Z",
      entryPrice: 80,
      exitPrice: 84,
      quantity: 12,
      averageDailyDollarVolume: 100_000_000,
    },
  ],
};

describe("backtest run ledger", () => {
  beforeEach(async () => {
    client = await createLocalClient();
    await runMigrations(client);
    await seedStrategy();
  });

  afterEach(() => {
    client.close();
  });

  it("persists a stock backtest run and ordered trade rows", async () => {
    const result = evaluateStockBacktest(backtestInput);

    const persisted = await persistStockBacktestRun(client, backtestInput, result, now);

    expect(persisted.notRecommendation).toBe(true);
    expect(persisted.promotionGate).toBe("ready_for_review");
    expect(persisted.metrics.tradeCount).toBe(4);
    expect(persisted.trades.map((trade) => trade.id)).toEqual([
      "trade-1",
      "trade-2",
      "trade-3",
      "trade-4",
    ]);

    const run = await client.execute("SELECT * FROM backtest_runs WHERE id = ?", [result.id]);
    expect(run.rows[0]).toMatchObject({
      strategy_version_id: "momentum-v0",
      instrument_type: "stock",
      promotion_gate: "ready_for_review",
      trade_count: 4,
      not_recommendation: 1,
      options_proxy: 0,
    });
    expect(JSON.parse(String(run.rows[0]?.metrics_json))).toMatchObject({
      tradeCount: 4,
      netReturnPct: 18.2815,
    });

    const trades = await client.execute(
      "SELECT source_trade_id, ticker, exit_order FROM backtest_run_trades WHERE backtest_run_id = ? ORDER BY exit_order",
      [result.id],
    );
    expect(trades.rows.map((row) => row.source_trade_id)).toEqual([
      "trade-1",
      "trade-2",
      "trade-3",
      "trade-4",
    ]);
  });

  it("reads persisted stock backtest runs as validation-only read models", async () => {
    const result = evaluateStockBacktest(backtestInput);
    await persistStockBacktestRun(client, backtestInput, result, now);

    const runs = await listPersistedStockBacktestRuns(client, { limit: 5 });

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      id: "backtest-momentum-v0-2026-05-29",
      strategyFamily: "momentum",
      strategyVersionId: "momentum-v0",
      instrumentType: "stock",
      universe: "mock-liquid-large-cap",
      promotionGate: "ready_for_review",
      reasonCodes: [],
      notRecommendation: true,
      optionsProxy: false,
      dataFreshness: {
        status: "fresh",
        asOf: "2026-05-28T20:00:00.000Z",
        notes: [],
      },
      metrics: {
        tradeCount: 4,
        netReturnPct: 18.2815,
        benchmarkRelativeReturnPct: 14.2815,
      },
      assumptions: {
        pointInTimeData: true,
        survivorshipBiasControl: true,
        lookaheadBiasControl: true,
        costStressMultipliers: [1, 2, 3],
      },
      sourceCitations: [
        {
          title: "Mock adjusted OHLCV history",
          source: "mock-provider",
          publishedAt: "2026-05-28T19:55:00.000Z",
          retrievedAt: "2026-05-28T20:00:00.000Z",
        },
      ],
    });
    expect(runs[0]?.trades[0]).toMatchObject({
      sourceTradeId: "trade-1",
      ticker: "MSFT",
      netReturnPct: 9.75,
      exitOrder: 0,
    });
    expect(runs[0]?.trades.map((trade) => trade.sourceTradeId)).toEqual([
      "trade-1",
      "trade-2",
      "trade-3",
      "trade-4",
    ]);
    expect("brokerExecution" in (runs[0] as Record<string, unknown>)).toBe(false);
    expect("liveTradingEnabled" in (runs[0] as Record<string, unknown>)).toBe(false);
  });

  it("rejects non-stock, options-proxy, or recommendation-shaped results", async () => {
    const result = evaluateStockBacktest(backtestInput);

    await expect(
      persistStockBacktestRun(
        client,
        {
          ...backtestInput,
          instrumentType: "long_call",
        },
        result,
        now,
      ),
    ).rejects.toThrow(/stock/i);
    await expect(
      persistStockBacktestRun(
        client,
        {
          ...backtestInput,
          optionsProxy: true,
        },
        result,
        now,
      ),
    ).rejects.toThrow(/options proxy/i);
    await expect(
      persistStockBacktestRun(
        client,
        backtestInput,
        {
          ...result,
          notRecommendation: false as true,
        },
        now,
      ),
    ).rejects.toThrow(/notRecommendation/i);
  });

  it("rejects result snapshots that do not match the evaluated input", async () => {
    const result = evaluateStockBacktest(backtestInput);

    await expect(
      persistStockBacktestRun(
        client,
        {
          ...backtestInput,
          trades: backtestInput.trades.slice(0, 3),
        },
        result,
        now,
      ),
    ).rejects.toThrow(/evaluated input/i);

    await expect(
      persistStockBacktestRun(
        client,
        backtestInput,
        {
          ...result,
          metrics: {
            ...result.metrics,
            tradeCount: result.metrics.tradeCount + 1,
          },
        },
        now,
      ),
    ).rejects.toThrow(/evaluated input/i);
  });
});
