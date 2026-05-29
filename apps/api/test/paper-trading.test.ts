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

  it("runs a mock paper-trade ledger dry run without provider keys or broker execution", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/paper-trading/mock-ledger-dry-run",
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
          scope: "in_memory",
          durable: false,
        },
        result: {
          status: "accepted",
          reasonCodes: [],
        },
        persistedInMemory: {
          recommendations: 1,
          auditLogs: 3,
          paperTrades: 1,
        },
        ledger: {
          mode: "paper",
          liveTradingEnabled: false,
          brokerExecution: false,
          ticker: "MSFT",
          riskPctOfEquity: 0.3,
        },
      });
    } finally {
      await server.close();
    }
  });

  it("runs a mock paper-trade close dry run with exit audit linkage", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/paper-trading/mock-close-dry-run",
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
          scope: "in_memory",
          durable: false,
        },
        closeResult: {
          status: "accepted",
          reasonCodes: [],
          trade: {
            status: "closed",
            exitPrice: 106,
            realizedPnl: 60,
            realizedReturnPct: 6,
            brokerExecution: false,
          },
        },
        persistedInMemory: {
          recommendations: 1,
          auditLogs: 4,
          paperTrades: 1,
        },
        ledger: {
          status: "closed",
          exitAuditLogId: "audit_mock_paper_close_1",
          exitPrice: 106,
          lessonsLearned: "Mock paper trade followed through before the time stop.",
        },
      });
    } finally {
      await server.close();
    }
  });

  it("returns a mock paper-trade evidence summary without provider keys or broker execution", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "GET",
        url: "/paper-trading/mock-evidence-summary",
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
          scope: "in_memory",
          durable: false,
        },
        summary: {
          mode: "paper",
          liveTradingEnabled: false,
          brokerExecution: false,
          notRecommendation: true,
          status: "accepted",
          reviewStatus: "ready_for_review",
          reasonCodes: ["requires_backtest_and_operator_review"],
          totalTrades: 3,
          openTrades: 1,
          closedTrades: 2,
          winningTrades: 1,
          losingTrades: 1,
          winRatePct: 50,
          realizedPnl: 10,
          averageReturnPct: 0.5,
          averageRiskPctOfEquity: 0.3,
          largestWin: 60,
          largestLoss: -50,
        },
      });
      expect(body.summary.closedTradeAuditLogIds).toEqual([
        "audit_mock_paper_close_1",
        "audit_mock_paper_close_loss_1",
      ]);
    } finally {
      await server.close();
    }
  });
});
