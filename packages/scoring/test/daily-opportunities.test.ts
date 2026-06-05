import { describe, expect, it } from "vitest";

import { generateDailyOpportunityReport, type DailyOpportunityCandidate } from "../src/index.js";

const baseCandidate: DailyOpportunityCandidate = {
  id: "candidate-MSFT-momentum-1",
  ticker: "MSFT",
  instrumentType: "stock",
  strategyFamily: "momentum",
  evidenceStatus: "paper_trade_eligible",
  evidenceGate: "verified",
  evidenceIds: ["bt_mock_momentum_1"],
  evidenceReview: {
    resolver: "db_recommendation_evidence_resolver",
    recommendationId: "candidate-MSFT-momentum-1",
    evidenceGate: "verified",
    evidenceIds: ["bt_mock_momentum_1"],
    reasonCodes: [],
    resolvedAt: "2026-06-05T13:00:00.000Z",
  },
  dataFreshness: {
    status: "fresh",
    asOf: "2026-06-05T12:55:00.000Z",
    notes: [],
  },
  sourceCitations: [
    {
      title: "Mock daily price history",
      url: "https://example.test/mock/msft/prices",
      source: "mock-provider",
      publishedAt: "2026-06-05T12:45:00.000Z",
      retrievedAt: "2026-06-05T12:55:00.000Z",
    },
  ],
  componentSignals: [
    {
      component: "momentum",
      score: 84,
      weight: 0.5,
      explanation: "Mock relative strength remains above the large-cap universe median.",
    },
    {
      component: "liquidity",
      score: 90,
      weight: 0.3,
      explanation: "Mock dollar volume clears the stock liquidity floor.",
    },
    {
      component: "risk",
      score: 82,
      weight: 0.2,
      explanation: "Paper exposure remains inside the conservative MVP limits.",
    },
  ],
  liquidity: {
    score: 90,
    averageDailyDollarVolume: 80_000_000,
    spreadPercentOfMid: 0.02,
    passes: true,
  },
  paperExposure: {
    proposedPositionRiskPct: 0.35,
    singleNameExposurePct: 3,
    sectorExposurePct: 10,
    correlatedExposurePct: 7,
    dailyLossPct: 0.4,
    aggregateOptionsPremiumPct: 0,
  },
  thesis: "Mock momentum candidate with verified stock backtest evidence.",
  bullCase: "Trend and liquidity support a paper-only review candidate.",
  bearCase: "Momentum may reverse if the market weakens.",
  downsideScenario: "Shares close below the mock breakout level.",
  invalidationConditions: ["Close below mock breakout level"],
  whySystemMightBeWrong: "Mock data may not represent current market behavior.",
};

function candidateWith(overrides: Partial<DailyOpportunityCandidate>): DailyOpportunityCandidate {
  return {
    ...baseCandidate,
    ...overrides,
  };
}

describe("daily opportunity generation", () => {
  it("ranks research opportunities with safety, freshness, citations, and final decisions", () => {
    const report = generateDailyOpportunityReport({
      id: "daily-2026-06-05",
      generatedAt: "2026-06-05T13:05:00.000Z",
      candidates: [
        candidateWith({
          id: "candidate-AAPL-stale-1",
          ticker: "AAPL",
          evidenceStatus: "research_only",
          evidenceGate: "needs_more_data",
          evidenceIds: [],
          evidenceReview: undefined,
          dataFreshness: {
            status: "stale",
            asOf: "2026-05-28T20:00:00.000Z",
            notes: ["Mock price history is stale."],
          },
        }),
        baseCandidate,
      ],
    });

    expect(report).toMatchObject({
      id: "daily-2026-06-05",
      mode: "mock",
      outcome: "ranked_opportunities",
      notRecommendation: true,
      liveTradingEnabled: false,
      providerKeysRequired: [],
      reviewedCount: 2,
      opportunityCount: 1,
    });
    expect(report.noGoodTrades).toBeNull();
    expect(report.opportunities[0]).toMatchObject({
      rank: 1,
      id: "candidate-MSFT-momentum-1",
      ticker: "MSFT",
      instrumentType: "stock",
      strategyFamily: "momentum",
      decision: "paper_trade",
      notRecommendation: true,
      thesis: "Mock momentum candidate with verified stock backtest evidence.",
      downsideScenario: "Shares close below the mock breakout level.",
      invalidationConditions: ["Close below mock breakout level"],
      whySystemMightBeWrong: "Mock data may not represent current market behavior.",
      dataFreshness: {
        status: "fresh",
        asOf: "2026-06-05T12:55:00.000Z",
      },
      sourceCitations: [
        {
          title: "Mock daily price history",
          publishedAt: "2026-06-05T12:45:00.000Z",
          retrievedAt: "2026-06-05T12:55:00.000Z",
        },
      ],
      liquidity: {
        passes: true,
        score: 90,
      },
      evidence: {
        status: "paper_trade_eligible",
        gate: "verified",
        ids: ["bt_mock_momentum_1"],
      },
    });
    expect(report.opportunities[0].scores.confidence).toBeGreaterThanOrEqual(80);
    expect(report.reviewedCandidates).toHaveLength(2);
    expect(
      report.reviewedCandidates.find((candidate) => candidate.id === "candidate-AAPL-stale-1"),
    ).toMatchObject({
      id: "candidate-AAPL-stale-1",
      decision: "needs_more_data",
      reasonCodes: expect.arrayContaining(["fresh_data", "paper_trade_evidence"]),
    });
  });

  it("returns no_good_trades when every reviewed candidate is blocked or incomplete", () => {
    const report = generateDailyOpportunityReport({
      id: "daily-2026-06-06",
      generatedAt: "2026-06-06T13:05:00.000Z",
      candidates: [
        candidateWith({
          id: "candidate-MSFT-low-liquidity-1",
          liquidity: {
            score: 45,
            averageDailyDollarVolume: 1_000_000,
            spreadPercentOfMid: 0.8,
            passes: false,
          },
        }),
        candidateWith({
          id: "candidate-AAPL-missing-citation-1",
          ticker: "AAPL",
          sourceCitations: [],
          evidenceStatus: "research_only",
          evidenceGate: "needs_more_data",
          evidenceIds: [],
          evidenceReview: undefined,
        }),
      ],
    });

    expect(report.outcome).toBe("no_good_trades");
    expect(report.opportunities).toEqual([]);
    expect(report.noGoodTrades).toMatchObject({
      message: "No good trades today.",
      reasonCodes: expect.arrayContaining([
        "liquidity",
        "citations_present",
        "paper_trade_evidence",
      ]),
    });
    expect(report.reviewedCandidates.map((candidate) => candidate.decision)).toEqual([
      "avoid",
      "needs_more_data",
    ]);
  });
});
