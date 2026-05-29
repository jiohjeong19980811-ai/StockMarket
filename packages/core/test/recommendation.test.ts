import { describe, expect, it } from "vitest";
import { isPaperTradeEligible, opportunityDecisions, type Recommendation } from "../src/index.js";

const baseRecommendation: Recommendation = {
  id: "rec_test_1",
  ticker: "MSFT",
  thesis: "Post-earnings drift research candidate after a positive surprise.",
  instrumentType: "stock",
  strategyFamily: "earnings",
  strategyVersion: "earnings-pead-v0",
  decision: "watchlist",
  evidenceStatus: "watchlist_eligible",
  sourceCitations: [
    {
      title: "Example earnings release",
      url: "https://example.com/earnings",
      source: "example",
      publishedAt: "2026-05-01T12:00:00Z",
      retrievedAt: "2026-05-01T12:05:00Z",
    },
  ],
  dataFreshness: {
    status: "fresh",
    asOf: "2026-05-01T12:05:00Z",
    notes: [],
  },
  scores: {
    risk: 45,
    confidence: 62,
    liquidity: 88,
  },
  bullCase: "Positive surprise and strong liquidity support follow-through research.",
  bearCase: "The surprise may already be priced in.",
  downsideScenario: "Shares reverse below the post-earnings gap.",
  invalidationConditions: ["Close below post-earnings low"],
  whySystemMightBeWrong: "Guidance quality may matter more than headline surprise.",
  operatorDecision: {
    actor: "operator",
    decidedBy: "operator:test",
    decidedAt: "2026-05-01T12:12:00Z",
    auditLogId: "audit_123",
    notes: "Approved for scaffold contract testing.",
  },
  createdAt: "2026-05-01T12:10:00Z",
  updatedAt: "2026-05-01T12:10:00Z",
};

const validOptionsRiskDetails = {
  maxLoss: 250,
  expiration: "2026-06-19",
  strikeLogic: "Delta-targeted long call research candidate.",
  bid: 2.4,
  ask: 2.55,
  mid: 2.475,
  volume: 150,
  openInterest: 1200,
  impliedVolatility: 0.42,
  breakeven: 102.5,
  liquidityPass: true,
  spreadRisk: "Bid/ask spread inside target threshold.",
  eventRisk: "No earnings event before expiration.",
  thetaRisk: "Theta decay reviewed before entry.",
  historicalOptionsEvidenceId: "options_bt_123",
};

function evidenceReviewFor(recommendation: Recommendation): Recommendation["evidenceReview"] {
  const evidenceIds = [recommendation.backtestRunId, recommendation.paperTradeEvidenceId].filter(
    (evidenceId): evidenceId is string => typeof evidenceId === "string",
  );
  return {
    resolver: "db_recommendation_evidence_resolver",
    recommendationId: recommendation.id,
    evidenceGate: "verified",
    evidenceIds,
    reasonCodes: [],
    resolvedAt: "2026-05-01T12:15:00Z",
  };
}

function eligibleRecommendation(overrides: Partial<Recommendation> = {}): Recommendation {
  const recommendation: Recommendation = {
    ...baseRecommendation,
    decision: "paper_trade",
    evidenceStatus: "paper_trade_eligible",
    evidenceGate: "verified",
    backtestRunId: "bt_123",
    ...overrides,
  };
  return {
    ...recommendation,
    evidenceReview: evidenceReviewFor(recommendation),
    ...overrides,
  };
}

describe("recommendation contract", () => {
  it("keeps no-trade outcomes first class", () => {
    expect(opportunityDecisions).toEqual(["watchlist", "paper_trade", "avoid", "needs_more_data"]);
  });

  it("allows stock paper trades only when evidence and risk fields are present", () => {
    const recommendation = eligibleRecommendation();

    expect(isPaperTradeEligible(recommendation)).toBe(true);
  });

  it("blocks raw backtest IDs until evidence has been resolved as verified", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      evidenceGate: "verified",
      backtestRunId: "bt_unresolved",
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks resolver evidence reviews that do not exactly match every evidence ID", () => {
    const recommendation = eligibleRecommendation({
      backtestRunId: "bt_123",
      paperTradeEvidenceId: "paper_trade_123",
    });

    expect(
      isPaperTradeEligible({
        ...recommendation,
        evidenceReview: {
          ...recommendation.evidenceReview!,
          evidenceIds: ["bt_123", "bt_123"],
        },
      }),
    ).toBe(false);
  });

  it("rejects malformed resolver evidence reviews without throwing", () => {
    const recommendation = eligibleRecommendation({
      evidenceReview: {
        resolver: "db_recommendation_evidence_resolver",
        recommendationId: "rec_test_1",
        evidenceGate: "verified",
        evidenceIds: undefined,
        reasonCodes: [],
        resolvedAt: "2026-05-01T12:15:00Z",
      } as unknown as Recommendation["evidenceReview"],
    });

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks paper trade eligibility when evidence is missing", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      decision: "paper_trade",
      evidenceStatus: "watchlist_eligible",
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks paper trade eligibility when data is stale", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation(),
      dataFreshness: {
        ...baseRecommendation.dataFreshness,
        status: "stale",
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks paper trade eligibility when liquidity is weak", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation(),
      scores: {
        ...baseRecommendation.scores,
        liquidity: 50,
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks paper trade eligibility when scores are outside range", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation(),
      scores: {
        ...baseRecommendation.scores,
        risk: 101,
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks paper trade eligibility without downside and uncertainty narratives", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation(),
      downsideScenario: "",
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks paper trade eligibility without an audit record", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation(),
      operatorDecision: {
        ...baseRecommendation.operatorDecision,
        auditLogId: "",
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks options paper trades without historical options evidence", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation({
        backtestRunId: "bt_456",
      }),
      instrumentType: "long_call",
      strategyFamily: "options",
      optionsRiskDetails: {
        ...validOptionsRiskDetails,
        historicalOptionsEvidenceId: undefined,
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks options paper trades without contract-level liquidity fields", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation({
        backtestRunId: "bt_456",
      }),
      instrumentType: "long_call",
      strategyFamily: "options",
      optionsRiskDetails: {
        maxLoss: 250,
        expiration: "2026-06-19",
        strikeLogic: "Delta-targeted long call research candidate.",
        spreadRisk: "Bid/ask spread inside target threshold.",
        eventRisk: "No earnings event before expiration.",
        thetaRisk: "Theta decay reviewed before entry.",
        historicalOptionsEvidenceId: "options_bt_123",
      } as unknown as Recommendation["optionsRiskDetails"],
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("allows options paper trades only with historical evidence and passing liquidity details", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation({
        backtestRunId: "bt_456",
      }),
      instrumentType: "long_call",
      strategyFamily: "options",
      optionsRiskDetails: validOptionsRiskDetails,
    };

    expect(isPaperTradeEligible(recommendation)).toBe(true);
  });

  it("blocks options paper trades when liquidity fails", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation({
        backtestRunId: "bt_456",
      }),
      instrumentType: "long_call",
      strategyFamily: "options",
      optionsRiskDetails: {
        ...validOptionsRiskDetails,
        liquidityPass: false,
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks options paper trades without valid max loss", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation({
        backtestRunId: "bt_456",
      }),
      instrumentType: "long_call",
      strategyFamily: "options",
      optionsRiskDetails: {
        ...validOptionsRiskDetails,
        maxLoss: 0,
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks options paper trades with non-finite max loss", () => {
    const recommendation: Recommendation = {
      ...eligibleRecommendation({
        backtestRunId: "bt_456",
      }),
      instrumentType: "long_call",
      strategyFamily: "options",
      optionsRiskDetails: {
        ...validOptionsRiskDetails,
        maxLoss: Number.POSITIVE_INFINITY,
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });
});
