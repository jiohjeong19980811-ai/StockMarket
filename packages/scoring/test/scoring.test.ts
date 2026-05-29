import { describe, expect, it } from "vitest";

import { getStrategyPolicy, scoreOpportunity, type ScoringInput } from "../src/index.js";

const baseStockInput: ScoringInput = {
  id: "score-AAPL-momentum-1",
  ticker: "AAPL",
  instrumentType: "stock",
  strategyFamily: "momentum",
  evidenceStatus: "paper_trade_eligible",
  evidenceGate: "verified",
  evidenceIds: ["backtest-run-1"],
  evidenceReview: {
    resolver: "db_recommendation_evidence_resolver",
    recommendationId: "score-AAPL-momentum-1",
    evidenceGate: "verified",
    evidenceIds: ["backtest-run-1"],
    reasonCodes: [],
    resolvedAt: "2026-05-28T20:05:00.000Z",
  },
  dataFreshness: {
    status: "fresh",
    asOf: "2026-05-28T20:00:00.000Z",
    notes: [],
  },
  sourceCitations: [
    {
      title: "Mock price history",
      url: "https://example.test/prices/aapl",
      source: "mock-provider",
      publishedAt: "2026-05-28T19:55:00.000Z",
      retrievedAt: "2026-05-28T20:00:00.000Z",
    },
  ],
  componentSignals: [
    {
      component: "momentum",
      score: 82,
      weight: 0.5,
      explanation: "Relative strength is above the mock universe median.",
    },
    {
      component: "liquidity",
      score: 90,
      weight: 0.3,
      explanation: "Mock dollar volume clears the stock liquidity floor.",
    },
    {
      component: "risk",
      score: 78,
      weight: 0.2,
      explanation: "Paper exposure remains inside default risk limits.",
    },
  ],
  liquidity: {
    score: 88,
    averageDailyDollarVolume: 50_000_000,
    spreadPercentOfMid: 0.02,
    passes: true,
  },
  paperExposure: {
    proposedPositionRiskPct: 0.35,
    singleNameExposurePct: 3,
    sectorExposurePct: 12,
    correlatedExposurePct: 8,
    dailyLossPct: 0.5,
    aggregateOptionsPremiumPct: 0,
  },
};

function inputWith(overrides: Partial<ScoringInput>): ScoringInput {
  return {
    ...baseStockInput,
    ...overrides,
  };
}

describe("scoreOpportunity", () => {
  it("allows a stock candidate to become paper_trade only when evidence and risk gates pass", () => {
    const result = scoreOpportunity(baseStockInput);

    expect(result.decision).toBe("paper_trade");
    expect(result.strategyPolicy).toMatchObject({
      family: "momentum",
      mvpDecision: "test_now",
      paperTradeAllowed: true,
    });
    expect(result.scores.confidence).toBeGreaterThanOrEqual(70);
    expect(result.scores.liquidity).toBeGreaterThanOrEqual(70);
    expect(result.gates.every((gate) => gate.passed)).toBe(true);
  });

  it("returns documented strategy policy metadata for operator UI categories", () => {
    const policy = getStrategyPolicy("momentum");

    expect(policy).toMatchObject({
      family: "momentum",
      label: "Momentum",
      mvpDecision: "test_now",
      paperTradeAllowed: true,
      implementationComplexity: "medium",
      overfittingRisk: "medium",
    });
    expect(policy.requiredData).toContain("Adjusted OHLCV");
    expect(policy.riskControls).toContain("Liquidity floor");
  });

  it("keeps research-only evidence at watchlist even when other gates pass", () => {
    const result = scoreOpportunity(
      inputWith({
        evidenceStatus: "research_only",
        evidenceIds: [],
      }),
    );

    expect(result.decision).toBe("watchlist");
    expect(result.gates.find((gate) => gate.id === "paper_trade_evidence")).toMatchObject({
      passed: false,
      impact: "paper_trade_block",
    });
  });

  it("keeps raw evidence IDs at watchlist until evidence is resolved as verified", () => {
    const result = scoreOpportunity(
      inputWith({
        evidenceReview: undefined,
        evidenceIds: ["backtest-run-1"],
      }),
    );

    expect(result.decision).toBe("watchlist");
    expect(result.gates.find((gate) => gate.id === "paper_trade_evidence")).toMatchObject({
      passed: false,
      impact: "paper_trade_block",
    });
  });

  it("keeps context-only strategy families at watchlist even when generic gates pass", () => {
    const result = scoreOpportunity(
      inputWith({
        id: "score-MSFT-value-quality-1",
        strategyFamily: "value_quality",
        componentSignals: [
          {
            component: "value_quality",
            score: 84,
            weight: 0.7,
            explanation: "Mock valuation and balance-sheet quality are favorable.",
          },
          {
            component: "liquidity",
            score: 88,
            weight: 0.3,
            explanation: "Mock dollar volume clears the stock liquidity floor.",
          },
        ],
      }),
    );

    expect(result.decision).toBe("watchlist");
    expect(result.strategyPolicy).toMatchObject({
      family: "value_quality",
      mvpDecision: "context_only",
      paperTradeAllowed: false,
    });
    expect(result.gates.find((gate) => gate.id === "strategy_family_mvp_scope")).toMatchObject({
      passed: false,
      impact: "paper_trade_block",
    });
  });

  it("returns needs_more_data when citations or freshness are missing", () => {
    const noCitations = scoreOpportunity(
      inputWith({
        sourceCitations: [],
      }),
    );
    const staleData = scoreOpportunity(
      inputWith({
        dataFreshness: {
          status: "stale",
          asOf: "2026-05-20T20:00:00.000Z",
          notes: ["Mock price history is stale."],
        },
      }),
    );

    expect(noCitations.decision).toBe("needs_more_data");
    expect(staleData.decision).toBe("needs_more_data");
  });

  it("returns avoid when paper exposure limits are breached", () => {
    const result = scoreOpportunity(
      inputWith({
        paperExposure: {
          ...baseStockInput.paperExposure,
          sectorExposurePct: 25,
        },
      }),
    );

    expect(result.decision).toBe("avoid");
    expect(result.gates.find((gate) => gate.id === "paper_exposure")).toMatchObject({
      passed: false,
      impact: "avoid",
    });
  });

  it("blocks options paper-trade promotion when contract-level risk details are missing", () => {
    const result = scoreOpportunity(
      inputWith({
        instrumentType: "long_call",
        strategyFamily: "options",
      }),
    );

    expect(result.decision).toBe("avoid");
    expect(result.gates.find((gate) => gate.id === "options_risk_details")).toMatchObject({
      passed: false,
      impact: "avoid",
    });
  });

  it("keeps defined-risk options at watchlist until options strategy policy is promoted", () => {
    const result = scoreOpportunity(
      inputWith({
        instrumentType: "long_call",
        strategyFamily: "options",
        optionsRiskDetails: {
          maxLoss: 250,
          expiration: "2026-07-17",
          strikeLogic: "Mock 45 DTE call with liquid chain evidence.",
          bid: 4.9,
          ask: 5.1,
          mid: 5,
          volume: 1_200,
          openInterest: 5_000,
          impliedVolatility: 0.32,
          breakeven: 205,
          liquidityPass: true,
          spreadRisk: "Spread is inside the configured cap.",
          eventRisk: "No earnings event inside the mock holding window.",
          thetaRisk: "Theta risk is documented for paper review.",
          historicalOptionsEvidenceId: "options-backtest-1",
        },
      }),
    );

    expect(result.decision).toBe("watchlist");
    expect(result.strategyPolicy).toMatchObject({
      family: "options",
      mvpDecision: "test_later",
      paperTradeAllowed: false,
    });
    expect(result.gates.find((gate) => gate.id === "strategy_family_mvp_scope")).toMatchObject({
      passed: false,
      impact: "paper_trade_block",
    });
    expect(result.gates.find((gate) => gate.id === "options_risk_details")).toMatchObject({
      passed: true,
    });
  });

  it("clamps score outputs to the core 0 to 100 range", () => {
    const result = scoreOpportunity(
      inputWith({
        componentSignals: [
          {
            component: "momentum",
            score: 130,
            weight: 1,
            explanation: "Out-of-range mock signal should be clamped.",
          },
        ],
        liquidity: {
          ...baseStockInput.liquidity,
          score: 180,
        },
      }),
    );

    expect(result.scores.confidence).toBe(100);
    expect(result.scores.liquidity).toBe(100);
    expect(result.scores.risk).toBeGreaterThanOrEqual(0);
    expect(result.scores.risk).toBeLessThanOrEqual(100);
  });
});
