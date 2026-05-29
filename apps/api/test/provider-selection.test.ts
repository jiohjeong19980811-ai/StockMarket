import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("provider selection route", () => {
  it("returns provider decisions without requiring environment variables", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "GET",
        url: "/providers/selection",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        mode: "policy",
        requiresEnv: false,
        liveTradingEnabled: false,
        providerKeysRequiredNow: [],
        useNow: ["mock"],
        evaluateFirst: ["polygon", "financial-modeling-prep", "finnhub"],
        deferred: ["tradier", "alpaca"],
      });
      expect(body.candidates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "mock",
            decision: "use_now",
            requiredEnv: [],
          }),
          expect.objectContaining({
            id: "polygon",
            decision: "evaluate_first",
            requiredEnv: ["POLYGON_API_KEY"],
          }),
        ]),
      );
      expect(
        body.candidates.flatMap((candidate: { requiredEnv: string[] }) => candidate.requiredEnv),
      ).not.toContain("NEWS_API_KEY");
    } finally {
      await server.close();
    }
  });
});
