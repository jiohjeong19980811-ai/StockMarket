import { describe, expect, it } from "vitest";
import type { Recommendation } from "@stockmarket/core";

import { createPaperTrade, type PaperTradeRequest } from "../src/index.js";

const baseRecommendation: Recommendation = {
  id: "rec_msft_pead_1",
  ticker: "MSFT",
  thesis: "Post-earnings drift research candidate after a positive surprise.",
  instrumentType: "stock",
  strategyFamily: "earnings",
  strategyVersion: "earnings-pead-v0",
  decision: "paper_trade",
  evidenceStatus: "paper_trade_eligible",
  sourceCitations: [
    {
      title: "Example earnings release",
      url: "https://example.test/earnings/msft",
      source: "mock-provider",
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
    risk: 82,
    confidence: 74,
    liquidity: 90,
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
    auditLogId: "audit_rec_123",
    notes: "Approved for paper-trading contract testing.",
  },
  backtestRunId: "bt_msft_pead_1",
  createdAt: "2026-05-01T12:10:00Z",
  updatedAt: "2026-05-01T12:10:00Z",
};

function requestWith(overrides: Partial<PaperTradeRequest> = {}): PaperTradeRequest {
  return {
    recommendation: baseRecommendation,
    account: {
      paperEquity: 100_000,
      currentDailyLossPct: 0.2,
      singleNameExposurePct: 2,
      sectorExposurePct: 8,
      correlatedExposurePct: 4,
      aggregateOptionsPremiumPct: 0,
    },
    entry: {
      requestedAt: "2026-05-01T13:00:00Z",
      quantity: 10,
      entryPrice: 100,
      maxLoss: 300,
      thesisSnapshot: baseRecommendation.thesis,
      stopRule: "Exit on close below post-earnings low.",
      targetRule: "Review after 5% paper gain or thesis invalidation.",
      timeStop: "Exit after 10 trading days if drift does not appear.",
    },
    operatorApproval: {
      approvedBy: "operator:test",
      approvedAt: "2026-05-01T12:58:00Z",
      auditLogId: "audit_paper_open_1",
      notes: "Paper-only approval.",
    },
    ...overrides,
  };
}

describe("createPaperTrade", () => {
  it("opens a simulated stock paper trade when eligibility, approval, and risk limits pass", () => {
    const result = createPaperTrade(requestWith());

    expect(result.status).toBe("accepted");
    expect(result.reasonCodes).toEqual([]);
    expect(result.trade).toMatchObject({
      mode: "paper",
      liveTradingEnabled: false,
      brokerExecution: false,
      recommendationId: "rec_msft_pead_1",
      ticker: "MSFT",
      instrumentType: "stock",
      status: "open",
      openedAt: "2026-05-01T13:00:00Z",
      quantity: 10,
      entryPrice: 100,
      thesisSnapshot: baseRecommendation.thesis,
      stopRule: "Exit on close below post-earnings low.",
      targetRule: "Review after 5% paper gain or thesis invalidation.",
      timeStop: "Exit after 10 trading days if drift does not appear.",
      risk: {
        maxLoss: 300,
        riskPctOfEquity: 0.3,
      },
      audit: {
        openedBy: "operator:test",
        auditLogId: "audit_paper_open_1",
      },
      lessons: [],
    });
  });

  it("rejects recommendations that are not core paper-trade eligible", () => {
    const result = createPaperTrade(
      requestWith({
        recommendation: {
          ...baseRecommendation,
          decision: "watchlist",
          evidenceStatus: "watchlist_eligible",
          backtestRunId: undefined,
        },
      }),
    );

    expect(result.status).toBe("rejected");
    expect(result.reasonCodes).toContain("recommendation_not_paper_trade_eligible");
    expect(result.trade).toBeUndefined();
  });

  it("rejects broker or external order-shaped fields even on paper requests", () => {
    const result = createPaperTrade({
      ...requestWith(),
      brokerOrderId: "never-allowed-in-mvp",
    } as unknown as PaperTradeRequest);

    expect(result.status).toBe("rejected");
    expect(result.reasonCodes).toContain("broker_execution_fields_prohibited");
    expect(result.trade).toBeUndefined();
  });

  it("rejects paper trades that exceed conservative paper exposure limits", () => {
    const result = createPaperTrade(
      requestWith({
        entry: {
          ...requestWith().entry,
          maxLoss: 700,
        },
        account: {
          ...requestWith().account,
          sectorExposurePct: 22,
        },
      }),
    );

    expect(result.status).toBe("rejected");
    expect(result.reasonCodes).toContain("position_risk_limit_exceeded");
    expect(result.reasonCodes).toContain("sector_exposure_limit_exceeded");
    expect(result.trade).toBeUndefined();
  });

  it("rejects options paper trades until the options policy is explicitly promoted", () => {
    const result = createPaperTrade(
      requestWith({
        recommendation: {
          ...baseRecommendation,
          instrumentType: "long_call",
          strategyFamily: "options",
          optionsRiskDetails: {
            maxLoss: 250,
            expiration: "2026-06-19",
            strikeLogic: "Delta-targeted long call research candidate.",
            bid: 2.4,
            ask: 2.55,
            mid: 2.475,
            volume: 150,
            openInterest: 1_200,
            impliedVolatility: 0.42,
            breakeven: 102.5,
            liquidityPass: true,
            spreadRisk: "Bid/ask spread inside target threshold.",
            eventRisk: "No earnings event before expiration.",
            thetaRisk: "Theta decay reviewed before entry.",
            historicalOptionsEvidenceId: "options_bt_123",
          },
        },
      }),
    );

    expect(result.status).toBe("rejected");
    expect(result.reasonCodes).toContain("options_paper_trading_deferred");
    expect(result.trade).toBeUndefined();
  });
});
