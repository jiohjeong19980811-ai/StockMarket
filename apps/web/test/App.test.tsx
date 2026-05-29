import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";

const mockScoringBody = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  result: {
    inputId: "mock-score-MSFT-momentum-watchlist",
    ticker: "MSFT",
    decision: "watchlist",
    evidenceStatus: "research_only",
    strategyPolicy: {
      family: "momentum",
      label: "Momentum",
      mvpDecision: "test_now",
      paperTradeAllowed: true,
      requiredData: ["Adjusted OHLCV"],
      backtestingRequirements: ["Turnover and cost modeling"],
      riskControls: ["Liquidity floor"],
      optionsConsiderations: ["Defined-risk options only after options evidence exists."],
      implementationComplexity: "medium",
      overfittingRisk: "medium",
      notes: "Liquid equity and ETF momentum is an MVP test-first family.",
    },
    scores: {
      risk: 83,
      confidence: 81,
      liquidity: 86,
    },
    gates: [
      {
        id: "citations_present",
        passed: true,
        impact: "needs_more_data",
        message: "Source citations and timestamps are required before scoring can promote an idea.",
      },
      {
        id: "paper_trade_evidence",
        passed: false,
        impact: "paper_trade_block",
        message: "Backtest or paper-trade evidence is required before paper-trade promotion.",
      },
    ],
    explanation: {
      summary: "Scored MSFT as momentum research with 81/100 confidence.",
      contributors: ["momentum: 78/100 - Mock trend strength is positive but still research-only."],
      assumptions: [
        "Scores are research signals only and are not guaranteed to predict returns.",
        "Risk score is a risk-control quality score where higher means safer controls.",
      ],
      blocks: ["Backtest or paper-trade evidence is required before paper-trade promotion."],
    },
  },
};

const mockPaperTradingBody = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Mock paper-trade decisions are contract evaluations and are not persisted.",
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
      risk: {
        maxLoss: 300,
        riskPctOfEquity: 0.3,
      },
    },
  },
};

const mockPaperCloseBody = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Mock paper-trade close dry runs use an in-memory ledger only.",
  },
  closeResult: {
    status: "accepted",
    reasonCodes: [],
    trade: {
      mode: "paper",
      liveTradingEnabled: false,
      brokerExecution: false,
      ticker: "MSFT",
      instrumentType: "stock",
      status: "closed",
      entryPrice: 100,
      exitPrice: 106,
      quantity: 10,
      realizedPnl: 60,
      realizedReturnPct: 6,
      lessons: ["Mock paper trade followed through before the time stop."],
      exitAudit: {
        auditLogId: "audit_mock_paper_close_1",
        priceTimestamp: "2026-05-31T20:00:00.000Z",
      },
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
};

const mockPaperEvidenceSummaryBody = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Mock paper-trade evidence summary data is generated in memory.",
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
    closedTradeAuditLogIds: ["audit_mock_paper_close_1", "audit_mock_paper_close_loss_1"],
    notes: [
      "Paper-trade evidence is a validation input, not a recommendation or performance promise.",
    ],
  },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("operator console shell", () => {
  it("shows research-first safety posture", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();
        const body = url.includes("mock-evidence-summary")
          ? mockPaperEvidenceSummaryBody
          : url.includes("mock-close-dry-run")
            ? mockPaperCloseBody
            : url.includes("paper-trading")
              ? mockPaperTradingBody
              : mockScoringBody;
        return new Response(JSON.stringify(body));
      }),
    );

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "StockMarket Operator Console" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Research first. Paper trading first. Live trading prohibited."),
    ).toBeInTheDocument();
    expect(screen.getByText("No good trades today is a valid outcome.")).toBeInTheDocument();
    expect(await screen.findByText("Watchlist")).toBeInTheDocument();
    expect(screen.getByText("No provider keys required")).toBeInTheDocument();
    expect(screen.getByText("Mock scoring evaluation")).toBeInTheDocument();
    expect(screen.getByText("Strategy Policy")).toBeInTheDocument();
    expect(screen.getByText("Momentum")).toBeInTheDocument();
    expect(screen.getByText("MVP Test Now")).toBeInTheDocument();
    expect(screen.getByText("Paper Trade Contract")).toBeInTheDocument();
    expect(screen.getByText("Simulated Open")).toBeInTheDocument();
    expect(screen.getByText("Max Loss")).toBeInTheDocument();
    expect(screen.getByText("$300")).toBeInTheDocument();
    expect(screen.getByText("Paper Trade Outcome")).toBeInTheDocument();
    expect(screen.getByText("Simulated Closed")).toBeInTheDocument();
    expect(screen.getByText("P/L")).toBeInTheDocument();
    expect(screen.getByText("$60")).toBeInTheDocument();
    expect(screen.getByText("Return")).toBeInTheDocument();
    expect(screen.getByText("6%")).toBeInTheDocument();
    expect(screen.getByText("Exit")).toBeInTheDocument();
    expect(screen.getByText("$106")).toBeInTheDocument();
    expect(
      screen.getByText("Mock paper trade followed through before the time stop."),
    ).toBeInTheDocument();
    expect(screen.getByText("Paper Trade Evidence")).toBeInTheDocument();
    expect(screen.getByText("Ready for Review")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Win Rate")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Realized")).toBeInTheDocument();
    expect(screen.getByText("$10")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Paper-trade evidence is a validation input, not a recommendation or performance promise.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Risk Controls")).toBeInTheDocument();
    expect(screen.getByText("83")).toBeInTheDocument();
  });

  it("keeps the dashboard usable when the API is offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("API offline");
      }),
    );

    render(<App />);

    expect(await screen.findByText("API offline")).toBeInTheDocument();
    expect(screen.getByText("Fallback mock snapshot")).toBeInTheDocument();
    expect(screen.getByText("Paper fallback snapshot")).toBeInTheDocument();
    expect(screen.getByText("Paper close fallback snapshot")).toBeInTheDocument();
    expect(screen.getByText("Evidence fallback snapshot")).toBeInTheDocument();
    expect(screen.getAllByText("Watchlist").length).toBeGreaterThan(0);
  });
});
