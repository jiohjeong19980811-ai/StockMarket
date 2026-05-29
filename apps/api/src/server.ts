import fastify from "fastify";
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
import { createLocalClient, persistIngestionBatch, runMigrations } from "@stockmarket/db";
import { createPaperTrade, type PaperTradeRequest } from "@stockmarket/paper-trading";
import { listStrategyPolicies, scoreOpportunity, type ScoringInput } from "@stockmarket/scoring";
import type { Recommendation } from "@stockmarket/core";
import type { ApiEnv } from "./env.js";

type DryRunTableName =
  | "ingestion_runs"
  | "provider_records"
  | "price_bars"
  | "news_articles"
  | "earnings_events"
  | "option_quotes"
  | "data_quality_events";

const mockScoringInput: ScoringInput = {
  id: "mock-score-MSFT-momentum-watchlist",
  ticker: "MSFT",
  instrumentType: "stock",
  strategyFamily: "momentum",
  evidenceStatus: "research_only",
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

const mockPaperTradeRecommendation: Recommendation = {
  id: "rec-MSFT-paper-mock-1",
  ticker: "MSFT",
  thesis: "Mock stock-only paper trade candidate for contract evaluation.",
  instrumentType: "stock",
  strategyFamily: "momentum",
  strategyVersion: "momentum-v0",
  decision: "paper_trade",
  evidenceStatus: "paper_trade_eligible",
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

async function countRows(
  client: Awaited<ReturnType<typeof createLocalClient>>,
  tableName: DryRunTableName,
) {
  const result = await client.execute(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(result.rows[0]?.count ?? 0);
}

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

  server.get("/strategies/policies", async () => ({
    mode: "policy",
    requiresEnv: false,
    liveTradingEnabled: env.LIVE_TRADING_ENABLED,
    providerKeysRequired: [],
    paperTradeFirst: true,
    policies: listStrategyPolicies(),
  }));

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
