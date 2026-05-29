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
        priceTimestamp: "2026-05-29T12:00:00.000Z",
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
    reviewStatus: "needs_more_data",
    reasonCodes: ["insufficient_closed_trades"],
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

const mockPaperReadModelBody = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Dry-run paper-trade read model data is discarded after the response.",
  },
  persistedInMemory: {
    recommendations: 1,
    auditLogs: 4,
    paperTrades: 1,
  },
  trades: [
    {
      id: "paper_rec-MSFT-paper-mock-1_20260528T150000000Z",
      recommendationId: "rec-MSFT-paper-mock-1",
      accountId: "paper_account_mock",
      mode: "paper",
      status: "closed",
      ticker: "MSFT",
      instrumentType: "stock",
      strategyVersionId: "momentum-v0",
      thesisSnapshot: "Mock stock-only paper trade candidate for contract evaluation.",
      entryReason: "Mock API read-model dry-run accepted a simulated stock paper entry.",
      downsideScenario: "Shares close below the mock breakout level.",
      invalidationConditions: ["Close below mock breakout level"],
      liveTradingEnabled: false,
      brokerExecution: false,
      audit: {
        operatorApprovalAuditLogId: "audit_mock_paper_open_1",
        entryAuditLogId: "audit_mock_paper_entry_1",
        exitAuditLogId: "audit_mock_paper_close_1",
      },
      entry: {
        type: "market",
        requestedPrice: 100,
        simulatedPrice: 100,
        quantity: 10,
        enteredAt: "2026-05-28T15:00:00.000Z",
        stopLoss: 95,
        profitTarget: 108,
        timeStopAt: "2026-06-11T20:00:00.000Z",
      },
      risk: {
        maxLossAmount: 300,
        riskPctOfEquity: 0.3,
        accountEquityAtEntry: 100000,
        singleNameExposurePct: 2,
        sectorExposurePct: 8,
        correlatedExposurePct: 4,
        dailyLossPctAtEntry: 0.1,
      },
      outcome: {
        closedAt: "2026-05-29T12:00:00.000Z",
        exitPrice: 106,
        exitReason: "Mock profit-target review hit during paper-trade validation.",
        lessonsLearned: "Mock paper trade followed through before the time stop.",
        realizedPnl: 60,
        realizedReturnPct: 6,
      },
      createdAt: "2026-05-28T15:00:00.000Z",
      updatedAt: "2026-05-29T12:00:00.000Z",
    },
  ],
};

const mockEvidenceDetailBody = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Dry-run evidence detail data is discarded after the response.",
  },
  persistedInMemory: {
    recommendations: 2,
    auditLogs: 5,
    paperTrades: 1,
  },
  evidenceDetail: {
    notRecommendation: true,
    evidenceGate: "verified",
    reasonCodes: [],
    recommendation: {
      id: "rec-MSFT-paper-candidate-1",
      ticker: "MSFT",
      instrumentType: "stock",
      strategyVersionId: "momentum-v0",
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      thesis: "Mock stock-only paper trade candidate for contract evaluation.",
      bullCase: "Mock trend evidence and liquidity support a paper-only entry test.",
      bearCase: "Trend may reverse before a paper entry can validate the thesis.",
      downsideScenario: "Shares close below the mock breakout level.",
      invalidationConditions: ["Close below mock breakout level"],
      whySystemMightBeWrong: "Mock data may not represent real market behavior.",
      scores: {
        risk: 86,
        confidence: 78,
        liquidity: 86,
      },
      evidenceIds: {
        backtestRunId: null,
        paperTradeEvidenceId: "paper_rec-MSFT-paper-mock-1_20260528T150000000Z",
      },
    },
    citations: [
      {
        title: "Mock daily price history",
        url: "https://example.test/mock/msft/prices",
        source: "mock-provider",
        publishedAt: "2026-05-28T14:00:00.000Z",
        retrievedAt: "2026-05-28T14:30:00.000Z",
      },
    ],
    dataFreshness: {
      status: "fresh",
      asOf: "2026-05-28T14:30:00.000Z",
      notes: [],
    },
    evidence: [
      {
        kind: "paper_trade",
        id: "paper_rec-MSFT-paper-mock-1_20260528T150000000Z",
        status: "verified",
        reasonCodes: [],
        ticker: "MSFT",
        instrumentType: "stock",
        strategyVersionId: "momentum-v0",
        closedAt: "2026-05-29T12:00:00.000Z",
        liveTradingEnabled: false,
        brokerExecution: false,
        realizedPnl: 60,
        realizedReturnPct: 6,
      },
    ],
    auditTrail: [
      {
        id: "audit_mock_candidate_rec_1",
        eventType: "operator_decision",
        actorType: "operator",
        actorId: "operator:mock",
        occurredAt: "2026-05-29T12:10:00.000Z",
        subjectType: "recommendation",
        subjectId: "rec-MSFT-paper-candidate-1",
        riskDecision: "pass",
        operatorDecision: "paper_trade",
        operatorNotes: "Mock candidate recommendation references durable paper-trade evidence.",
      },
      {
        id: "audit_mock_paper_close_1",
        eventType: "paper_trade_closed",
        actorType: "system",
        actorId: "paper-trading",
        occurredAt: "2026-05-29T12:00:00.000Z",
        subjectType: "paper_trade",
        subjectId: "paper_rec-MSFT-paper-mock-1_20260528T150000000Z",
        riskDecision: "pass",
        operatorDecision: "paper_trade",
        operatorNotes: "Mock profit-target review hit during paper-trade validation.",
      },
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
        const body = url.includes("mock-read-model-dry-run")
          ? mockPaperReadModelBody
          : url.includes("mock-evidence-detail-dry-run")
            ? mockEvidenceDetailBody
            : url.includes("mock-evidence-summary")
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
    expect((await screen.findAllByText("Watchlist")).length).toBeGreaterThan(0);
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
    expect(screen.getAllByText("P/L").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$60").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Return").length).toBeGreaterThan(0);
    expect(screen.getAllByText("6%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Exit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$106").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Mock paper trade followed through before the time stop.").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Paper Trade Evidence")).toBeInTheDocument();
    expect(screen.getAllByText("Needs More Data").length).toBeGreaterThan(0);
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
    expect(screen.getByText("Paper Trade Ledger")).toBeInTheDocument();
    expect(screen.getByText("Persisted Closed")).toBeInTheDocument();
    expect(screen.getByText("Ledger API snapshot")).toBeInTheDocument();
    expect(screen.getByText("Audit")).toBeInTheDocument();
    expect(screen.getByText("audit_mock_paper_close_1")).toBeInTheDocument();
    expect(screen.getByText("Entry")).toBeInTheDocument();
    expect(screen.getAllByText("$100").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "Read model preserves paper-only ledger state; no broker execution occurred.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Evidence Detail")).toBeInTheDocument();
    expect(screen.getByText("Verified Evidence")).toBeInTheDocument();
    expect(screen.getByText("mock-provider")).toBeInTheDocument();
    expect(screen.getByText("2026-05-28T14:00:00.000Z")).toBeInTheDocument();
    expect(screen.getAllByText("2026-05-28T14:30:00.000Z").length).toBeGreaterThan(0);
    expect(screen.getByText("Shares close below the mock breakout level.")).toBeInTheDocument();
    expect(screen.getAllByText("Close below mock breakout level").length).toBeGreaterThan(0);
    expect(screen.getByText("operator_decision")).toBeInTheDocument();
    expect(screen.getByText("paper_trade_closed")).toBeInTheDocument();
    expect(screen.getByText("paper_trade")).toBeInTheDocument();
    expect(screen.getByText("No evidence reason codes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Watchlist" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Paper Trade" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Avoid" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Needs More Data" })).toBeDisabled();
    expect(screen.getByText("Risk Controls")).toBeInTheDocument();
    expect(screen.getByText("83")).toBeInTheDocument();
  });

  it("keeps evidence metrics hidden while API data is loading", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    render(<App />);

    expect(screen.getAllByText("Loading").length).toBeGreaterThan(0);
    expect(screen.getByText("Loading operational data")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Evidence and paper-trade metrics stay hidden until the local API responds.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Evidence Detail")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Watchlist" })).not.toBeInTheDocument();
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
    expect(screen.getByText("Data unavailable")).toBeInTheDocument();
    expect(screen.getByText("No operational decision")).toBeInTheDocument();
    expect(
      screen.getByText("Sample trade metrics are hidden until the local API responds."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Simulated Closed")).not.toBeInTheDocument();
    expect(screen.queryByText("Ledger fallback snapshot")).not.toBeInTheDocument();
    expect(screen.queryByText("Evidence Detail")).not.toBeInTheDocument();
    expect(screen.queryByText("Watchlist")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Watchlist" })).not.toBeInTheDocument();
  });
});
