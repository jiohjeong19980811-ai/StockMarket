import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/env";

describe("API environment validation", () => {
  it("rejects live trading", () => {
    expect(() =>
      loadEnv({
        APP_ENV: "development",
        API_PORT: "4000",
        LIVE_TRADING_ENABLED: "true"
      })
    ).toThrow("LIVE_TRADING_ENABLED must remain false in MVP");
  });

  it("loads safe development defaults", () => {
    const env = loadEnv({
      APP_ENV: "development",
      API_PORT: "4000",
      LIVE_TRADING_ENABLED: "false"
    });

    expect(env.APP_ENV).toBe("development");
    expect(env.API_PORT).toBe(4000);
    expect(env.LIVE_TRADING_ENABLED).toBe(false);
  });
});
