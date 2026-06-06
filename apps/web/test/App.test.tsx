import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
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

const mockBacktestReadModelBody = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Dry-run stock backtest read-model data is discarded after the response.",
  },
  persistedInMemory: {
    backtestRuns: 1,
    backtestRunTrades: 4,
  },
  runs: [
    {
      id: "bt_mock_momentum_1",
      strategyFamily: "momentum",
      strategyVersionId: "momentum-v0",
      strategyVersionLabel: "v0",
      instrumentType: "stock",
      universe: "mock-liquid-large-cap",
      period: {
        start: "2026-01-02T14:30:00.000Z",
        end: "2026-05-28T20:00:00.000Z",
      },
      benchmarkReturnPct: 4,
      promotionGate: "ready_for_review",
      reasonCodes: [],
      metrics: {
        tradeCount: 4,
        winRatePct: 75,
        maxDrawdownPct: -6,
        netReturnPct: 18.2815,
        benchmarkRelativeReturnPct: 14.2815,
      },
      assumptions: {
        slippageBps: 5,
        spreadBps: 10,
        feePerTrade: 1,
        minTradesForReview: 4,
        minAverageDailyDollarVolume: 20000000,
        pointInTimeData: true,
        survivorshipBiasControl: true,
        lookaheadBiasControl: true,
        rejectedParameterSets: 2,
        costStressMultipliers: [1, 2, 3],
        notes: ["Mock run uses adjusted close values and conservative cost stress."],
      },
      sourceCitations: [
        {
          title: "Mock adjusted OHLCV history",
          url: "https://example.test/mock/prices",
          source: "mock-provider",
          publishedAt: "2026-05-28T19:55:00.000Z",
          retrievedAt: "2026-05-28T20:00:00.000Z",
        },
      ],
      dataFreshness: {
        status: "fresh",
        asOf: "2026-05-28T20:00:00.000Z",
        notes: [],
      },
      optionsProxy: false,
      notRecommendation: true,
      trades: [
        {
          id: "bt_trade_1",
          sourceTradeId: "trade-1",
          ticker: "MSFT",
          netReturnPct: 9.75,
          grossReturnPct: 10,
          holdingDays: 7,
          exitOrder: 0,
          createdAt: "2026-05-29T18:00:00.000Z",
        },
      ],
      createdAt: "2026-05-29T18:00:00.000Z",
      updatedAt: "2026-05-29T18:00:00.000Z",
    },
  ],
};

const mockDailyOpportunityBody = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  report: {
    id: "daily_mock_20260528",
    mode: "mock",
    generatedAt: "2026-05-28T15:05:00.000Z",
    outcome: "ranked_opportunities",
    notRecommendation: true,
    liveTradingEnabled: false,
    providerKeysRequired: [],
    disclaimer: "Research signals only; not financial advice or a performance promise.",
    reviewedCount: 2,
    opportunityCount: 1,
    noGoodTrades: null,
    opportunities: [
      {
        rank: 1,
        id: "candidate-MSFT-momentum-daily-1",
        ticker: "MSFT",
        instrumentType: "stock",
        strategyFamily: "momentum",
        strategyPolicy: {
          family: "momentum",
          label: "Momentum",
          mvpDecision: "test_now",
          paperTradeAllowed: true,
        },
        decision: "paper_trade",
        scores: {
          risk: 86,
          confidence: 81,
          liquidity: 86,
        },
        thesis: "Mock momentum candidate with verified stock backtest evidence.",
        bullCase: "Mock trend evidence and liquidity support a paper-only entry test.",
        bearCase: "Trend may reverse before a paper entry can validate the thesis.",
        downsideScenario: "Shares close below the mock breakout level.",
        invalidationConditions: ["Close below mock breakout level"],
        whySystemMightBeWrong: "Mock data may not represent current market behavior.",
        sourceCitations: [
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
        liquidity: {
          score: 86,
          averageDailyDollarVolume: 60000000,
          spreadPercentOfMid: 0.02,
          passes: true,
        },
        evidence: {
          status: "paper_trade_eligible",
          gate: "verified",
          ids: ["bt_mock_momentum_1"],
        },
        gateSummary: [],
        notRecommendation: true,
      },
    ],
    reviewedCandidates: [
      {
        id: "candidate-MSFT-momentum-daily-1",
        ticker: "MSFT",
        instrumentType: "stock",
        strategyFamily: "momentum",
        decision: "paper_trade",
        scores: {
          risk: 86,
          confidence: 81,
          liquidity: 86,
        },
        reasonCodes: [],
        failedGates: [],
      },
    ],
  },
};

const mockNoGoodDailyOpportunityBody = {
  ...mockDailyOpportunityBody,
  report: {
    ...mockDailyOpportunityBody.report,
    id: "daily_mock_no_good",
    outcome: "no_good_trades",
    opportunityCount: 0,
    opportunities: [],
    noGoodTrades: {
      message: "No good trades today.",
      reasonCodes: ["liquidity", "citations_present", "paper_trade_evidence"],
    },
    reviewedCandidates: [
      {
        id: "candidate-MSFT-low-liquidity-1",
        ticker: "MSFT",
        instrumentType: "stock",
        strategyFamily: "momentum",
        decision: "avoid",
        scores: {
          risk: 83,
          confidence: 81,
          liquidity: 45,
        },
        reasonCodes: ["liquidity"],
        failedGates: [],
      },
    ],
  },
};

const mockDailyHistoryBody = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Dry-run daily opportunity history data is discarded after the response.",
  },
  persistedInMemory: {
    dailyOpportunityReports: 1,
    dailyOpportunityReportRecommendations: 1,
    recommendations: 1,
    recommendationCitations: 0,
    auditLogs: 1,
  },
  reports: [
    {
      id: "daily_mock_20260528",
      generatedAt: "2026-05-28T15:05:00.000Z",
      outcome: "ranked_opportunities",
      reviewedCount: 2,
      opportunityCount: 1,
      providerKeysRequired: [],
      disclaimer: "Research signals only; not financial advice or a performance promise.",
      noGoodTrades: null,
      liveTradingEnabled: false,
      notRecommendation: true,
      recommendations: [
        {
          reportRank: 1,
          id: "candidate-MSFT-momentum-daily-1",
          ticker: "MSFT",
          instrumentType: "stock",
          strategyVersionId: "momentum-v0",
          decision: "paper_trade",
          evidenceStatus: "paper_trade_eligible",
          evidenceGate: "verified",
          thesis: "Mock stock-only paper trade candidate for contract evaluation.",
          bullCase: "Mock trend evidence and liquidity support a paper-only entry test.",
          bearCase: "Trend may reverse before a paper entry can validate the thesis.",
          downsideScenario: "Shares close below the mock breakout level.",
          invalidationConditions: ["Close below mock breakout level"],
          whySystemMightBeWrong: "Mock data may not represent real market behavior.",
          sourceCitations: [
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
          scores: {
            risk: 100,
            confidence: 82,
            liquidity: 86,
          },
          evidenceIds: {
            backtestRunId: "bt_mock_momentum_1",
            paperTradeEvidenceId: null,
          },
          createdAt: "2026-05-29T18:05:00.000Z",
          updatedAt: "2026-05-29T18:05:00.000Z",
        },
      ],
      createdAt: "2026-05-29T18:05:00.000Z",
      updatedAt: "2026-05-29T18:05:00.000Z",
    },
  ],
};

const mockNoGoodDailyHistoryBody = {
  ...mockDailyHistoryBody,
  persistedInMemory: {
    ...mockDailyHistoryBody.persistedInMemory,
    dailyOpportunityReportRecommendations: 0,
    recommendations: 0,
  },
  reports: [
    {
      ...mockDailyHistoryBody.reports[0],
      id: "daily_mock_no_good",
      outcome: "no_good_trades",
      opportunityCount: 0,
      noGoodTrades: {
        message: "No good trades today.",
        reasonCodes: ["fresh_data", "paper_trade_evidence"],
      },
      recommendations: [],
    },
  ],
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
        const body = url.includes("opportunities/mock-history-dry-run")
          ? mockDailyHistoryBody
          : url.includes("opportunities/mock-daily-dry-run")
            ? mockDailyOpportunityBody
            : url.includes("backtesting/mock-read-model-dry-run")
              ? mockBacktestReadModelBody
              : url.includes("mock-read-model-dry-run")
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
    expect(screen.getByText("Milestone 9")).toBeInTheDocument();
    expect(
      screen.getByText("Research first. Paper trading first. Live trading prohibited."),
    ).toBeInTheDocument();
    expect(screen.getByText("No good trades today is a valid outcome.")).toBeInTheDocument();
    expect((await screen.findAllByText("Watchlist")).length).toBeGreaterThan(0);
    expect(screen.getByText("Daily Opportunities")).toBeInTheDocument();
    expect(screen.getAllByText("Ranked Opportunities").length).toBeGreaterThan(0);
    expect(screen.getByText("Daily API snapshot")).toBeInTheDocument();
    expect(screen.getByText("Daily Recommendation History")).toBeInTheDocument();
    expect(screen.getByText("History API snapshot")).toBeInTheDocument();
    expect(screen.getByText("Stored Candidates")).toBeInTheDocument();
    expect(
      screen.getAllByText("Mock stock-only paper trade candidate for contract evaluation.").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("bt_mock_momentum_1").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "No broker or live-trading fields are exposed in daily recommendation history.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Ticker Detail")).toBeInTheDocument();
    const tickerDetail = screen.getByLabelText("Ticker detail research shell");
    expect(within(tickerDetail).getByText("Ticker API snapshot")).toBeInTheDocument();
    expect(within(tickerDetail).getAllByText("MSFT").length).toBeGreaterThan(0);
    expect(within(tickerDetail).getByText("Research Context")).toBeInTheDocument();
    expect(
      within(tickerDetail).getByText(
        "Mock stock-only paper trade candidate for contract evaluation.",
      ),
    ).toBeInTheDocument();
    expect(within(tickerDetail).getByText("Mock daily price history")).toBeInTheDocument();
    expect(within(tickerDetail).getAllByText("2026-05-28T14:30:00.000Z").length).toBeGreaterThan(0);
    expect(within(tickerDetail).getByText("Downside")).toBeInTheDocument();
    expect(
      within(tickerDetail).getByText("Shares close below the mock breakout level."),
    ).toBeInTheDocument();
    expect(within(tickerDetail).getByText("Invalidation")).toBeInTheDocument();
    expect(within(tickerDetail).getByText("Close below mock breakout level")).toBeInTheDocument();
    expect(within(tickerDetail).getByText("Why It Might Be Wrong")).toBeInTheDocument();
    expect(
      within(tickerDetail).getByText("Mock data may not represent real market behavior."),
    ).toBeInTheDocument();
    expect(within(tickerDetail).getByLabelText("Ticker risk score summary")).toBeInTheDocument();
    expect(within(tickerDetail).getByText("Risk Controls")).toBeInTheDocument();
    expect(within(tickerDetail).getByText("100")).toBeInTheDocument();
    expect(within(tickerDetail).getByText("Confidence")).toBeInTheDocument();
    expect(within(tickerDetail).getByText("82")).toBeInTheDocument();
    expect(within(tickerDetail).getByText("Liquidity")).toBeInTheDocument();
    expect(within(tickerDetail).getByText("86")).toBeInTheDocument();
    expect(within(tickerDetail).getByText("bt_mock_momentum_1")).toBeInTheDocument();
    expect(within(tickerDetail).getByText("Paper-only review actions")).toBeInTheDocument();
    expect(within(tickerDetail).getByRole("button", { name: "Watch Ticker" })).toBeDisabled();
    expect(within(tickerDetail).getByRole("button", { name: "Reject Ticker" })).toBeDisabled();
    expect(
      within(tickerDetail).getByRole("button", { name: "Paper Trade Candidate" }),
    ).toBeDisabled();
    expect(
      within(tickerDetail).getByText(
        "Ticker detail is a research workspace; not financial advice or a trade instruction.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("candidate-MSFT-momentum-daily-1").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Mock momentum candidate with verified stock backtest evidence.").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Mock daily price history").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2026-05-28T14:30:00.000Z").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Close below mock breakout level").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Research signals only; not financial advice or a performance promise.")
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "No good trades today remains valid when every reviewed candidate is blocked.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Opportunity Detail")).toBeInTheDocument();
    const opportunityDetail = screen.getByLabelText("Opportunity detail research shell");
    expect(within(opportunityDetail).getByText("Opportunity API snapshot")).toBeInTheDocument();
    expect(
      within(opportunityDetail).getByText("candidate-MSFT-momentum-daily-1"),
    ).toBeInTheDocument();
    expect(within(opportunityDetail).getByText("Rank")).toBeInTheDocument();
    expect(within(opportunityDetail).getByText("1")).toBeInTheDocument();
    expect(within(opportunityDetail).getAllByText("MSFT").length).toBeGreaterThan(0);
    expect(
      within(opportunityDetail).getByText(
        "Mock momentum candidate with verified stock backtest evidence.",
      ),
    ).toBeInTheDocument();
    expect(within(opportunityDetail).getByText("Mock daily price history")).toBeInTheDocument();
    expect(
      within(opportunityDetail).getAllByText("2026-05-28T14:30:00.000Z").length,
    ).toBeGreaterThan(0);
    expect(within(opportunityDetail).getByText("Downside")).toBeInTheDocument();
    expect(
      within(opportunityDetail).getByText("Shares close below the mock breakout level."),
    ).toBeInTheDocument();
    expect(within(opportunityDetail).getByText("Invalidation")).toBeInTheDocument();
    expect(
      within(opportunityDetail).getByText("Close below mock breakout level"),
    ).toBeInTheDocument();
    expect(within(opportunityDetail).getByText("Why It Might Be Wrong")).toBeInTheDocument();
    expect(
      within(opportunityDetail).getByText("Mock data may not represent current market behavior."),
    ).toBeInTheDocument();
    expect(
      within(opportunityDetail).getByLabelText("Opportunity risk score summary"),
    ).toBeInTheDocument();
    expect(within(opportunityDetail).getAllByText("86").length).toBeGreaterThan(0);
    expect(within(opportunityDetail).getByText("81")).toBeInTheDocument();
    expect(within(opportunityDetail).getByText("bt_mock_momentum_1")).toBeInTheDocument();
    expect(
      within(opportunityDetail).getByText("Paper-only opportunity actions"),
    ).toBeInTheDocument();
    expect(
      within(opportunityDetail).getByRole("button", { name: "Watch Opportunity" }),
    ).toBeDisabled();
    expect(
      within(opportunityDetail).getByRole("button", { name: "Reject Opportunity" }),
    ).toBeDisabled();
    expect(
      within(opportunityDetail).getByRole("button", { name: "Accept Paper Candidate" }),
    ).toBeDisabled();
    expect(
      within(opportunityDetail).getByRole("button", { name: "Needs More Data" }),
    ).toBeDisabled();
    expect(
      within(opportunityDetail).getByText(
        "Opportunity detail is a research review workspace; paper-only actions stay disabled until audit-backed decision writes are implemented.",
      ),
    ).toBeInTheDocument();
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
    expect(
      within(screen.getByLabelText("Paper trade evidence summary")).getByText("2"),
    ).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Paper trade evidence summary")).getByText("1"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Paper trade evidence summary")).getByText("Win Rate"),
    ).toBeInTheDocument();
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
    expect(
      screen.getAllByText("Shares close below the mock breakout level.").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Close below mock breakout level").length).toBeGreaterThan(0);
    expect(screen.getByText("operator_decision")).toBeInTheDocument();
    expect(screen.getByText("paper_trade_closed")).toBeInTheDocument();
    expect(screen.getByText("paper_trade")).toBeInTheDocument();
    expect(screen.getByText("No evidence reason codes")).toBeInTheDocument();
    expect(screen.getByText("Stock Backtest Evidence")).toBeInTheDocument();
    expect(screen.getByText("Ready for Review")).toBeInTheDocument();
    expect(screen.getByText("Backtest API snapshot")).toBeInTheDocument();
    expect(screen.getAllByText("bt_mock_momentum_1").length).toBeGreaterThan(0);
    expect(screen.getByText("Trade Count")).toBeInTheDocument();
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    expect(screen.getByText("Net Return")).toBeInTheDocument();
    expect(screen.getByText("18.28%")).toBeInTheDocument();
    expect(screen.getByText("Relative")).toBeInTheDocument();
    expect(screen.getByText("14.28%")).toBeInTheDocument();
    expect(screen.getAllByText("MSFT").length).toBeGreaterThan(0);
    expect(
      within(screen.getByLabelText("Stock backtest trades")).getByText(
        /trade-1 - 9\.75% over 7 days/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Mock adjusted OHLCV history")).toBeInTheDocument();
    expect(screen.getByText("2026-05-28T19:55:00.000Z")).toBeInTheDocument();
    expect(screen.getAllByText("2026-05-28T20:00:00.000Z").length).toBeGreaterThan(0);
    expect(screen.getByText("Point-in-time data")).toBeInTheDocument();
    expect(screen.getByText("Cost Stress")).toBeInTheDocument();
    expect(screen.getByText("1x / 2x / 3x")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No broker or live-trading fields are exposed in this validation read model.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Watchlist" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Paper Trade" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Avoid" })).toBeDisabled();
    screen
      .getAllByRole("button", { name: "Needs More Data" })
      .forEach((button) => expect(button).toBeDisabled());
    expect(screen.getAllByText("Risk Controls").length).toBeGreaterThan(0);
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
    expect(screen.queryByText("Stock Backtest Evidence")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Opportunities")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Recommendation History")).not.toBeInTheDocument();
    expect(screen.queryByText("Ticker Detail")).not.toBeInTheDocument();
    expect(screen.queryByText("Opportunity Detail")).not.toBeInTheDocument();
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
    expect(screen.queryByText("Stock Backtest Evidence")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Opportunities")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Recommendation History")).not.toBeInTheDocument();
    expect(screen.queryByText("Ticker Detail")).not.toBeInTheDocument();
    expect(screen.queryByText("Opportunity Detail")).not.toBeInTheDocument();
    expect(screen.queryByText("Watchlist")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Watchlist" })).not.toBeInTheDocument();
  });

  it("shows the no-good-trades state when the daily report has no ranked opportunities", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();
        const body = url.includes("opportunities/mock-history-dry-run")
          ? mockNoGoodDailyHistoryBody
          : url.includes("opportunities/mock-daily-dry-run")
            ? mockNoGoodDailyOpportunityBody
            : url.includes("backtesting/mock-read-model-dry-run")
              ? mockBacktestReadModelBody
              : url.includes("mock-read-model-dry-run")
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

    expect(await screen.findByText("Daily Opportunities")).toBeInTheDocument();
    expect(screen.getAllByText("No Good Trades Today").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No good trades today.").length).toBeGreaterThan(0);
    expect(
      screen.getByText("liquidity, citations_present, paper_trade_evidence"),
    ).toBeInTheDocument();
    expect(screen.getByText("Daily Recommendation History")).toBeInTheDocument();
    expect(screen.getAllByText("No Good Trades Today").length).toBeGreaterThan(0);
    expect(screen.getByText("fresh_data, paper_trade_evidence")).toBeInTheDocument();
    expect(screen.queryByText("candidate-MSFT-momentum-daily-1")).not.toBeInTheDocument();
    expect(screen.queryByText("Opportunity Detail")).not.toBeInTheDocument();
  });
});
