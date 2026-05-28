import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server";

describe("health route", () => {
  it("returns service health without trading endpoints", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    const response = await server.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      service: "stockmarket-api",
      status: "ok",
      appEnv: "test",
      liveTradingEnabled: false,
    });
  });
});
