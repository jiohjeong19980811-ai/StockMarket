import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  closePersistedPaperTrade,
  createLocalClient,
  getPersistedPaperTradeById,
  listPersistedPaperTrades,
  persistPaperTrade,
  runMigrations,
} from "../src/index.js";
import type { Client } from "@libsql/client";

const now = "2026-05-01T12:00:00Z";

let client: Client;

async function execute(sql: string, args: unknown[] = []) {
  return client.execute({ sql, args });
}

async function seedPaperTradeDependencies(decision = "paper_trade") {
  await execute(
    `INSERT INTO strategy_definitions
      (id, family, name, description, allowed_instrument_types_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    ["strategy_earnings", "earnings", "PEAD", "Post-earnings drift research.", '["stock"]', now],
  );
  await execute(
    `INSERT INTO strategy_versions
      (id, strategy_definition_id, version, validation_status, promotion_state, required_data_json, risk_policy_version, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "strategy_earnings_v0",
      "strategy_earnings",
      "v0",
      "paper_trade_eligible",
      "paper_trade_eligible",
      '["prices","earnings"]',
      "risk-v0",
      now,
    ],
  );
  await execute(
    `INSERT INTO audit_logs
      (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id, risk_decision, operator_decision)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "audit_recommendation_1",
      "operator_decision",
      "operator",
      "operator:test",
      now,
      "recommendation",
      "rec_1",
      "pass",
      decision,
    ],
  );
  await execute(
    `INSERT INTO recommendations
      (id, ticker, instrument_type, strategy_version_id, decision, evidence_status, evidence_gate, thesis, bull_case,
       bear_case, downside_scenario, invalidation_conditions_json, why_system_might_be_wrong,
       primary_citation_title, primary_citation_url, primary_citation_source,
       primary_citation_published_at, primary_citation_retrieved_at, freshness_status,
       freshness_as_of, freshness_notes_json, risk_score, confidence_score, liquidity_score,
       liquidity_decision, risk_decision, backtest_run_id, operator_audit_log_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "rec_1",
      "MSFT",
      "stock",
      "strategy_earnings_v0",
      decision,
      decision === "paper_trade" ? "paper_trade_eligible" : "watchlist_eligible",
      decision === "paper_trade" ? "verified" : "needs_more_data",
      "Positive earnings surprise research candidate.",
      "Liquidity and surprise support follow-through research.",
      "Move may be exhausted.",
      "Shares reverse below the event gap.",
      '["Close below event low"]',
      "Guidance may matter more than surprise.",
      "Example earnings release",
      "https://example.com/earnings",
      "example",
      now,
      now,
      "fresh",
      now,
      "[]",
      45,
      62,
      88,
      "pass",
      "pass",
      decision === "paper_trade" ? "bt_123" : null,
      "audit_recommendation_1",
      now,
      now,
    ],
  );
  for (const auditId of ["audit_paper_trade_approval_1", "audit_paper_trade_entry_1"]) {
    await execute(
      `INSERT INTO audit_logs
        (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id, risk_decision, operator_decision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auditId,
        auditId.endsWith("approval_1") ? "operator_decision" : "paper_trade_opened",
        auditId.endsWith("approval_1") ? "operator" : "system",
        auditId.endsWith("approval_1") ? "operator:test" : "paper-trading",
        now,
        "paper_trade",
        "paper_trade_1",
        "pass",
        "paper_trade",
      ],
    );
  }
}

async function seedCloseAuditLog() {
  await execute(
    `INSERT INTO audit_logs
      (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id, risk_decision, operator_decision)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "audit_paper_trade_close_1",
      "paper_trade_closed",
      "system",
      "paper-trading",
      "2026-05-06T20:00:00Z",
      "paper_trade",
      "paper_trade_1",
      "pass",
      "paper_trade",
    ],
  );
}

async function persistOpenPaperTrade() {
  await persistPaperTrade(client, {
    id: "paper_trade_1",
    recommendationId: "rec_1",
    accountId: "paper_account_default",
    ticker: "MSFT",
    instrumentType: "stock",
    strategyVersionId: "strategy_earnings_v0",
    operatorApprovalAuditLogId: "audit_paper_trade_approval_1",
    entryAuditLogId: "audit_paper_trade_entry_1",
    thesisSnapshot: "Positive earnings surprise research candidate.",
    entryReason: "Operator approved a simulated long-stock paper trade after risk gates passed.",
    downsideScenario: "Shares reverse below the event gap.",
    invalidationConditions: ["Close below event low"],
    entryType: "market",
    requestedEntryPrice: 410,
    simulatedEntryPrice: 410,
    quantity: 2,
    enteredAt: now,
    stopLoss: 395,
    profitTarget: 435,
    timeStopAt: "2026-05-15T20:00:00Z",
    maxLossAmount: 300,
    accountEquityAtEntry: 100000,
    singleNameExposurePct: 0.82,
    sectorExposurePct: 8,
    correlatedExposurePct: 10,
    dailyLossPctAtEntry: 0.4,
    createdAt: now,
    updatedAt: now,
  });
}

describe("paper trade ledger persistence", () => {
  beforeEach(async () => {
    client = await createLocalClient();
    await runMigrations(client);
  });

  afterEach(() => {
    client.close();
  });

  it("persists an accepted stock paper trade as a paper-only audit-linked ledger row", async () => {
    await seedPaperTradeDependencies();

    await persistOpenPaperTrade();

    const result = await client.execute(
      `SELECT mode, status, live_trading_enabled, broker_execution, risk_pct_of_equity, invalidation_conditions_json
       FROM paper_trades WHERE id = ?`,
      ["paper_trade_1"],
    );
    expect(result.rows[0]).toMatchObject({
      mode: "paper",
      status: "open",
      live_trading_enabled: 0,
      broker_execution: 0,
      risk_pct_of_equity: 0.3,
      invalidation_conditions_json: '["Close below event low"]',
    });
  });

  it("closes an open paper trade with exit audit linkage and lessons learned", async () => {
    await seedPaperTradeDependencies();
    await seedCloseAuditLog();
    await persistOpenPaperTrade();

    await closePersistedPaperTrade(client, {
      id: "paper_trade_1",
      closeAuditLogId: "audit_paper_trade_close_1",
      closedAt: "2026-05-06T20:00:00Z",
      exitPrice: 430,
      exitReason: "Profit target review hit.",
      lessonsLearned: "Follow-through appeared before the time stop.",
      updatedAt: "2026-05-06T20:00:00Z",
    });

    const result = await client.execute(
      `SELECT status, closed_at, exit_price, exit_reason, lessons_learned, exit_audit_log_id
       FROM paper_trades WHERE id = ?`,
      ["paper_trade_1"],
    );
    expect(result.rows[0]).toMatchObject({
      status: "closed",
      closed_at: "2026-05-06T20:00:00Z",
      exit_price: 430,
      exit_reason: "Profit target review hit.",
      lessons_learned: "Follow-through appeared before the time stop.",
      exit_audit_log_id: "audit_paper_trade_close_1",
    });
  });

  it("rejects duplicate closes for the same persisted paper trade", async () => {
    await seedPaperTradeDependencies();
    await seedCloseAuditLog();
    await persistOpenPaperTrade();

    await closePersistedPaperTrade(client, {
      id: "paper_trade_1",
      closeAuditLogId: "audit_paper_trade_close_1",
      closedAt: "2026-05-06T20:00:00Z",
      exitPrice: 430,
      exitReason: "Profit target review hit.",
      lessonsLearned: "Follow-through appeared before the time stop.",
      updatedAt: "2026-05-06T20:00:00Z",
    });

    await expect(
      closePersistedPaperTrade(client, {
        id: "paper_trade_1",
        closeAuditLogId: "audit_paper_trade_close_1",
        closedAt: "2026-05-07T20:00:00Z",
        exitPrice: 431,
        exitReason: "Duplicate close attempt.",
        lessonsLearned: "Should not be recorded twice.",
        updatedAt: "2026-05-07T20:00:00Z",
      }),
    ).rejects.toThrow(/open paper trade/i);
  });

  it("reads persisted paper trades as safe audit-linked read models", async () => {
    await seedPaperTradeDependencies();
    await seedCloseAuditLog();
    await persistOpenPaperTrade();

    await closePersistedPaperTrade(client, {
      id: "paper_trade_1",
      closeAuditLogId: "audit_paper_trade_close_1",
      closedAt: "2026-05-06T20:00:00Z",
      exitPrice: 430,
      exitReason: "Profit target review hit.",
      lessonsLearned: "Follow-through appeared before the time stop.",
      updatedAt: "2026-05-06T20:00:00Z",
    });

    const trades = await listPersistedPaperTrades(client, {
      accountId: "paper_account_default",
      status: "closed",
    });

    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({
      id: "paper_trade_1",
      recommendationId: "rec_1",
      accountId: "paper_account_default",
      mode: "paper",
      status: "closed",
      ticker: "MSFT",
      instrumentType: "stock",
      liveTradingEnabled: false,
      brokerExecution: false,
      invalidationConditions: ["Close below event low"],
      audit: {
        operatorApprovalAuditLogId: "audit_paper_trade_approval_1",
        entryAuditLogId: "audit_paper_trade_entry_1",
        exitAuditLogId: "audit_paper_trade_close_1",
      },
      entry: {
        type: "market",
        requestedPrice: 410,
        simulatedPrice: 410,
        quantity: 2,
        enteredAt: now,
        stopLoss: 395,
        profitTarget: 435,
        timeStopAt: "2026-05-15T20:00:00Z",
      },
      risk: {
        maxLossAmount: 300,
        riskPctOfEquity: 0.3,
        accountEquityAtEntry: 100000,
        singleNameExposurePct: 0.82,
        sectorExposurePct: 8,
        correlatedExposurePct: 10,
        dailyLossPctAtEntry: 0.4,
      },
      outcome: {
        closedAt: "2026-05-06T20:00:00Z",
        exitPrice: 430,
        exitReason: "Profit target review hit.",
        lessonsLearned: "Follow-through appeared before the time stop.",
        realizedPnl: 40,
        realizedReturnPct: 4.878,
      },
    });
  });

  it("returns a single persisted paper trade by ID and null for missing IDs", async () => {
    await seedPaperTradeDependencies();
    await persistOpenPaperTrade();

    await expect(getPersistedPaperTradeById(client, "missing_trade")).resolves.toBeNull();
    await expect(getPersistedPaperTradeById(client, "paper_trade_1")).resolves.toMatchObject({
      id: "paper_trade_1",
      status: "open",
      liveTradingEnabled: false,
      brokerExecution: false,
      outcome: null,
    });
  });

  it("inherits database safety gates when a recommendation is not paper-trade eligible", async () => {
    await seedPaperTradeDependencies("watchlist");

    await expect(
      persistPaperTrade(client, {
        id: "paper_trade_1",
        recommendationId: "rec_1",
        accountId: "paper_account_default",
        ticker: "MSFT",
        instrumentType: "stock",
        strategyVersionId: "strategy_earnings_v0",
        operatorApprovalAuditLogId: "audit_paper_trade_approval_1",
        entryAuditLogId: "audit_paper_trade_entry_1",
        thesisSnapshot: "Positive earnings surprise research candidate.",
        entryReason:
          "Operator approved a simulated long-stock paper trade after risk gates passed.",
        downsideScenario: "Shares reverse below the event gap.",
        invalidationConditions: ["Close below event low"],
        entryType: "market",
        requestedEntryPrice: 410,
        simulatedEntryPrice: 410,
        quantity: 2,
        enteredAt: now,
        stopLoss: 395,
        profitTarget: 435,
        timeStopAt: "2026-05-15T20:00:00Z",
        maxLossAmount: 300,
        accountEquityAtEntry: 100000,
        singleNameExposurePct: 0.82,
        sectorExposurePct: 8,
        correlatedExposurePct: 10,
        dailyLossPctAtEntry: 0.4,
        createdAt: now,
        updatedAt: now,
      }),
    ).rejects.toThrow(/paper-trade eligible recommendation/i);
  });
});
