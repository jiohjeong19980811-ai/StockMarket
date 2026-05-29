import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

function buildTestServer() {
  return buildServer({
    APP_ENV: "test",
    API_PORT: 4000,
    LIVE_TRADING_ENABLED: false,
  });
}

describe("local web CORS policy", () => {
  it("allows the StockMarket web origin to read mock API routes", async () => {
    const server = buildTestServer();

    try {
      const response = await server.inject({
        method: "GET",
        url: "/scoring/mock-evaluation",
        headers: {
          origin: "http://127.0.0.1:3001",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:3001");
      expect(response.headers.vary).toBe("Origin");
    } finally {
      await server.close();
    }
  });

  it("handles local POST preflight for paper-trade dry runs", async () => {
    const server = buildTestServer();

    try {
      const response = await server.inject({
        method: "OPTIONS",
        url: "/paper-trading/mock-close-dry-run",
        headers: {
          origin: "http://127.0.0.1:3001",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:3001");
      expect(response.headers["access-control-allow-methods"]).toContain("POST");
      expect(response.headers["access-control-allow-headers"]).toContain("content-type");
    } finally {
      await server.close();
    }
  });

  it("does not allow arbitrary browser origins", async () => {
    const server = buildTestServer();

    try {
      const response = await server.inject({
        method: "GET",
        url: "/health",
        headers: {
          origin: "http://127.0.0.1:9999",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    } finally {
      await server.close();
    }
  });
});
