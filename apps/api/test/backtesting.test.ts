import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("mock backtesting routes", () => {
  it("runs a mock stock backtest read-model dry run without provider keys or broker execution", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/backtesting/mock-read-model-dry-run",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: false,
        providerKeysRequired: [],
        notRecommendation: true,
        persistence: {
          scope: "in_memory",
          durable: false,
        },
        persistedInMemory: {
          backtestRuns: 1,
          backtestRunTrades: 4,
        },
        runs: [
          {
            id: "bt_mock_momentum_1",
            strategyFamily: "momentum",
            strategyVersionId: "momentum-v0",
            instrumentType: "stock",
            promotionGate: "ready_for_review",
            reasonCodes: [],
            notRecommendation: true,
            optionsProxy: false,
            dataFreshness: {
              status: "fresh",
              asOf: "2026-05-28T20:00:00.000Z",
            },
            metrics: {
              tradeCount: 4,
              winRatePct: 75,
              netReturnPct: 18.2815,
              benchmarkRelativeReturnPct: 14.2815,
            },
            assumptions: {
              pointInTimeData: true,
              survivorshipBiasControl: true,
              lookaheadBiasControl: true,
              costStressMultipliers: [1, 2, 3],
            },
          },
        ],
      });
      expect(body.runs[0].sourceCitations[0]).toMatchObject({
        title: "Mock adjusted OHLCV history",
        source: "mock-provider",
        publishedAt: "2026-05-28T19:55:00.000Z",
        retrievedAt: "2026-05-28T20:00:00.000Z",
      });
      expect(
        body.runs[0].trades.map((trade: { sourceTradeId: string }) => trade.sourceTradeId),
      ).toEqual(["trade-1", "trade-2", "trade-3", "trade-4"]);
      expect("brokerExecution" in body.runs[0]).toBe(false);
      expect("liveTradingEnabled" in body.runs[0]).toBe(false);
    } finally {
      await server.close();
    }
  });
});
