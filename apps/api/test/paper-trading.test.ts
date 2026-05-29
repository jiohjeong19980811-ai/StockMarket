import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("mock paper-trading route", () => {
  it("returns a simulated paper-trade decision without provider keys or broker execution", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "GET",
        url: "/paper-trading/mock-decision",
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
          durable: false,
        },
        result: {
          status: "accepted",
          reasonCodes: [],
          trade: {
            mode: "paper",
            liveTradingEnabled: false,
            brokerExecution: false,
            ticker: "MSFT",
            instrumentType: "stock",
            status: "open",
          },
        },
      });
    } finally {
      await server.close();
    }
  });
});
