import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("mock ingestion dry-run route", () => {
  it("runs mock ingestion without provider keys or broker execution", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/ingestion/mock-dry-run",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: false,
        providerKeysRequired: [],
        persistence: {
          scope: "in_memory",
          durable: false,
        },
        persistedInMemory: {
          ingestionRuns: 4,
          providerRecords: 5,
          priceBars: 2,
          newsArticles: 1,
          earningsEvents: 1,
          optionQuotes: 1,
          dataQualityEvents: 0,
        },
      });
    } finally {
      await server.close();
    }
  });
});
