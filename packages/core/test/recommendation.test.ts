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

describe("recommendation contract", () => {
  it("keeps no-trade outcomes first class", () => {
    expect(opportunityDecisions).toEqual(["watchlist", "paper_trade", "avoid", "needs_more_data"]);
  });

  it("allows stock paper trades only when evidence and risk fields are present", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_123",
    };

    expect(isPaperTradeEligible(recommendation)).toBe(true);
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
      ...baseRecommendation,
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_123",
      dataFreshness: {
        ...baseRecommendation.dataFreshness,
        status: "stale",
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks paper trade eligibility when liquidity is weak", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_123",
      scores: {
        ...baseRecommendation.scores,
        liquidity: 50,
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks paper trade eligibility when scores are outside range", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_123",
      scores: {
        ...baseRecommendation.scores,
        risk: 101,
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks paper trade eligibility without downside and uncertainty narratives", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_123",
      downsideScenario: "",
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks paper trade eligibility without an audit record", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_123",
      operatorDecision: {
        ...baseRecommendation.operatorDecision,
        auditLogId: "",
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks options paper trades without historical options evidence", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      instrumentType: "long_call",
      strategyFamily: "options",
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_456",
      optionsRiskDetails: {
        maxLoss: 250,
        expiration: "2026-06-19",
        strikeLogic: "Delta-targeted long call research candidate.",
        spreadRisk: "Bid/ask spread above target threshold.",
        eventRisk: "Earnings event occurs before expiration.",
        thetaRisk: "Theta decay accelerates inside 30 DTE.",
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks options paper trades without valid max loss", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      instrumentType: "long_call",
      strategyFamily: "options",
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_456",
      optionsRiskDetails: {
        maxLoss: 0,
        expiration: "2026-06-19",
        strikeLogic: "Delta-targeted long call research candidate.",
        spreadRisk: "Bid/ask spread inside target threshold.",
        eventRisk: "No earnings event before expiration.",
        thetaRisk: "Theta decay reviewed before entry.",
        historicalOptionsEvidenceId: "options_bt_123",
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks options paper trades with non-finite max loss", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      instrumentType: "long_call",
      strategyFamily: "options",
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_456",
      optionsRiskDetails: {
        maxLoss: Number.POSITIVE_INFINITY,
        expiration: "2026-06-19",
        strikeLogic: "Delta-targeted long call research candidate.",
        spreadRisk: "Bid/ask spread inside target threshold.",
        eventRisk: "No earnings event before expiration.",
        thetaRisk: "Theta decay reviewed before entry.",
        historicalOptionsEvidenceId: "options_bt_123",
      },
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });
});
