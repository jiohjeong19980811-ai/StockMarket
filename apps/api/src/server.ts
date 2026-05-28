import fastify from "fastify";
import type { ApiEnv } from "./env";

export function buildServer(env: ApiEnv) {
  const server = fastify({
    logger: env.APP_ENV !== "test",
  });

  server.get("/health", async () => ({
    service: "stockmarket-api",
    status: "ok",
    appEnv: env.APP_ENV,
    liveTradingEnabled: env.LIVE_TRADING_ENABLED,
    timestamp: new Date().toISOString(),
  }));

  return server;
}
