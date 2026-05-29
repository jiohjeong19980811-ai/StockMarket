import { describe, expect, it } from "vitest";
import type { Recommendation } from "@stockmarket/core";

import {
  closePaperTrade,
  createPaperTrade,
  summarizePaperTradeEvidence,
  type PaperTradeClosed,
  type PaperTradeRequest,
} from "../src/index.js";

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
      stopLossPrice: 95,
      profitTargetPrice: 108,
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

function openAcceptedTrade(overrides: Partial<PaperTradeRequest> = {}) {
  const opened = createPaperTrade(requestWith(overrides));
  if (opened.status !== "accepted") {
    throw new Error(`Expected accepted paper trade, got ${opened.reasonCodes.join(",")}`);
  }
  return opened.trade;
}

function closeAcceptedTrade(
  exitPrice: number,
  auditLogId: string,
  lessonsLearned: string,
): PaperTradeClosed {
  const closed = closePaperTrade(openAcceptedTrade(), {
    exitedAt: "2026-05-06T20:00:00Z",
    exitPrice,
    priceTimestamp: "2026-05-06T20:00:00Z",
    exitReason: "Paper-trade evidence summary test exit.",
    lessonsLearned,
    auditLogId,
  });
  if (closed.status !== "accepted") {
    throw new Error(`Expected accepted paper close, got ${closed.reasonCodes.join(",")}`);
  }
  return closed.trade;
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
      stopLossPrice: 95,
      profitTargetPrice: 108,
      invalidationConditions: ["Close below post-earnings low"],
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

  it("closes a simulated stock paper trade with timestamped exit, P/L, and lessons learned", () => {
    const opened = createPaperTrade(requestWith());
    expect(opened.status).toBe("accepted");

    const result = closePaperTrade(opened.trade, {
      exitedAt: "2026-05-06T20:00:00Z",
      exitPrice: 106,
      priceTimestamp: "2026-05-06T20:00:00Z",
      exitReason: "Profit target review hit during paper-trade validation.",
      lessonsLearned: "Momentum follow-through appeared before the time stop.",
      auditLogId: "audit_paper_close_1",
    });

    expect(result.status).toBe("accepted");
    expect(result.reasonCodes).toEqual([]);
    expect(result.trade).toMatchObject({
      mode: "paper",
      liveTradingEnabled: false,
      brokerExecution: false,
      status: "closed",
      closedAt: "2026-05-06T20:00:00Z",
      exitPrice: 106,
      exitReason: "Profit target review hit during paper-trade validation.",
      realizedPnl: 60,
      realizedReturnPct: 6,
      lessons: ["Momentum follow-through appeared before the time stop."],
      exitAudit: {
        auditLogId: "audit_paper_close_1",
        priceTimestamp: "2026-05-06T20:00:00Z",
      },
    });
  });

  it("rejects paper-trade closes without valid exit evidence and lessons", () => {
    const opened = createPaperTrade(requestWith());
    expect(opened.status).toBe("accepted");

    const missingLessons = closePaperTrade(opened.trade, {
      exitedAt: "2026-05-06T20:00:00Z",
      exitPrice: 106,
      priceTimestamp: "2026-05-06T20:00:00Z",
      exitReason: "Profit target review hit during paper-trade validation.",
      lessonsLearned: "",
      auditLogId: "audit_paper_close_1",
    });
    const invalidExit = closePaperTrade(opened.trade, {
      exitedAt: "2026-05-06T20:00:00Z",
      exitPrice: 0,
      priceTimestamp: "2026-05-06T20:00:00Z",
      exitReason: "Profit target review hit during paper-trade validation.",
      lessonsLearned: "Momentum follow-through appeared before the time stop.",
      auditLogId: "audit_paper_close_1",
    });

    expect(missingLessons.status).toBe("rejected");
    expect(missingLessons.reasonCodes).toContain("exit_details_missing");
    expect(invalidExit.status).toBe("rejected");
    expect(invalidExit.reasonCodes).toContain("invalid_exit_price");
  });

  it("rejects paper-trade closes with nested broker fields or invalid timestamp order", () => {
    const opened = createPaperTrade(requestWith());
    expect(opened.status).toBe("accepted");

    const nestedBroker = closePaperTrade(opened.trade, {
      exitedAt: "2026-05-06T20:00:00Z",
      exitPrice: 106,
      priceTimestamp: "2026-05-06T20:00:00Z",
      exitReason: "Profit target review hit during paper-trade validation.",
      lessonsLearned: "Momentum follow-through appeared before the time stop.",
      auditLogId: "audit_paper_close_1",
      brokerOrderId: "nested-live-order-shape",
    } as unknown as Parameters<typeof closePaperTrade>[1]);
    const exitBeforeEntry = closePaperTrade(opened.trade, {
      exitedAt: "2026-04-30T20:00:00Z",
      exitPrice: 106,
      priceTimestamp: "2026-05-06T20:00:00Z",
      exitReason: "Profit target review hit during paper-trade validation.",
      lessonsLearned: "Momentum follow-through appeared before the time stop.",
      auditLogId: "audit_paper_close_1",
    });

    expect(nestedBroker.status).toBe("rejected");
    expect(nestedBroker.reasonCodes).toContain("broker_execution_fields_prohibited");
    expect(exitBeforeEntry.status).toBe("rejected");
    expect(exitBeforeEntry.reasonCodes).toContain("invalid_timestamps");
  });

  it("rejects duplicate closes for an already closed paper trade", () => {
    const opened = createPaperTrade(requestWith());
    expect(opened.status).toBe("accepted");
    const closed = closePaperTrade(opened.trade, {
      exitedAt: "2026-05-06T20:00:00Z",
      exitPrice: 106,
      priceTimestamp: "2026-05-06T20:00:00Z",
      exitReason: "Profit target review hit during paper-trade validation.",
      lessonsLearned: "Momentum follow-through appeared before the time stop.",
      auditLogId: "audit_paper_close_1",
    });
    expect(closed.status).toBe("accepted");

    const duplicate = closePaperTrade(closed.trade, {
      exitedAt: "2026-05-07T20:00:00Z",
      exitPrice: 107,
      priceTimestamp: "2026-05-07T20:00:00Z",
      exitReason: "Duplicate exit attempt.",
      lessonsLearned: "Should not be recorded twice.",
      auditLogId: "audit_paper_close_2",
    });

    expect(duplicate.status).toBe("rejected");
    expect(duplicate.reasonCodes).toContain("trade_not_open");
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

  it("rejects nested broker, execution, or external order-shaped fields inside paper requests", () => {
    const nestedOrderId = createPaperTrade(
      requestWith({
        entry: {
          ...requestWith().entry,
          brokerOrderId: "nested-live-order-shape",
        } as unknown as PaperTradeRequest["entry"],
      }),
    );
    const nestedExecutionFlag = createPaperTrade(
      requestWith({
        entry: {
          ...requestWith().entry,
          execution: {
            brokerExecution: true,
          },
        } as unknown as PaperTradeRequest["entry"],
      }),
    );

    expect(nestedOrderId.status).toBe("rejected");
    expect(nestedOrderId.reasonCodes).toContain("broker_execution_fields_prohibited");
    expect(nestedOrderId.trade).toBeUndefined();
    expect(nestedExecutionFlag.status).toBe("rejected");
    expect(nestedExecutionFlag.reasonCodes).toContain("broker_execution_fields_prohibited");
    expect(nestedExecutionFlag.trade).toBeUndefined();
  });

  it("rejects paper trades that understate stop-based max loss", () => {
    const result = createPaperTrade(
      requestWith({
        entry: {
          ...requestWith().entry,
          maxLoss: 1,
        },
      }),
    );

    expect(result.status).toBe("rejected");
    expect(result.reasonCodes).toContain("max_loss_understated");
    expect(result.trade).toBeUndefined();
  });

  it("rejects paper trades with invalid or unordered entry timestamps", () => {
    const invalidRequestedAt = createPaperTrade(
      requestWith({
        entry: {
          ...requestWith().entry,
          requestedAt: "not-a-date",
        },
      }),
    );
    const approvalAfterEntry = createPaperTrade(
      requestWith({
        operatorApproval: {
          ...requestWith().operatorApproval,
          approvedAt: "2026-05-01T13:05:00Z",
        },
      }),
    );

    expect(invalidRequestedAt.status).toBe("rejected");
    expect(invalidRequestedAt.reasonCodes).toContain("invalid_timestamps");
    expect(approvalAfterEntry.status).toBe("rejected");
    expect(approvalAfterEntry.reasonCodes).toContain("invalid_timestamps");
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

  it("rejects paper trades without explicit time stops or valid stop and target prices", () => {
    const missingTimeStop = createPaperTrade(
      requestWith({
        entry: {
          ...requestWith().entry,
          timeStop: "",
        },
      }),
    );
    const invalidStop = createPaperTrade(
      requestWith({
        entry: {
          ...requestWith().entry,
          stopLossPrice: 101,
        },
      }),
    );
    const invalidTarget = createPaperTrade(
      requestWith({
        entry: {
          ...requestWith().entry,
          profitTargetPrice: 99,
        },
      }),
    );

    expect(missingTimeStop.status).toBe("rejected");
    expect(missingTimeStop.reasonCodes).toContain("entry_rules_missing");
    expect(invalidStop.status).toBe("rejected");
    expect(invalidStop.reasonCodes).toContain("invalid_exit_prices");
    expect(invalidTarget.status).toBe("rejected");
    expect(invalidTarget.reasonCodes).toContain("invalid_exit_prices");
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

describe("summarizePaperTradeEvidence", () => {
  it("summarizes closed paper trades while separating open trades from performance metrics", () => {
    const openTrade = openAcceptedTrade();
    const winner = closeAcceptedTrade(
      106,
      "audit_paper_close_win",
      "Winner followed through before the time stop.",
    );
    const loser = closeAcceptedTrade(
      95,
      "audit_paper_close_loss",
      "Loser respected the stop before thesis damage grew.",
    );

    const summary = summarizePaperTradeEvidence([openTrade, winner, loser]);

    expect(summary).toMatchObject({
      mode: "paper",
      liveTradingEnabled: false,
      brokerExecution: false,
      notRecommendation: true,
      status: "accepted",
      reviewStatus: "needs_more_data",
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
    });
    expect(summary.reasonCodes).toContain("insufficient_closed_trades");
    expect(summary.closedTradeAuditLogIds).toEqual([
      "audit_paper_close_win",
      "audit_paper_close_loss",
    ]);
    expect(summary.notes).toContain(
      "Paper-trade evidence is a validation input, not a recommendation or performance promise.",
    );
  });

  it("marks a sufficient paper-trade sample ready for operator review, not promotion", () => {
    const winner = closeAcceptedTrade(
      106,
      "audit_paper_close_ready_win",
      "Winner followed the target rule.",
    );
    const loser = closeAcceptedTrade(
      95,
      "audit_paper_close_ready_loss",
      "Loser respected the stop rule.",
    );

    const summary = summarizePaperTradeEvidence([winner, loser], {
      minimumClosedTradesForReview: 2,
    });

    expect(summary.status).toBe("accepted");
    expect(summary.reviewStatus).toBe("ready_for_review");
    expect(summary.reasonCodes).toEqual(["requires_backtest_and_operator_review"]);
    expect(summary.notRecommendation).toBe(true);
  });

  it("blocks evidence summaries that contain broker or live-trading shaped records", () => {
    const unsafeTrade = {
      ...closeAcceptedTrade(106, "audit_paper_close_unsafe", "Unsafe record should block."),
      brokerExecution: true,
    } as unknown as PaperTradeClosed;

    const summary = summarizePaperTradeEvidence([unsafeTrade]);

    expect(summary.status).toBe("blocked");
    expect(summary.reviewStatus).toBe("blocked");
    expect(summary.reasonCodes).toContain("broker_execution_fields_prohibited");
    expect(summary.closedTrades).toBe(0);
    expect(summary.notRecommendation).toBe(true);
  });

  it("blocks evidence summaries that mix strategy cohorts or contain nested broker fields", () => {
    const msftWinner = closeAcceptedTrade(
      106,
      "audit_paper_close_msft",
      "MSFT winner followed the target rule.",
    );
    const aaplWinner = {
      ...closeAcceptedTrade(106, "audit_paper_close_aapl", "AAPL winner followed the target rule."),
      ticker: "AAPL",
    } satisfies PaperTradeClosed;
    const nestedBroker = {
      ...msftWinner,
      metadata: {
        brokerOrderId: "nested-live-order-shape",
      },
    } as unknown as PaperTradeClosed;

    const mixed = summarizePaperTradeEvidence([msftWinner, aaplWinner]);
    const unsafe = summarizePaperTradeEvidence([nestedBroker]);

    expect(mixed.status).toBe("blocked");
    expect(mixed.reasonCodes).toContain("mixed_evidence_cohort");
    expect(unsafe.status).toBe("blocked");
    expect(unsafe.reasonCodes).toContain("broker_execution_fields_prohibited");
  });
});
