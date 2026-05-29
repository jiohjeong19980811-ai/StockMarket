import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("strategy policies route", () => {
  it("returns MVP strategy policy decisions without requiring provider keys", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "GET",
        url: "/strategies/policies",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        mode: "policy",
        requiresEnv: false,
        liveTradingEnabled: false,
        providerKeysRequired: [],
        paperTradeFirst: true,
      });
      expect(body.policies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            family: "momentum",
            mvpDecision: "test_now",
            paperTradeAllowed: true,
          }),
          expect.objectContaining({
            family: "value_quality",
            mvpDecision: "context_only",
            paperTradeAllowed: false,
          }),
        ]),
      );
    } finally {
      await server.close();
    }
  });
});
