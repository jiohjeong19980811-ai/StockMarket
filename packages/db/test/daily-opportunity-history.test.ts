import type { Client } from "@libsql/client";
import { evaluateStockBacktest, type StockBacktestInput } from "@stockmarket/backtesting";
import {
  generateDailyOpportunityReport,
  type DailyOpportunityCandidate,
} from "@stockmarket/scoring";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createLocalClient,
  listPersistedDailyOpportunityReports,
  persistDailyOpportunityReport,
  persistStockBacktestRun,
  runMigrations,
} from "../src/index.js";

const now = "2026-05-29T18:00:00.000Z";

let client: Client;

async function execute(sql: string, args: unknown[] = []) {
  return client.execute({ sql, args });
}

async function seedStrategy() {
  await execute(
    `INSERT INTO strategy_definitions
      (id, family, name, description, allowed_instrument_types_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    [
      "strategy_momentum",
      "momentum",
      "Momentum",
      "Liquid stock momentum research.",
      '["stock"]',
      now,
    ],
  );
  await execute(
    `INSERT INTO strategy_versions
      (id, strategy_definition_id, version, validation_status, promotion_state,
       required_data_json, risk_policy_version, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "momentum-v0",
      "strategy_momentum",
      "v0",
      "paper_trade_eligible",
      "paper_trade_eligible",
      '["prices","backtests","audit"]',
      "risk-v0",
      now,
    ],
  );
}

const backtestInput: StockBacktestInput = {
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

const baseCandidate: DailyOpportunityCandidate = {
  id: "candidate-MSFT-momentum-daily-1",
  ticker: "MSFT",
  instrumentType: "stock",
  strategyFamily: "momentum",
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
    {
      title: "Mock analyst context",
      url: "https://example.test/mock/msft/context",
      source: "mock-provider",
      publishedAt: "2026-05-28T13:00:00.000Z",
      retrievedAt: "2026-05-28T14:30:00.000Z",
    },
  ],
  componentSignals: [
    {
      component: "momentum",
      score: 80,
      weight: 0.5,
      explanation: "Mock trend strength is positive.",
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
  thesis: "Mock stock-only paper trade candidate for contract evaluation.",
  bullCase: "Mock trend evidence and liquidity support a paper-only entry test.",
  bearCase: "Trend may reverse before a paper entry can validate the thesis.",
  downsideScenario: "Shares close below the mock breakout level.",
  invalidationConditions: ["Close below mock breakout level"],
  whySystemMightBeWrong: "Mock data may not represent real market behavior.",
};

describe("daily opportunity history", () => {
  beforeEach(async () => {
    client = await createLocalClient();
    await runMigrations(client);
    await seedStrategy();
    await persistStockBacktestRun(client, backtestInput, evaluateStockBacktest(backtestInput), now);
  });

  afterEach(() => {
    client.close();
  });

  it("persists ranked daily opportunities as historical recommendation rows", async () => {
    const report = generateDailyOpportunityReport({
      id: "daily_mock_20260528",
      generatedAt: "2026-05-28T15:05:00.000Z",
      candidates: [baseCandidate],
    });

    await persistDailyOpportunityReport(client, report, {
      persistedAt: now,
      strategyVersionIds: {
        momentum: "momentum-v0",
      },
    });

    const reports = await listPersistedDailyOpportunityReports(client, { limit: 5 });

    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      id: "daily_mock_20260528",
      outcome: "ranked_opportunities",
      notRecommendation: true,
      liveTradingEnabled: false,
      providerKeysRequired: [],
      reviewedCount: 1,
      opportunityCount: 1,
      noGoodTrades: null,
    });
    expect(reports[0]?.recommendations).toHaveLength(1);
    expect(reports[0]?.recommendations[0]).toMatchObject({
      id: "candidate-MSFT-momentum-daily-1",
      reportRank: 1,
      ticker: "MSFT",
      decision: "paper_trade",
      instrumentType: "stock",
      strategyVersionId: "momentum-v0",
      evidenceGate: "verified",
      scores: {
        risk: 100,
        liquidity: 86,
      },
      evidenceIds: {
        backtestRunId: "bt_mock_momentum_1",
        paperTradeEvidenceId: null,
      },
      dataFreshness: {
        status: "fresh",
        asOf: "2026-05-28T14:30:00.000Z",
      },
    });
    expect(reports[0]?.recommendations[0]?.sourceCitations).toEqual([
      {
        title: "Mock daily price history",
        url: "https://example.test/mock/msft/prices",
        source: "mock-provider",
        publishedAt: "2026-05-28T14:00:00.000Z",
        retrievedAt: "2026-05-28T14:30:00.000Z",
      },
      {
        title: "Mock analyst context",
        url: "https://example.test/mock/msft/context",
        source: "mock-provider",
        publishedAt: "2026-05-28T13:00:00.000Z",
        retrievedAt: "2026-05-28T14:30:00.000Z",
      },
    ]);
    expect("brokerExecution" in (reports[0]?.recommendations[0] ?? {})).toBe(false);
    expect("liveTradingEnabled" in (reports[0]?.recommendations[0] ?? {})).toBe(false);
  });

  it("persists no-good-trades reports without recommendation rows", async () => {
    const report = generateDailyOpportunityReport({
      id: "daily_mock_no_good",
      generatedAt: "2026-05-28T15:05:00.000Z",
      candidates: [
        {
          ...baseCandidate,
          id: "candidate-MSFT-stale-daily-1",
          evidenceStatus: "research_only",
          evidenceGate: "needs_more_data",
          evidenceIds: [],
          evidenceReview: undefined,
          dataFreshness: {
            status: "stale",
            asOf: "2026-05-20T20:00:00.000Z",
            notes: ["Mock daily price history is stale."],
          },
        },
      ],
    });

    await persistDailyOpportunityReport(client, report, {
      persistedAt: now,
      strategyVersionIds: {
        momentum: "momentum-v0",
      },
    });

    const reports = await listPersistedDailyOpportunityReports(client);

    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      id: "daily_mock_no_good",
      outcome: "no_good_trades",
      opportunityCount: 0,
      reviewedCount: 1,
      recommendations: [],
      noGoodTrades: {
        message: "No good trades today.",
        reasonCodes: ["fresh_data", "paper_trade_evidence"],
      },
    });
  });
});
