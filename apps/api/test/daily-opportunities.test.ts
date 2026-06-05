import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("mock daily opportunities route", () => {
  it("returns a mock daily opportunity report without provider keys or live trading", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/opportunities/mock-daily-dry-run",
      });

      expect(response.statusCode, response.body).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: false,
        providerKeysRequired: [],
        notRecommendation: true,
        report: {
          mode: "mock",
          outcome: "ranked_opportunities",
          notRecommendation: true,
          liveTradingEnabled: false,
          providerKeysRequired: [],
          opportunityCount: 1,
          opportunities: [
            {
              ticker: "MSFT",
              decision: "paper_trade",
              downsideScenario: "Shares close below the mock breakout level.",
              invalidationConditions: ["Close below mock breakout level"],
              dataFreshness: {
                asOf: "2026-05-28T14:30:00.000Z",
              },
              sourceCitations: [
                {
                  title: "Mock daily price history",
                  retrievedAt: "2026-05-28T14:30:00.000Z",
                },
              ],
              evidence: {
                gate: "verified",
                ids: ["bt_mock_momentum_1"],
              },
            },
          ],
        },
      });
      expect(body.report.noGoodTrades).toBeNull();
      expect(body.report.opportunities[0].scores).toMatchObject({
        risk: expect.any(Number),
        confidence: expect.any(Number),
        liquidity: expect.any(Number),
      });
    } finally {
      await server.close();
    }
  });
});
