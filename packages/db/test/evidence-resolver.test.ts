import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { evaluateStockBacktest, type StockBacktestInput } from "@stockmarket/backtesting";
import {
  closePersistedPaperTrade,
  createLocalClient,
  getRecommendationEvidenceDetail,
  persistStockBacktestRun,
  persistPaperTrade,
  runMigrations,
} from "../src/index.js";
import type { Client } from "@libsql/client";

const now = "2026-05-29T12:00:00Z";
const closedAt = "2026-05-29T20:00:00Z";

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
      '["prices","paper_trades","audit"]',
      "risk-v0",
      now,
    ],
  );
}

async function seedAuditLog(
  id: string,
  eventType: string,
  actorType: "operator" | "system",
  actorId: string,
  subjectType: string,
  subjectId: string,
  occurredAt = now,
  operatorNotes = "Audit note.",
) {
  await execute(
    `INSERT INTO audit_logs
      (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id,
       strategy_version_id, risk_decision, operator_decision, operator_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      eventType,
      actorType,
      actorId,
      occurredAt,
      subjectType,
      subjectId,
      "momentum-v0",
      "pass",
      "paper_trade",
      operatorNotes,
    ],
  );
}

async function seedRecommendation(
  id: string,
  ticker: string,
  paperTradeEvidenceId?: string | null,
  backtestRunId?: string,
) {
  await seedAuditLog(
    `audit_${id}`,
    "operator_decision",
    "operator",
    "operator:test",
    "recommendation",
    id,
    now,
    `Operator reviewed ${id}.`,
  );

  await execute(
    `INSERT INTO recommendations
      (id, ticker, instrument_type, strategy_version_id, decision, evidence_status,
       thesis, bull_case, bear_case, downside_scenario, invalidation_conditions_json,
       why_system_might_be_wrong, primary_citation_title, primary_citation_url,
       primary_citation_source, primary_citation_published_at,
       primary_citation_retrieved_at, freshness_status, freshness_as_of,
       freshness_notes_json, risk_score, confidence_score, liquidity_score,
       liquidity_decision, risk_decision, backtest_run_id, paper_trade_evidence_id,
       operator_audit_log_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      ticker,
      "stock",
      "momentum-v0",
      "paper_trade",
      "paper_trade_eligible",
      "Momentum continuation research candidate.",
      "Paper evidence supports continued research.",
      "Momentum can reverse quickly.",
      "Shares close below the evidence trend line.",
      '["Close below evidence trend line"]',
      "The paper evidence sample may not generalize.",
      "Mock price evidence",
      "https://example.test/mock/msft/prices",
      "mock-provider",
      "2026-05-29T11:00:00Z",
      "2026-05-29T11:05:00Z",
      "fresh",
      "2026-05-29T11:05:00Z",
      '["Provider timestamps reviewed"]',
      86,
      78,
      90,
      "pass",
      "pass",
      backtestRunId ?? null,
      paperTradeEvidenceId ?? null,
      `audit_${id}`,
      now,
      now,
    ],
  );

  await execute(
    `INSERT INTO recommendation_citations
      (id, recommendation_id, title, url, source, published_at, retrieved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      `citation_${id}_secondary`,
      id,
      "Mock audit evidence",
      "https://example.test/mock/msft/audit",
      "mock-audit-source",
      "2026-05-29T10:00:00Z",
      "2026-05-29T11:06:00Z",
    ],
  );
}

function stockBacktestInput(
  overrides: Partial<Omit<StockBacktestInput, "assumptions" | "trades">> & {
    assumptions?: Partial<StockBacktestInput["assumptions"]>;
    trades?: StockBacktestInput["trades"];
  } = {},
): StockBacktestInput {
  const { assumptions, trades, ...inputOverrides } = overrides;
  return {
    id: "backtest_run_1",
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
      ...assumptions,
    },
    trades: trades ?? [
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
    ...inputOverrides,
  };
}

async function persistBacktestEvidence(input = stockBacktestInput()) {
  const result = evaluateStockBacktest(input);
  await persistStockBacktestRun(client, input, result, now);
  return result;
}

async function seedClosedEvidencePaperTrade() {
  await seedRecommendation("rec_source_1", "MSFT", "paper_trade_evidence_seed");
  await seedAuditLog(
    "audit_evidence_approval_1",
    "operator_decision",
    "operator",
    "operator:test",
    "paper_trade",
    "paper_trade_evidence_1",
    now,
    "Approved source paper trade.",
  );
  await seedAuditLog(
    "audit_evidence_entry_1",
    "paper_trade_opened",
    "system",
    "paper-trading",
    "paper_trade",
    "paper_trade_evidence_1",
    now,
    "Opened source paper trade.",
  );
  await seedAuditLog(
    "audit_evidence_close_1",
    "paper_trade_closed",
    "system",
    "paper-trading",
    "paper_trade",
    "paper_trade_evidence_1",
    closedAt,
    "Closed source paper trade.",
  );

  await persistPaperTrade(client, {
    id: "paper_trade_evidence_1",
    recommendationId: "rec_source_1",
    accountId: "paper_account_default",
    ticker: "MSFT",
    instrumentType: "stock",
    strategyVersionId: "momentum-v0",
    operatorApprovalAuditLogId: "audit_evidence_approval_1",
    entryAuditLogId: "audit_evidence_entry_1",
    thesisSnapshot: "Momentum continuation research candidate.",
    entryReason: "Source evidence paper trade.",
    downsideScenario: "Shares close below the evidence trend line.",
    invalidationConditions: ["Close below evidence trend line"],
    entryType: "market",
    requestedEntryPrice: 100,
    simulatedEntryPrice: 100,
    quantity: 10,
    enteredAt: now,
    stopLoss: 95,
    profitTarget: 108,
    timeStopAt: "2026-06-12T20:00:00Z",
    maxLossAmount: 300,
    accountEquityAtEntry: 100000,
    singleNameExposurePct: 2,
    sectorExposurePct: 8,
    correlatedExposurePct: 4,
    dailyLossPctAtEntry: 0.1,
    createdAt: now,
    updatedAt: now,
  });
  await closePersistedPaperTrade(client, {
    id: "paper_trade_evidence_1",
    closeAuditLogId: "audit_evidence_close_1",
    closedAt,
    exitPrice: 106,
    exitReason: "Evidence profit-target review hit.",
    lessonsLearned: "Evidence trade followed through before the time stop.",
    updatedAt: closedAt,
  });
}

describe("recommendation evidence resolver", () => {
  beforeEach(async () => {
    client = await createLocalClient();
    await runMigrations(client);
    await seedStrategy();
  });

  afterEach(() => {
    client.close();
  });

  it("verifies paper-trade evidence and returns citation, freshness, risk, and audit detail", async () => {
    await seedClosedEvidencePaperTrade();
    await seedRecommendation("rec_candidate_1", "MSFT", "paper_trade_evidence_1");

    const detail = await getRecommendationEvidenceDetail(client, "rec_candidate_1");

    expect(detail).toMatchObject({
      notRecommendation: true,
      evidenceGate: "verified",
      reasonCodes: [],
      recommendation: {
        id: "rec_candidate_1",
        ticker: "MSFT",
        instrumentType: "stock",
        strategyVersionId: "momentum-v0",
        decision: "paper_trade",
        evidenceStatus: "paper_trade_eligible",
        downsideScenario: "Shares close below the evidence trend line.",
        invalidationConditions: ["Close below evidence trend line"],
      },
      dataFreshness: {
        status: "fresh",
        asOf: "2026-05-29T11:05:00Z",
        notes: ["Provider timestamps reviewed"],
      },
      evidence: [
        {
          kind: "paper_trade",
          id: "paper_trade_evidence_1",
          status: "verified",
          reasonCodes: [],
          ticker: "MSFT",
          instrumentType: "stock",
          strategyVersionId: "momentum-v0",
          closedAt,
          liveTradingEnabled: false,
          brokerExecution: false,
          realizedPnl: 60,
          realizedReturnPct: 6,
        },
      ],
    });
    expect(detail.citations).toEqual([
      {
        title: "Mock price evidence",
        url: "https://example.test/mock/msft/prices",
        source: "mock-provider",
        publishedAt: "2026-05-29T11:00:00Z",
        retrievedAt: "2026-05-29T11:05:00Z",
      },
      {
        title: "Mock audit evidence",
        url: "https://example.test/mock/msft/audit",
        source: "mock-audit-source",
        publishedAt: "2026-05-29T10:00:00Z",
        retrievedAt: "2026-05-29T11:06:00Z",
      },
    ]);
    expect(detail.auditTrail.map((audit) => audit.eventType)).toEqual([
      "operator_decision",
      "operator_decision",
      "paper_trade_opened",
      "paper_trade_closed",
    ]);
  });

  it("verifies persisted ready backtest evidence for a matching recommendation cohort", async () => {
    const result = await persistBacktestEvidence();
    await seedRecommendation("rec_candidate_1", "MSFT", null, result.id);

    const detail = await getRecommendationEvidenceDetail(client, "rec_candidate_1");

    expect(detail.evidenceGate).toBe("verified");
    expect(detail.reasonCodes).toEqual([]);
    expect(detail.evidence[0]).toMatchObject({
      kind: "backtest_run",
      id: result.id,
      status: "verified",
      reasonCodes: [],
      ticker: "MSFT",
      instrumentType: "stock",
      strategyVersionId: "momentum-v0",
      promotionGate: "ready_for_review",
      tradeCount: 4,
      netReturnPct: 18.2815,
      maxDrawdownPct: 6.25,
      benchmarkRelativeReturnPct: 14.2815,
    });
  });

  it("blocks persisted backtest evidence from a different ticker cohort", async () => {
    const result = await persistBacktestEvidence();
    await seedRecommendation("rec_candidate_1", "AAPL", null, result.id);

    const detail = await getRecommendationEvidenceDetail(client, "rec_candidate_1");

    expect(detail.evidenceGate).toBe("blocked");
    expect(detail.reasonCodes).toContain("backtest_evidence_cohort_mismatch");
    expect(detail.evidence[0]).toMatchObject({
      kind: "backtest_run",
      id: result.id,
      status: "blocked",
      reasonCodes: ["backtest_evidence_cohort_mismatch"],
    });
  });

  it("keeps needs-more-data backtest evidence unresolved", async () => {
    const input = stockBacktestInput({
      assumptions: {
        minTradesForReview: 5,
      },
    });
    const result = await persistBacktestEvidence(input);
    await seedRecommendation("rec_candidate_1", "MSFT", null, result.id);

    const detail = await getRecommendationEvidenceDetail(client, "rec_candidate_1");

    expect(detail.evidenceGate).toBe("needs_more_data");
    expect(detail.reasonCodes).toContain("backtest_evidence_needs_more_data");
    expect(detail.evidence[0]).toMatchObject({
      kind: "backtest_run",
      id: result.id,
      status: "unresolved",
      reasonCodes: ["backtest_evidence_needs_more_data"],
      promotionGate: "needs_more_data",
    });
  });

  it("blocks paper-trade evidence from a different ticker cohort", async () => {
    await seedClosedEvidencePaperTrade();
    await seedRecommendation("rec_candidate_1", "AAPL", "paper_trade_evidence_1");

    const detail = await getRecommendationEvidenceDetail(client, "rec_candidate_1");

    expect(detail.evidenceGate).toBe("blocked");
    expect(detail.reasonCodes).toContain("paper_trade_evidence_cohort_mismatch");
    expect(detail.evidence[0]).toMatchObject({
      kind: "paper_trade",
      id: "paper_trade_evidence_1",
      status: "blocked",
      reasonCodes: ["paper_trade_evidence_cohort_mismatch"],
    });
  });

  it("blocks missing backtest evidence while preserving verified paper evidence", async () => {
    await seedClosedEvidencePaperTrade();
    await seedRecommendation("rec_candidate_1", "MSFT", "paper_trade_evidence_1", "backtest_run_1");

    const detail = await getRecommendationEvidenceDetail(client, "rec_candidate_1");

    expect(detail.evidenceGate).toBe("blocked");
    expect(detail.reasonCodes).toContain("backtest_evidence_missing");
    expect(detail.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "backtest_run",
          id: "backtest_run_1",
          status: "blocked",
          reasonCodes: ["backtest_evidence_missing"],
        }),
        expect.objectContaining({
          kind: "paper_trade",
          id: "paper_trade_evidence_1",
          status: "verified",
        }),
      ]),
    );
  });

  it("blocks unsafe non-paper or broker-enabled evidence without throwing", async () => {
    await seedClosedEvidencePaperTrade();
    await execute("PRAGMA ignore_check_constraints = ON");
    await execute(
      `UPDATE paper_trades
       SET mode = ?, live_trading_enabled = ?, broker_execution = ?
       WHERE id = ?`,
      ["live", 1, 1, "paper_trade_evidence_1"],
    );
    await execute("PRAGMA ignore_check_constraints = OFF");
    await seedRecommendation("rec_candidate_1", "MSFT", "paper_trade_evidence_1");

    const detail = await getRecommendationEvidenceDetail(client, "rec_candidate_1");

    expect(detail.evidenceGate).toBe("blocked");
    expect(detail.reasonCodes).toContain("paper_trade_evidence_unsafe");
    expect(detail.evidence[0]).toMatchObject({
      kind: "paper_trade",
      id: "paper_trade_evidence_1",
      status: "blocked",
      reasonCodes: ["paper_trade_evidence_unsafe"],
    });
    expect(detail.evidence[0]?.realizedPnl).toBeUndefined();
    expect(detail.evidence[0]?.realizedReturnPct).toBeUndefined();
  });
});
