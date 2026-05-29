import { describe, expect, it } from "vitest";
import { recommendationSchema, type Recommendation } from "../src/index.js";

const validRecommendation: Recommendation = {
  id: "rec_schema_1",
  ticker: "MSFT",
  thesis: "Post-earnings drift research candidate after a positive surprise.",
  instrumentType: "stock",
  strategyFamily: "earnings",
  strategyVersion: "earnings-pead-v0",
  decision: "paper_trade",
  evidenceStatus: "paper_trade_eligible",
  evidenceGate: "verified",
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
    notes: "Approved for schema contract testing.",
  },
  backtestRunId: "bt_123",
  evidenceReview: {
    resolver: "db_recommendation_evidence_resolver",
    recommendationId: "rec_schema_1",
    evidenceGate: "verified",
    evidenceIds: ["bt_123"],
    reasonCodes: [],
    resolvedAt: "2026-05-01T12:15:00Z",
  },
  createdAt: "2026-05-01T12:10:00Z",
  updatedAt: "2026-05-01T12:10:00Z",
};

describe("recommendation runtime schema", () => {
  it("accepts a valid recommendation contract", () => {
    expect(recommendationSchema.parse(validRecommendation)).toEqual(validRecommendation);
  });

  it("rejects invalid score ranges", () => {
    expect(() =>
      recommendationSchema.parse({
        ...validRecommendation,
        scores: {
          ...validRecommendation.scores,
          confidence: 101,
        },
      }),
    ).toThrow();
  });

  it("rejects citations without source timestamps", () => {
    expect(() =>
      recommendationSchema.parse({
        ...validRecommendation,
        sourceCitations: [
          {
            ...validRecommendation.sourceCitations[0],
            retrievedAt: "",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects malformed ISO timestamps", () => {
    const malformedTimestampCases: Recommendation[] = [
      {
        ...validRecommendation,
        sourceCitations: [
          {
            ...validRecommendation.sourceCitations[0],
            publishedAt: "not-a-timestamp",
          },
        ],
      },
      {
        ...validRecommendation,
        dataFreshness: {
          ...validRecommendation.dataFreshness,
          asOf: "2026-05-01",
        },
      },
      {
        ...validRecommendation,
        operatorDecision: {
          ...validRecommendation.operatorDecision,
          decidedAt: "soon",
        },
      },
      {
        ...validRecommendation,
        createdAt: "not-a-timestamp",
      },
      {
        ...validRecommendation,
        updatedAt: "not-a-timestamp",
      },
    ];

    for (const recommendation of malformedTimestampCases) {
      expect(() => recommendationSchema.parse(recommendation)).toThrow();
    }
  });

  it("rejects options contracts without liquidity fields", () => {
    expect(() =>
      recommendationSchema.parse({
        ...validRecommendation,
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
        },
      }),
    ).toThrow();
  });

  it("rejects paper-trade contracts that fail eligibility gates", () => {
    expect(() =>
      recommendationSchema.parse({
        ...validRecommendation,
        backtestRunId: undefined,
      }),
    ).toThrow();
  });

  it("allows no-trade options records with failed liquidity documented", () => {
    const parsed = recommendationSchema.parse({
      ...validRecommendation,
      instrumentType: "long_call",
      strategyFamily: "options",
      decision: "avoid",
      evidenceStatus: "avoid",
      backtestRunId: undefined,
      optionsRiskDetails: {
        maxLoss: 250,
        expiration: "2026-06-19",
        strikeLogic: "Delta-targeted long call research candidate.",
        bid: 2.4,
        ask: 2.55,
        mid: 2.475,
        volume: 10,
        openInterest: 75,
        impliedVolatility: 0.42,
        breakeven: 102.5,
        liquidityPass: false,
        spreadRisk: "Open interest and volume are below the options liquidity threshold.",
        eventRisk: "No earnings event before expiration.",
        thetaRisk: "Theta decay reviewed before entry.",
      },
    });

    expect(parsed.decision).toBe("avoid");
  });
});
