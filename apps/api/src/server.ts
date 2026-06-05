import fastify, { type FastifyReply } from "fastify";
import { evaluateStockBacktest, type StockBacktestInput } from "@stockmarket/backtesting";
import {
  createMockEarningsProvider,
  createMockMarketDataProvider,
  createMockNewsProvider,
  createMockOptionsProvider,
  evaluateProviderCandidates,
  ingestEarningsEvents,
  ingestNewsArticles,
  ingestOptionQuotes,
  ingestPriceBars,
  providerSelectionCandidates,
  type IngestionClock,
} from "@stockmarket/data";
import {
  closePersistedPaperTrade,
  createLocalClient,
  getRecommendationEvidenceDetail,
  listPersistedStockBacktestRuns,
  listPersistedPaperTrades,
  persistIngestionBatch,
  persistPaperTrade,
  persistStockBacktestRun,
  runMigrations,
} from "@stockmarket/db";
import {
  closePaperTrade,
  createPaperTrade,
  summarizePaperTradeEvidence,
  type PaperTradeExitRequest,
  type PaperTradeRequest,
} from "@stockmarket/paper-trading";
import {
  generateDailyOpportunityReport,
  listStrategyPolicies,
  scoreOpportunity,
  type DailyOpportunityCandidate,
  type ScoringInput,
} from "@stockmarket/scoring";
import type { Recommendation } from "@stockmarket/core";
import type { ApiEnv } from "./env.js";

type DryRunTableName =
  | "ingestion_runs"
  | "provider_records"
  | "price_bars"
  | "news_articles"
  | "earnings_events"
  | "option_quotes"
  | "data_quality_events"
  | "recommendations"
  | "audit_logs"
  | "paper_trades"
  | "backtest_runs"
  | "backtest_run_trades";

type LocalClient = Awaited<ReturnType<typeof createLocalClient>>;

const allowedWebOrigins = new Set(["http://127.0.0.1:3001", "http://localhost:3001"]);
const corsAllowMethods = "GET,POST,OPTIONS";
const corsAllowHeaders = "content-type";

function applyLocalWebCors(origin: unknown, reply: FastifyReply) {
  if (typeof origin !== "string" || !allowedWebOrigins.has(origin)) {
    return;
  }

  reply
    .header("Access-Control-Allow-Origin", origin)
    .header("Access-Control-Allow-Methods", corsAllowMethods)
    .header("Access-Control-Allow-Headers", corsAllowHeaders)
    .header("Access-Control-Max-Age", "600")
    .header("Vary", "Origin");
}

const mockScoringInput: ScoringInput = {
  id: "mock-score-MSFT-momentum-watchlist",
  ticker: "MSFT",
  instrumentType: "stock",
  strategyFamily: "momentum",
  evidenceStatus: "research_only",
  evidenceGate: "needs_more_data",
  evidenceIds: [],
  dataFreshness: {
    status: "fresh",
    asOf: "2026-05-28T14:30:00.000Z",
    notes: [],
  },
  sourceCitations: [
    {
      title: "Mock daily price history",
      url: "https://example.test/mock/msft/prices",
      source: "mock-provider",
      publishedAt: "2026-05-28T14:00:00.000Z",
      retrievedAt: "2026-05-28T14:30:00.000Z",
    },
  ],
  componentSignals: [
    {
      component: "momentum",
      score: 78,
      weight: 0.5,
      explanation: "Mock trend strength is positive but still research-only.",
    },
    {
      component: "liquidity",
      score: 86,
      weight: 0.3,
      explanation: "Mock dollar volume clears the stock liquidity floor.",
    },
    {
      component: "risk",
      score: 80,
      weight: 0.2,
      explanation: "Paper exposure is inside default risk limits.",
    },
  ],
  liquidity: {
    score: 86,
    averageDailyDollarVolume: 60_000_000,
    spreadPercentOfMid: 0.02,
    passes: true,
  },
  paperExposure: {
    proposedPositionRiskPct: 0.25,
    singleNameExposurePct: 3,
    sectorExposurePct: 10,
    correlatedExposurePct: 7,
    dailyLossPct: 0.4,
    aggregateOptionsPremiumPct: 0,
  },
};

const mockStockBacktestInput: StockBacktestInput = {
  id: "bt_mock_momentum_1",
  strategyFamily: "momentum",
  strategyVersionId: "momentum-v0",
  instrumentType: "stock",
  universe: "mock-liquid-large-cap",
  period: {
    start: "2026-01-02T14:30:00.000Z",
    end: "2026-05-28T20:00:00.000Z",
  },
  benchmarkReturnPct: 4,
  dataFreshness: {
    status: "fresh",
    asOf: "2026-05-28T20:00:00.000Z",
    notes: [],
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
  assumptions: {
    slippageBps: 5,
    spreadBps: 10,
    feePerTrade: 1,
    minTradesForReview: 4,
    minAverageDailyDollarVolume: 20_000_000,
    pointInTimeData: true,
    survivorshipBiasControl: true,
    lookaheadBiasControl: true,
    rejectedParameterSets: 2,
    costStressMultipliers: [1, 2, 3],
    notes: ["Mock run uses adjusted close values and conservative cost stress."],
  },
  trades: [
    {
      id: "trade-1",
      ticker: "MSFT",
      entryAt: "2026-01-05T14:30:00.000Z",
      exitAt: "2026-01-12T20:00:00.000Z",
      entryPrice: 100,
      exitPrice: 110,
      quantity: 10,
      averageDailyDollarVolume: 80_000_000,
    },
    {
      id: "trade-2",
      ticker: "MSFT",
      entryAt: "2026-02-03T14:30:00.000Z",
      exitAt: "2026-02-07T20:00:00.000Z",
      entryPrice: 100,
      exitPrice: 94,
      quantity: 10,
      averageDailyDollarVolume: 60_000_000,
    },
    {
      id: "trade-3",
      ticker: "MSFT",
      entryAt: "2026-03-10T14:30:00.000Z",
      exitAt: "2026-03-20T20:00:00.000Z",
      entryPrice: 50,
      exitPrice: 55,
      quantity: 20,
      averageDailyDollarVolume: 30_000_000,
    },
    {
      id: "trade-4",
      ticker: "MSFT",
      entryAt: "2026-04-02T14:30:00.000Z",
      exitAt: "2026-04-09T20:00:00.000Z",
      entryPrice: 80,
      exitPrice: 84,
      quantity: 12,
      averageDailyDollarVolume: 100_000_000,
    },
  ],
};

const mockPaperTradeRecommendation: Recommendation = {
  id: "rec-MSFT-paper-mock-1",
  ticker: "MSFT",
  thesis: "Mock stock-only paper trade candidate for contract evaluation.",
  instrumentType: "stock",
  strategyFamily: "momentum",
  strategyVersion: "momentum-v0",
  decision: "paper_trade",
  evidenceStatus: "paper_trade_eligible",
  evidenceGate: "verified",
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
    risk: 86,
    confidence: 78,
    liquidity: 86,
  },
  bullCase: "Mock trend evidence and liquidity support a paper-only entry test.",
  bearCase: "Trend may reverse before a paper entry can validate the thesis.",
  downsideScenario: "Shares close below the mock breakout level.",
  invalidationConditions: ["Close below mock breakout level"],
  whySystemMightBeWrong: "Mock data may not represent real market behavior.",
  operatorDecision: {
    actor: "operator",
    decidedBy: "operator:mock",
    decidedAt: "2026-05-28T14:45:00.000Z",
    auditLogId: "audit_mock_rec_1",
    notes: "Mock approval for simulated API contract only.",
  },
  backtestRunId: "bt_mock_momentum_1",
  evidenceReview: {
    resolver: "db_recommendation_evidence_resolver",
    recommendationId: "rec-MSFT-paper-mock-1",
    evidenceGate: "verified",
    evidenceIds: ["bt_mock_momentum_1"],
    reasonCodes: [],
    resolvedAt: "2026-05-28T14:50:00.000Z",
  },
  createdAt: "2026-05-28T14:40:00.000Z",
  updatedAt: "2026-05-28T14:40:00.000Z",
};

const mockPaperTradeRequest: PaperTradeRequest = {
  recommendation: mockPaperTradeRecommendation,
  account: {
    paperEquity: 100_000,
    currentDailyLossPct: 0.1,
    singleNameExposurePct: 2,
    sectorExposurePct: 8,
    correlatedExposurePct: 4,
    aggregateOptionsPremiumPct: 0,
  },
  entry: {
    requestedAt: "2026-05-28T15:00:00.000Z",
    quantity: 10,
    entryPrice: 100,
    stopLossPrice: 95,
    profitTargetPrice: 108,
    maxLoss: 300,
    thesisSnapshot: mockPaperTradeRecommendation.thesis,
    stopRule: "Exit on close below the mock breakout level.",
    targetRule: "Review after a 5% paper gain or thesis invalidation.",
    timeStop: "Exit after 10 trading days if the thesis does not develop.",
  },
  operatorApproval: {
    approvedBy: "operator:mock",
    approvedAt: "2026-05-28T14:58:00.000Z",
    auditLogId: "audit_mock_paper_open_1",
    notes: "Mock paper-only approval.",
  },
};

function mockPaperTradeRequestVariant(
  requestedAt: string,
  approvalAuditLogId: string,
  approvalNotes: string,
): PaperTradeRequest {
  return {
    ...mockPaperTradeRequest,
    entry: {
      ...mockPaperTradeRequest.entry,
      requestedAt,
    },
    operatorApproval: {
      ...mockPaperTradeRequest.operatorApproval,
      auditLogId: approvalAuditLogId,
      notes: approvalNotes,
    },
  };
}

const mockPaperTradeExitRequest: PaperTradeExitRequest = {
  exitedAt: "2026-05-29T12:00:00.000Z",
  exitPrice: 106,
  priceTimestamp: "2026-05-29T12:00:00.000Z",
  exitReason: "Mock profit-target review hit during paper-trade validation.",
  lessonsLearned: "Mock paper trade followed through before the time stop.",
  auditLogId: "audit_mock_paper_close_1",
};

const mockDailyOpportunityCandidates: DailyOpportunityCandidate[] = [
  {
    ...mockScoringInput,
    id: "candidate-MSFT-momentum-daily-1",
    evidenceStatus: "paper_trade_eligible",
    evidenceGate: "verified",
    evidenceIds: ["bt_mock_momentum_1"],
    evidenceReview: {
      resolver: "db_recommendation_evidence_resolver",
      recommendationId: "candidate-MSFT-momentum-daily-1",
      evidenceGate: "verified",
      evidenceIds: ["bt_mock_momentum_1"],
      reasonCodes: [],
      resolvedAt: "2026-05-28T14:50:00.000Z",
    },
    thesis: mockPaperTradeRecommendation.thesis,
    bullCase: mockPaperTradeRecommendation.bullCase,
    bearCase: mockPaperTradeRecommendation.bearCase,
    downsideScenario: mockPaperTradeRecommendation.downsideScenario,
    invalidationConditions: mockPaperTradeRecommendation.invalidationConditions,
    whySystemMightBeWrong: mockPaperTradeRecommendation.whySystemMightBeWrong,
  },
  {
    ...mockScoringInput,
    id: "candidate-AAPL-stale-daily-1",
    ticker: "AAPL",
    evidenceStatus: "research_only",
    evidenceGate: "needs_more_data",
    evidenceIds: [],
    dataFreshness: {
      status: "stale",
      asOf: "2026-05-20T20:00:00.000Z",
      notes: ["Mock daily price history is stale."],
    },
    thesis: "Mock stale-data candidate retained for daily review auditability.",
    bullCase: "Fresh data could later support a watchlist review.",
    bearCase: "Current data is stale and cannot support an operator action.",
    downsideScenario: "Shares reverse while stale data hides current weakness.",
    invalidationConditions: ["Refresh market data before any review"],
    whySystemMightBeWrong: "The stale snapshot may omit new market or company information.",
  },
];

function acceptedPaperTradeOrThrow(result: ReturnType<typeof createPaperTrade>) {
  if (result.status !== "accepted") {
    throw new Error(`Expected mock paper trade to be accepted: ${result.reasonCodes.join(",")}`);
  }
  return result.trade;
}

function closedPaperTradeOrThrow(result: ReturnType<typeof closePaperTrade>) {
  if (result.status !== "accepted") {
    throw new Error(
      `Expected mock paper trade close to be accepted: ${result.reasonCodes.join(",")}`,
    );
  }
  return result.trade;
}

async function countRows(client: LocalClient, tableName: DryRunTableName) {
  const result = await client.execute(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(result.rows[0]?.count ?? 0);
}

function mockPaperTradePrimaryCitation() {
  const citation = mockPaperTradeRecommendation.sourceCitations[0];
  if (citation === undefined) {
    throw new Error("Mock paper-trade recommendation requires a primary citation.");
  }
  return citation;
}

async function seedMockBacktestStrategy(client: LocalClient) {
  await client.batch(
    [
      {
        sql: `INSERT INTO strategy_definitions
          (id, family, name, description, allowed_instrument_types_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          "strategy_mock_momentum",
          mockStockBacktestInput.strategyFamily,
          "Mock momentum stock backtest strategy",
          "Mock strategy definition for stock backtest API read-model dry runs.",
          '["stock"]',
          "2026-05-28T14:40:00.000Z",
        ],
      },
      {
        sql: `INSERT INTO strategy_versions
          (id, strategy_definition_id, version, validation_status, promotion_state,
           required_data_json, risk_policy_version, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          mockStockBacktestInput.strategyVersionId,
          "strategy_mock_momentum",
          "v0",
          "paper_trade_eligible",
          "paper_trade_eligible",
          '["prices","backtests","audit"]',
          "risk-v0",
          "2026-05-28T14:40:00.000Z",
        ],
      },
    ],
    "write",
  );
}

async function seedMockPaperTradeLedgerDependencies(client: LocalClient, paperTradeId: string) {
  const citation = mockPaperTradePrimaryCitation();

  await client.batch(
    [
      {
        sql: `INSERT INTO strategy_definitions
          (id, family, name, description, allowed_instrument_types_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          "strategy_mock_momentum",
          mockPaperTradeRecommendation.strategyFamily,
          "Mock momentum paper-trade strategy",
          "Mock strategy definition for paper-trade API ledger dry runs.",
          '["stock"]',
          mockPaperTradeRecommendation.createdAt,
        ],
      },
      {
        sql: `INSERT INTO strategy_versions
          (id, strategy_definition_id, version, validation_status, promotion_state,
           required_data_json, risk_policy_version, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          mockPaperTradeRecommendation.strategyVersion,
          "strategy_mock_momentum",
          "v0",
          "paper_trade_eligible",
          "paper_trade_eligible",
          '["prices","risk","audit"]',
          "risk-v0",
          mockPaperTradeRecommendation.createdAt,
        ],
      },
      {
        sql: `INSERT INTO audit_logs
          (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id,
           risk_decision, operator_decision, operator_notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          mockPaperTradeRecommendation.operatorDecision.auditLogId,
          "operator_decision",
          "operator",
          mockPaperTradeRecommendation.operatorDecision.decidedBy,
          mockPaperTradeRecommendation.operatorDecision.decidedAt,
          "recommendation",
          mockPaperTradeRecommendation.id,
          "pass",
          "paper_trade",
          mockPaperTradeRecommendation.operatorDecision.notes,
        ],
      },
      {
        sql: `INSERT INTO audit_logs
          (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id,
           risk_decision, operator_decision, operator_notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          mockPaperTradeRequest.operatorApproval.auditLogId,
          "operator_decision",
          "operator",
          mockPaperTradeRequest.operatorApproval.approvedBy,
          mockPaperTradeRequest.operatorApproval.approvedAt,
          "paper_trade",
          paperTradeId,
          "pass",
          "paper_trade",
          mockPaperTradeRequest.operatorApproval.notes,
        ],
      },
      {
        sql: `INSERT INTO audit_logs
          (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id,
           risk_decision, operator_decision, operator_notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          "audit_mock_paper_entry_1",
          "paper_trade_opened",
          "system",
          "paper-trading",
          mockPaperTradeRequest.entry.requestedAt,
          "paper_trade",
          paperTradeId,
          "pass",
          "paper_trade",
          "Mock in-memory ledger dry run.",
        ],
      },
      {
        sql: `INSERT INTO backtest_runs
          (id, strategy_version_id, strategy_family, strategy_version_label, instrument_type,
           universe, period_start, period_end, benchmark_return_pct, promotion_gate,
           reason_codes_json, metrics_json, assumptions_json, source_citations_json,
           freshness_status, freshness_as_of, freshness_notes_json, trade_count, win_rate_pct,
           max_drawdown_pct, net_return_pct, benchmark_relative_return_pct, options_proxy,
           not_recommendation, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          mockPaperTradeRecommendation.backtestRunId ?? "bt_mock_momentum_1",
          mockPaperTradeRecommendation.strategyVersion,
          mockPaperTradeRecommendation.strategyFamily,
          mockPaperTradeRecommendation.strategyVersion,
          "stock",
          "mock-liquid-large-cap",
          "2026-01-02T14:30:00.000Z",
          "2026-05-28T20:00:00.000Z",
          4,
          "ready_for_review",
          "[]",
          JSON.stringify({
            tradeCount: 4,
            winRatePct: 75,
            averageReturnPct: 4.499,
            medianReturnPct: 7.2479,
            maxDrawdownPct: 6.25,
            profitFactor: 3.8793,
            bestTradeReturnPct: 9.75,
            worstTradeReturnPct: -6.25,
            averageHoldingDays: 7.2292,
            grossReturnPct: 4.75,
            netReturnPct: 18.2815,
            benchmarkRelativeReturnPct: 14.2815,
            costSensitivity: [
              {
                multiplier: 1,
                netReturnPct: 18.2815,
                averageReturnPct: 4.499,
                profitFactor: 3.8793,
              },
              {
                multiplier: 2,
                netReturnPct: 17.1444,
                averageReturnPct: 4.2479,
                profitFactor: 3.6141,
              },
              {
                multiplier: 3,
                netReturnPct: 16.0154,
                averageReturnPct: 3.9969,
                profitFactor: 3.3685,
              },
            ],
          }),
          JSON.stringify({
            slippageBps: 5,
            spreadBps: 10,
            feePerTrade: 1,
            minTradesForReview: 4,
            minAverageDailyDollarVolume: 20_000_000,
            pointInTimeData: true,
            survivorshipBiasControl: true,
            lookaheadBiasControl: true,
            rejectedParameterSets: 2,
            costStressMultipliers: [1, 2, 3],
            notes: ["Mock run uses adjusted close values and conservative cost stress."],
          }),
          JSON.stringify(mockPaperTradeRecommendation.sourceCitations),
          "fresh",
          "2026-05-28T20:00:00.000Z",
          "[]",
          4,
          75,
          6.25,
          18.2815,
          14.2815,
          0,
          1,
          mockPaperTradeRecommendation.createdAt,
          mockPaperTradeRecommendation.updatedAt,
        ],
      },
      ...[0, 1, 2, 3].map((index) => ({
        sql: `INSERT INTO backtest_run_trades
          (id, backtest_run_id, source_trade_id, ticker, net_return_pct, gross_return_pct,
           holding_days, exit_order, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `bt_mock_momentum_1_trade_${index + 1}`,
          mockPaperTradeRecommendation.backtestRunId ?? "bt_mock_momentum_1",
          `trade-${index + 1}`,
          mockPaperTradeRecommendation.ticker,
          index === 1 ? -6.25 : 9.75,
          index === 1 ? -6 : 10,
          7.2,
          index,
          mockPaperTradeRecommendation.createdAt,
        ],
      })),
      {
        sql: `INSERT INTO recommendations
          (id, ticker, instrument_type, strategy_version_id, decision, evidence_status, evidence_gate,
           thesis, bull_case, bear_case, downside_scenario, invalidation_conditions_json,
           why_system_might_be_wrong, primary_citation_title, primary_citation_url,
           primary_citation_source, primary_citation_published_at,
           primary_citation_retrieved_at, freshness_status, freshness_as_of,
           freshness_notes_json, risk_score, confidence_score, liquidity_score,
           liquidity_decision, risk_decision, backtest_run_id, operator_audit_log_id,
           created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          mockPaperTradeRecommendation.id,
          mockPaperTradeRecommendation.ticker,
          mockPaperTradeRecommendation.instrumentType,
          mockPaperTradeRecommendation.strategyVersion,
          mockPaperTradeRecommendation.decision,
          mockPaperTradeRecommendation.evidenceStatus,
          mockPaperTradeRecommendation.evidenceGate ?? "verified",
          mockPaperTradeRecommendation.thesis,
          mockPaperTradeRecommendation.bullCase,
          mockPaperTradeRecommendation.bearCase,
          mockPaperTradeRecommendation.downsideScenario,
          JSON.stringify(mockPaperTradeRecommendation.invalidationConditions),
          mockPaperTradeRecommendation.whySystemMightBeWrong,
          citation.title,
          citation.url,
          citation.source,
          citation.publishedAt,
          citation.retrievedAt,
          mockPaperTradeRecommendation.dataFreshness.status,
          mockPaperTradeRecommendation.dataFreshness.asOf,
          JSON.stringify(mockPaperTradeRecommendation.dataFreshness.notes),
          mockPaperTradeRecommendation.scores.risk,
          mockPaperTradeRecommendation.scores.confidence,
          mockPaperTradeRecommendation.scores.liquidity,
          "pass",
          "pass",
          mockPaperTradeRecommendation.backtestRunId ?? null,
          mockPaperTradeRecommendation.operatorDecision.auditLogId,
          mockPaperTradeRecommendation.createdAt,
          mockPaperTradeRecommendation.updatedAt,
        ],
      },
    ],
    "write",
  );
}

async function seedMockPaperTradeCloseAuditLog(client: LocalClient, paperTradeId: string) {
  await client.execute({
    sql: `INSERT INTO audit_logs
      (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id,
       risk_decision, operator_decision, operator_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      mockPaperTradeExitRequest.auditLogId,
      "paper_trade_closed",
      "system",
      "paper-trading",
      mockPaperTradeExitRequest.exitedAt,
      "paper_trade",
      paperTradeId,
      "pass",
      "paper_trade",
      mockPaperTradeExitRequest.exitReason,
    ],
  });
}

async function seedMockEvidenceCandidateRecommendation(
  client: LocalClient,
  paperTradeEvidenceId: string,
) {
  const citation = mockPaperTradePrimaryCitation();
  const candidateRecommendationId = "rec-MSFT-paper-candidate-1";
  const candidateAuditLogId = "audit_mock_candidate_rec_1";

  await client.batch(
    [
      {
        sql: `INSERT INTO audit_logs
          (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id,
           risk_decision, operator_decision, operator_notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          candidateAuditLogId,
          "operator_decision",
          "operator",
          "operator:mock",
          "2026-05-29T12:10:00.000Z",
          "recommendation",
          candidateRecommendationId,
          "pass",
          "paper_trade",
          "Mock candidate recommendation references durable paper-trade evidence.",
        ],
      },
      {
        sql: `INSERT INTO recommendations
          (id, ticker, instrument_type, strategy_version_id, decision, evidence_status, evidence_gate,
           thesis, bull_case, bear_case, downside_scenario, invalidation_conditions_json,
           why_system_might_be_wrong, primary_citation_title, primary_citation_url,
           primary_citation_source, primary_citation_published_at,
           primary_citation_retrieved_at, freshness_status, freshness_as_of,
           freshness_notes_json, risk_score, confidence_score, liquidity_score,
           liquidity_decision, risk_decision, paper_trade_evidence_id,
           operator_audit_log_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          candidateRecommendationId,
          mockPaperTradeRecommendation.ticker,
          mockPaperTradeRecommendation.instrumentType,
          mockPaperTradeRecommendation.strategyVersion,
          "paper_trade",
          "paper_trade_eligible",
          "verified",
          mockPaperTradeRecommendation.thesis,
          mockPaperTradeRecommendation.bullCase,
          mockPaperTradeRecommendation.bearCase,
          mockPaperTradeRecommendation.downsideScenario,
          JSON.stringify(mockPaperTradeRecommendation.invalidationConditions),
          mockPaperTradeRecommendation.whySystemMightBeWrong,
          citation.title,
          citation.url,
          citation.source,
          citation.publishedAt,
          citation.retrievedAt,
          mockPaperTradeRecommendation.dataFreshness.status,
          mockPaperTradeRecommendation.dataFreshness.asOf,
          JSON.stringify(mockPaperTradeRecommendation.dataFreshness.notes),
          mockPaperTradeRecommendation.scores.risk,
          mockPaperTradeRecommendation.scores.confidence,
          mockPaperTradeRecommendation.scores.liquidity,
          "pass",
          "pass",
          paperTradeEvidenceId,
          candidateAuditLogId,
          "2026-05-29T12:10:00.000Z",
          "2026-05-29T12:10:00.000Z",
        ],
      },
      {
        sql: `INSERT INTO recommendation_citations
          (id, recommendation_id, title, url, source, published_at, retrieved_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          "citation_mock_candidate_audit_1",
          candidateRecommendationId,
          "Mock paper-trade audit trail",
          "https://example.test/mock/msft/paper-trade-audit",
          "mock-audit-source",
          "2026-05-29T12:00:00.000Z",
          "2026-05-29T12:10:00.000Z",
        ],
      },
    ],
    "write",
  );

  return candidateRecommendationId;
}

export function buildServer(env: ApiEnv) {
  const server = fastify({
    logger: env.APP_ENV !== "test",
  });

  server.addHook("onRequest", (request, reply, done) => {
    applyLocalWebCors(request.headers.origin, reply);
    if (request.method === "OPTIONS") {
      reply.code(204).send();
      return;
    }
    done();
  });

  server.get("/health", async () => ({
    service: "stockmarket-api",
    status: "ok",
    appEnv: env.APP_ENV,
    liveTradingEnabled: env.LIVE_TRADING_ENABLED,
    timestamp: new Date().toISOString(),
  }));

  server.get("/providers/selection", async () => {
    const candidates = evaluateProviderCandidates(providerSelectionCandidates);

    return {
      mode: "policy",
      requiresEnv: false,
      liveTradingEnabled: env.LIVE_TRADING_ENABLED,
      providerKeysRequiredNow: [],
      useNow: candidates
        .filter((candidate) => candidate.decision === "use_now")
        .map((candidate) => candidate.id),
      evaluateFirst: candidates
        .filter((candidate) => candidate.decision === "evaluate_first")
        .map((candidate) => candidate.id),
      deferred: candidates
        .filter((candidate) => candidate.decision === "defer")
        .map((candidate) => candidate.id),
      candidates,
    };
  });

  server.get("/scoring/mock-evaluation", async () => ({
    mode: "mock",
    requiresEnv: false,
    liveTradingEnabled: env.LIVE_TRADING_ENABLED,
    providerKeysRequired: [],
    notRecommendation: true,
    result: scoreOpportunity(mockScoringInput),
  }));

  server.post("/opportunities/mock-daily-dry-run", async () => ({
    mode: "mock",
    requiresEnv: false,
    liveTradingEnabled: env.LIVE_TRADING_ENABLED,
    providerKeysRequired: [],
    notRecommendation: true,
    report: generateDailyOpportunityReport({
      id: "daily_mock_20260528",
      generatedAt: "2026-05-28T15:05:00.000Z",
      candidates: mockDailyOpportunityCandidates,
    }),
  }));

  server.get("/strategies/policies", async () => ({
    mode: "policy",
    requiresEnv: false,
    liveTradingEnabled: env.LIVE_TRADING_ENABLED,
    providerKeysRequired: [],
    paperTradeFirst: true,
    policies: listStrategyPolicies(),
  }));

  server.post("/backtesting/mock-read-model-dry-run", async () => {
    const client = await createLocalClient();
    const result = evaluateStockBacktest(mockStockBacktestInput);

    try {
      await runMigrations(client);
      await seedMockBacktestStrategy(client);
      await persistStockBacktestRun(
        client,
        mockStockBacktestInput,
        result,
        "2026-05-29T18:00:00.000Z",
      );

      return {
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: env.LIVE_TRADING_ENABLED,
        providerKeysRequired: [],
        notRecommendation: true,
        persistence: {
          scope: "in_memory",
          durable: false,
          note: "Dry-run stock backtest read-model data is discarded after the response.",
        },
        persistedInMemory: {
          backtestRuns: await countRows(client, "backtest_runs"),
          backtestRunTrades: await countRows(client, "backtest_run_trades"),
        },
        runs: await listPersistedStockBacktestRuns(client, {
          strategyVersionId: mockStockBacktestInput.strategyVersionId,
          limit: 5,
        }),
      };
    } finally {
      client.close();
    }
  });

  server.get("/paper-trading/mock-decision", async () => ({
    mode: "mock",
    requiresEnv: false,
    liveTradingEnabled: env.LIVE_TRADING_ENABLED,
    providerKeysRequired: [],
    notRecommendation: true,
    persistence: {
      scope: "in_memory",
      durable: false,
      note: "Mock paper-trade decisions are contract evaluations and are not persisted.",
    },
    result: createPaperTrade(mockPaperTradeRequest),
  }));

  server.post("/paper-trading/mock-ledger-dry-run", async () => {
    const client = await createLocalClient();
    const result = createPaperTrade(mockPaperTradeRequest);

    try {
      await runMigrations(client);

      if (result.status === "accepted" && result.trade.instrumentType === "stock") {
        await seedMockPaperTradeLedgerDependencies(client, result.trade.id);
        await persistPaperTrade(client, {
          id: result.trade.id,
          recommendationId: result.trade.recommendationId,
          accountId: "paper_account_mock",
          ticker: result.trade.ticker,
          instrumentType: result.trade.instrumentType,
          strategyVersionId: result.trade.strategyVersion,
          operatorApprovalAuditLogId: result.trade.audit.auditLogId,
          entryAuditLogId: "audit_mock_paper_entry_1",
          thesisSnapshot: result.trade.thesisSnapshot,
          entryReason: "Mock API ledger dry-run accepted a simulated stock paper entry.",
          downsideScenario: mockPaperTradeRecommendation.downsideScenario,
          invalidationConditions: mockPaperTradeRecommendation.invalidationConditions,
          entryType: "market",
          requestedEntryPrice: mockPaperTradeRequest.entry.entryPrice,
          simulatedEntryPrice: result.trade.entryPrice,
          quantity: result.trade.quantity,
          enteredAt: result.trade.openedAt,
          stopLoss: result.trade.stopLossPrice,
          profitTarget: result.trade.profitTargetPrice,
          timeStopAt: "2026-06-11T20:00:00.000Z",
          maxLossAmount: result.trade.risk.maxLoss,
          accountEquityAtEntry: result.trade.risk.accountEquityAtOpen,
          singleNameExposurePct: result.trade.risk.singleNameExposurePct,
          sectorExposurePct: result.trade.risk.sectorExposurePct,
          correlatedExposurePct: result.trade.risk.correlatedExposurePct,
          dailyLossPctAtEntry: result.trade.risk.currentDailyLossPct,
          createdAt: result.trade.openedAt,
          updatedAt: result.trade.openedAt,
        });
      }

      const ledgerResult = await client.execute({
        sql: `SELECT mode, ticker, live_trading_enabled, broker_execution, risk_pct_of_equity
          FROM paper_trades
          LIMIT 1`,
        args: [],
      });
      const ledgerRow = ledgerResult.rows[0];

      return {
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: env.LIVE_TRADING_ENABLED,
        providerKeysRequired: [],
        notRecommendation: true,
        persistence: {
          scope: "in_memory",
          durable: false,
          note: "Dry-run paper-trade ledger data is discarded after the response.",
        },
        result,
        persistedInMemory: {
          recommendations: await countRows(client, "recommendations"),
          auditLogs: await countRows(client, "audit_logs"),
          paperTrades: await countRows(client, "paper_trades"),
        },
        ledger:
          ledgerRow === undefined
            ? null
            : {
                mode: ledgerRow.mode,
                liveTradingEnabled: ledgerRow.live_trading_enabled === 1,
                brokerExecution: ledgerRow.broker_execution === 1,
                ticker: ledgerRow.ticker,
                riskPctOfEquity: Number(ledgerRow.risk_pct_of_equity),
              },
      };
    } finally {
      client.close();
    }
  });

  server.post("/paper-trading/mock-close-dry-run", async () => {
    const client = await createLocalClient();
    const openResult = createPaperTrade(mockPaperTradeRequest);

    try {
      await runMigrations(client);

      if (openResult.status !== "accepted" || openResult.trade.instrumentType !== "stock") {
        return {
          mode: "mock",
          requiresEnv: false,
          liveTradingEnabled: env.LIVE_TRADING_ENABLED,
          providerKeysRequired: [],
          notRecommendation: true,
          persistence: {
            scope: "in_memory",
            durable: false,
            note: "Dry-run paper-trade close data is discarded after the response.",
          },
          openResult,
          closeResult: null,
          persistedInMemory: {
            recommendations: await countRows(client, "recommendations"),
            auditLogs: await countRows(client, "audit_logs"),
            paperTrades: await countRows(client, "paper_trades"),
          },
          ledger: null,
        };
      }

      await seedMockPaperTradeLedgerDependencies(client, openResult.trade.id);
      await persistPaperTrade(client, {
        id: openResult.trade.id,
        recommendationId: openResult.trade.recommendationId,
        accountId: "paper_account_mock",
        ticker: openResult.trade.ticker,
        instrumentType: openResult.trade.instrumentType,
        strategyVersionId: openResult.trade.strategyVersion,
        operatorApprovalAuditLogId: openResult.trade.audit.auditLogId,
        entryAuditLogId: "audit_mock_paper_entry_1",
        thesisSnapshot: openResult.trade.thesisSnapshot,
        entryReason: "Mock API close dry-run accepted a simulated stock paper entry.",
        downsideScenario: mockPaperTradeRecommendation.downsideScenario,
        invalidationConditions: mockPaperTradeRecommendation.invalidationConditions,
        entryType: "market",
        requestedEntryPrice: mockPaperTradeRequest.entry.entryPrice,
        simulatedEntryPrice: openResult.trade.entryPrice,
        quantity: openResult.trade.quantity,
        enteredAt: openResult.trade.openedAt,
        stopLoss: openResult.trade.stopLossPrice,
        profitTarget: openResult.trade.profitTargetPrice,
        timeStopAt: "2026-06-11T20:00:00.000Z",
        maxLossAmount: openResult.trade.risk.maxLoss,
        accountEquityAtEntry: openResult.trade.risk.accountEquityAtOpen,
        singleNameExposurePct: openResult.trade.risk.singleNameExposurePct,
        sectorExposurePct: openResult.trade.risk.sectorExposurePct,
        correlatedExposurePct: openResult.trade.risk.correlatedExposurePct,
        dailyLossPctAtEntry: openResult.trade.risk.currentDailyLossPct,
        createdAt: openResult.trade.openedAt,
        updatedAt: openResult.trade.openedAt,
      });

      const closeResult = closePaperTrade(openResult.trade, mockPaperTradeExitRequest);
      if (closeResult.status === "accepted") {
        await seedMockPaperTradeCloseAuditLog(client, closeResult.trade.id);
        await closePersistedPaperTrade(client, {
          id: closeResult.trade.id,
          closeAuditLogId: closeResult.trade.exitAudit.auditLogId,
          closedAt: closeResult.trade.closedAt,
          exitPrice: closeResult.trade.exitPrice,
          exitReason: closeResult.trade.exitReason,
          lessonsLearned: closeResult.trade.lessons[closeResult.trade.lessons.length - 1] ?? "",
          updatedAt: closeResult.trade.closedAt,
        });
      }

      const ledgerResult = await client.execute({
        sql: `SELECT status, exit_audit_log_id, exit_price, exit_reason, lessons_learned
          FROM paper_trades
          LIMIT 1`,
        args: [],
      });
      const ledgerRow = ledgerResult.rows[0];

      return {
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: env.LIVE_TRADING_ENABLED,
        providerKeysRequired: [],
        notRecommendation: true,
        persistence: {
          scope: "in_memory",
          durable: false,
          note: "Dry-run paper-trade close data is discarded after the response.",
        },
        openResult,
        closeResult,
        persistedInMemory: {
          recommendations: await countRows(client, "recommendations"),
          auditLogs: await countRows(client, "audit_logs"),
          paperTrades: await countRows(client, "paper_trades"),
        },
        ledger:
          ledgerRow === undefined
            ? null
            : {
                status: ledgerRow.status,
                exitAuditLogId: ledgerRow.exit_audit_log_id,
                exitPrice: Number(ledgerRow.exit_price),
                exitReason: ledgerRow.exit_reason,
                lessonsLearned: ledgerRow.lessons_learned,
              },
      };
    } finally {
      client.close();
    }
  });

  server.post("/paper-trading/mock-read-model-dry-run", async () => {
    const client = await createLocalClient();
    const openResult = createPaperTrade(mockPaperTradeRequest);

    try {
      await runMigrations(client);

      if (openResult.status === "accepted" && openResult.trade.instrumentType === "stock") {
        await seedMockPaperTradeLedgerDependencies(client, openResult.trade.id);
        await persistPaperTrade(client, {
          id: openResult.trade.id,
          recommendationId: openResult.trade.recommendationId,
          accountId: "paper_account_mock",
          ticker: openResult.trade.ticker,
          instrumentType: openResult.trade.instrumentType,
          strategyVersionId: openResult.trade.strategyVersion,
          operatorApprovalAuditLogId: openResult.trade.audit.auditLogId,
          entryAuditLogId: "audit_mock_paper_entry_1",
          thesisSnapshot: openResult.trade.thesisSnapshot,
          entryReason: "Mock API read-model dry-run accepted a simulated stock paper entry.",
          downsideScenario: mockPaperTradeRecommendation.downsideScenario,
          invalidationConditions: mockPaperTradeRecommendation.invalidationConditions,
          entryType: "market",
          requestedEntryPrice: mockPaperTradeRequest.entry.entryPrice,
          simulatedEntryPrice: openResult.trade.entryPrice,
          quantity: openResult.trade.quantity,
          enteredAt: openResult.trade.openedAt,
          stopLoss: openResult.trade.stopLossPrice,
          profitTarget: openResult.trade.profitTargetPrice,
          timeStopAt: "2026-06-11T20:00:00.000Z",
          maxLossAmount: openResult.trade.risk.maxLoss,
          accountEquityAtEntry: openResult.trade.risk.accountEquityAtOpen,
          singleNameExposurePct: openResult.trade.risk.singleNameExposurePct,
          sectorExposurePct: openResult.trade.risk.sectorExposurePct,
          correlatedExposurePct: openResult.trade.risk.correlatedExposurePct,
          dailyLossPctAtEntry: openResult.trade.risk.currentDailyLossPct,
          createdAt: openResult.trade.openedAt,
          updatedAt: openResult.trade.openedAt,
        });

        const closeResult = closePaperTrade(openResult.trade, mockPaperTradeExitRequest);
        if (closeResult.status === "accepted") {
          await seedMockPaperTradeCloseAuditLog(client, closeResult.trade.id);
          await closePersistedPaperTrade(client, {
            id: closeResult.trade.id,
            closeAuditLogId: closeResult.trade.exitAudit.auditLogId,
            closedAt: closeResult.trade.closedAt,
            exitPrice: closeResult.trade.exitPrice,
            exitReason: closeResult.trade.exitReason,
            lessonsLearned: closeResult.trade.lessons[closeResult.trade.lessons.length - 1] ?? "",
            updatedAt: closeResult.trade.closedAt,
          });
        }
      }

      return {
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: env.LIVE_TRADING_ENABLED,
        providerKeysRequired: [],
        notRecommendation: true,
        persistence: {
          scope: "in_memory",
          durable: false,
          note: "Dry-run paper-trade read model data is discarded after the response.",
        },
        persistedInMemory: {
          recommendations: await countRows(client, "recommendations"),
          auditLogs: await countRows(client, "audit_logs"),
          paperTrades: await countRows(client, "paper_trades"),
        },
        trades: await listPersistedPaperTrades(client, {
          accountId: "paper_account_mock",
          limit: 10,
        }),
      };
    } finally {
      client.close();
    }
  });

  server.get("/paper-trading/mock-evidence-detail-dry-run", async () => {
    const client = await createLocalClient();
    const openResult = createPaperTrade(mockPaperTradeRequest);

    try {
      await runMigrations(client);

      if (openResult.status !== "accepted" || openResult.trade.instrumentType !== "stock") {
        throw new Error("Mock evidence-detail dry run requires an accepted stock paper trade.");
      }

      await seedMockPaperTradeLedgerDependencies(client, openResult.trade.id);
      await persistPaperTrade(client, {
        id: openResult.trade.id,
        recommendationId: openResult.trade.recommendationId,
        accountId: "paper_account_mock",
        ticker: openResult.trade.ticker,
        instrumentType: openResult.trade.instrumentType,
        strategyVersionId: openResult.trade.strategyVersion,
        operatorApprovalAuditLogId: openResult.trade.audit.auditLogId,
        entryAuditLogId: "audit_mock_paper_entry_1",
        thesisSnapshot: openResult.trade.thesisSnapshot,
        entryReason: "Mock API evidence-detail dry run accepted a simulated stock paper entry.",
        downsideScenario: mockPaperTradeRecommendation.downsideScenario,
        invalidationConditions: mockPaperTradeRecommendation.invalidationConditions,
        entryType: "market",
        requestedEntryPrice: mockPaperTradeRequest.entry.entryPrice,
        simulatedEntryPrice: openResult.trade.entryPrice,
        quantity: openResult.trade.quantity,
        enteredAt: openResult.trade.openedAt,
        stopLoss: openResult.trade.stopLossPrice,
        profitTarget: openResult.trade.profitTargetPrice,
        timeStopAt: "2026-06-11T20:00:00.000Z",
        maxLossAmount: openResult.trade.risk.maxLoss,
        accountEquityAtEntry: openResult.trade.risk.accountEquityAtOpen,
        singleNameExposurePct: openResult.trade.risk.singleNameExposurePct,
        sectorExposurePct: openResult.trade.risk.sectorExposurePct,
        correlatedExposurePct: openResult.trade.risk.correlatedExposurePct,
        dailyLossPctAtEntry: openResult.trade.risk.currentDailyLossPct,
        createdAt: openResult.trade.openedAt,
        updatedAt: openResult.trade.openedAt,
      });

      const closeResult = closePaperTrade(openResult.trade, mockPaperTradeExitRequest);
      if (closeResult.status !== "accepted") {
        throw new Error("Mock evidence-detail dry run requires an accepted paper-trade close.");
      }

      await seedMockPaperTradeCloseAuditLog(client, closeResult.trade.id);
      await closePersistedPaperTrade(client, {
        id: closeResult.trade.id,
        closeAuditLogId: closeResult.trade.exitAudit.auditLogId,
        closedAt: closeResult.trade.closedAt,
        exitPrice: closeResult.trade.exitPrice,
        exitReason: closeResult.trade.exitReason,
        lessonsLearned: closeResult.trade.lessons[closeResult.trade.lessons.length - 1] ?? "",
        updatedAt: closeResult.trade.closedAt,
      });

      const candidateRecommendationId = await seedMockEvidenceCandidateRecommendation(
        client,
        openResult.trade.id,
      );

      return {
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: env.LIVE_TRADING_ENABLED,
        providerKeysRequired: [],
        notRecommendation: true,
        persistence: {
          scope: "in_memory",
          durable: false,
          note: "Dry-run evidence detail data is discarded after the response.",
        },
        persistedInMemory: {
          recommendations: await countRows(client, "recommendations"),
          auditLogs: await countRows(client, "audit_logs"),
          paperTrades: await countRows(client, "paper_trades"),
        },
        evidenceDetail: await getRecommendationEvidenceDetail(client, candidateRecommendationId),
      };
    } finally {
      client.close();
    }
  });

  server.get("/paper-trading/mock-evidence-summary", async () => {
    const openTrade = acceptedPaperTradeOrThrow(
      createPaperTrade(
        mockPaperTradeRequestVariant(
          "2026-05-29T12:00:00.000Z",
          "audit_mock_paper_open_pending_1",
          "Mock open paper trade for evidence summary counts.",
        ),
      ),
    );
    const winner = closedPaperTradeOrThrow(
      closePaperTrade(acceptedPaperTradeOrThrow(createPaperTrade(mockPaperTradeRequest)), {
        ...mockPaperTradeExitRequest,
        auditLogId: "audit_mock_paper_close_1",
      }),
    );
    const loser = closedPaperTradeOrThrow(
      closePaperTrade(
        acceptedPaperTradeOrThrow(
          createPaperTrade(
            mockPaperTradeRequestVariant(
              "2026-05-29T10:00:00.000Z",
              "audit_mock_paper_open_loss_1",
              "Mock losing paper trade for evidence summary counts.",
            ),
          ),
        ),
        {
          ...mockPaperTradeExitRequest,
          exitPrice: 95,
          exitReason: "Mock stop review hit during paper-trade validation.",
          lessonsLearned: "Mock loser respected the stop before thesis damage grew.",
          auditLogId: "audit_mock_paper_close_loss_1",
        },
      ),
    );

    return {
      mode: "mock",
      requiresEnv: false,
      liveTradingEnabled: env.LIVE_TRADING_ENABLED,
      providerKeysRequired: [],
      notRecommendation: true,
      persistence: {
        scope: "in_memory",
        durable: false,
        note: "Mock paper-trade evidence summary data is generated in memory.",
      },
      summary: summarizePaperTradeEvidence([openTrade, winner, loser]),
    };
  });

  server.post("/ingestion/mock-dry-run", async () => {
    const clock: IngestionClock = {
      now: () => "2026-05-28T14:30:00.000Z",
    };
    const client = await createLocalClient();

    try {
      await runMigrations(client);
      await persistIngestionBatch(
        client,
        await ingestPriceBars(
          createMockMarketDataProvider(),
          { symbol: "MSFT", from: "2026-05-01", to: "2026-05-02", interval: "1d" },
          clock,
        ),
      );
      await persistIngestionBatch(
        client,
        await ingestNewsArticles(createMockNewsProvider(), { symbols: ["MSFT"] }, clock),
      );
      await persistIngestionBatch(
        client,
        await ingestEarningsEvents(createMockEarningsProvider(), { symbols: ["MSFT"] }, clock),
      );
      await persistIngestionBatch(
        client,
        await ingestOptionQuotes(
          createMockOptionsProvider(),
          { underlyingSymbol: "MSFT", expiration: "2026-06-19" },
          clock,
        ),
      );

      return {
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: env.LIVE_TRADING_ENABLED,
        providerKeysRequired: [],
        persistence: {
          scope: "in_memory",
          durable: false,
          note: "Dry-run data is discarded after the response.",
        },
        persistedInMemory: {
          ingestionRuns: await countRows(client, "ingestion_runs"),
          providerRecords: await countRows(client, "provider_records"),
          priceBars: await countRows(client, "price_bars"),
          newsArticles: await countRows(client, "news_articles"),
          earningsEvents: await countRows(client, "earnings_events"),
          optionQuotes: await countRows(client, "option_quotes"),
          dataQualityEvents: await countRows(client, "data_quality_events"),
        },
      };
    } finally {
      client.close();
    }
  });

  return server;
}
