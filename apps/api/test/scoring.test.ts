import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("mock scoring route", () => {
  it("returns a mock scoring evaluation without provider keys or broker execution", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "GET",
        url: "/scoring/mock-evaluation",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: false,
        providerKeysRequired: [],
        notRecommendation: true,
        result: {
          ticker: "MSFT",
          decision: "watchlist",
          scores: {
            risk: expect.any(Number),
            confidence: expect.any(Number),
            liquidity: expect.any(Number),
          },
        },
      });
      expect(body.result.explanation.assumptions).toContain(
        "Scores are research signals only and are not guaranteed to predict returns.",
      );
    } finally {
      await server.close();
    }
  });
});
