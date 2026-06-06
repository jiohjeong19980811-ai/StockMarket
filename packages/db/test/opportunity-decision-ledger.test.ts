import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createLocalClient,
  getPersistedOpportunityDecisionById,
  listPersistedOpportunityDecisions,
  persistOpportunityDecision,
  runMigrations,
} from "../src/index.js";
import type { Client } from "@libsql/client";
import type { OpportunityDecision } from "@stockmarket/core";

const now = "2026-05-01T12:00:00Z";

let client: Client;

async function execute(sql: string, args: unknown[] = []) {
  return client.execute({ sql, args });
}

async function seedStrategy() {
  await execute(
    `INSERT INTO strategy_definitions
      (id, family, name, description, allowed_instrument_types_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    ["strategy_momentum", "momentum", "Momentum", "Momentum research.", '["stock"]', now],
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

async function seedBacktestRun() {
  await execute(
    `INSERT INTO backtest_runs
      (id, strategy_version_id, strategy_family, strategy_version_label, instrument_type,
       universe, period_start, period_end, benchmark_return_pct, promotion_gate,
       reason_codes_json, metrics_json, assumptions_json, source_citations_json,
       freshness_status, freshness_as_of, freshness_notes_json, trade_count, win_rate_pct,
       max_drawdown_pct, net_return_pct, benchmark_relative_return_pct, options_proxy,
       not_recommendation, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "bt_momentum_1",
      "momentum-v0",
      "momentum",
      "momentum-v0",
      "stock",
      "mock-liquid-large-cap",
      "2026-01-02T14:30:00.000Z",
      "2026-04-30T20:00:00.000Z",
      4,
      "ready_for_review",
      "[]",
      '{"tradeCount":4,"winRatePct":75,"averageReturnPct":4.499,"medianReturnPct":7.2479,"maxDrawdownPct":6.25,"profitFactor":3.8793,"bestTradeReturnPct":9.75,"worstTradeReturnPct":-6.25,"averageHoldingDays":7.2292,"grossReturnPct":4.75,"netReturnPct":18.2815,"benchmarkRelativeReturnPct":14.2815,"costSensitivity":[{"multiplier":1,"netReturnPct":18.2815,"averageReturnPct":4.499,"profitFactor":3.8793},{"multiplier":2,"netReturnPct":17.1444,"averageReturnPct":4.2479,"profitFactor":3.6141},{"multiplier":3,"netReturnPct":16.0154,"averageReturnPct":3.9969,"profitFactor":3.3685}]}',
      '{"slippageBps":5,"spreadBps":10,"feePerTrade":1,"minTradesForReview":4,"minAverageDailyDollarVolume":20000000,"pointInTimeData":true,"survivorshipBiasControl":true,"lookaheadBiasControl":true,"rejectedParameterSets":2,"costStressMultipliers":[1,2,3],"notes":["Mock run uses adjusted close values and conservative cost stress."]}',
      '[{"title":"Mock adjusted OHLCV history","url":"https://example.test/mock/prices","source":"mock-provider","publishedAt":"2026-04-30T19:55:00.000Z","retrievedAt":"2026-04-30T20:00:00.000Z"}]',
      "fresh",
      "2026-04-30T20:00:00.000Z",
      "[]",
      4,
      75,
      6.25,
      18.2815,
      14.2815,
      0,
      1,
      now,
      now,
    ],
  );

  for (let index = 0; index < 4; index += 1) {
    await execute(
      `INSERT INTO backtest_run_trades
        (id, backtest_run_id, source_trade_id, ticker, net_return_pct,
         gross_return_pct, holding_days, exit_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `bt_momentum_1_trade_${index + 1}`,
        "bt_momentum_1",
        `trade-${index + 1}`,
        "MSFT",
        index === 1 ? -6.25 : 9.75,
        index === 1 ? -6 : 10,
        7,
        index,
        now,
      ],
    );
  }
}

async function seedPaperTradeEligibleRecommendation() {
  await seedStrategy();
  await seedBacktestRun();
  await execute(
    `INSERT INTO audit_logs
      (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id,
       risk_decision, operator_decision, operator_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "audit_recommendation_1",
      "daily_opportunity_generated",
      "system",
      "daily-opportunity-generator",
      now,
      "recommendation",
      "rec_1",
      "pass",
      "paper_trade",
      "Seeded recommendation for opportunity decision tests.",
    ],
  );
  await execute(
    `INSERT INTO recommendations
      (id, ticker, instrument_type, strategy_version_id, decision, evidence_status,
       evidence_gate, thesis, bull_case, bear_case, downside_scenario,
       invalidation_conditions_json, why_system_might_be_wrong,
       primary_citation_title, primary_citation_url, primary_citation_source,
       primary_citation_published_at, primary_citation_retrieved_at, freshness_status,
       freshness_as_of, freshness_notes_json, risk_score, confidence_score, liquidity_score,
       liquidity_decision, risk_decision, backtest_run_id, operator_audit_log_id,
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "rec_1",
      "MSFT",
      "stock",
      "momentum-v0",
      "paper_trade",
      "paper_trade_eligible",
      "verified",
      "Mock momentum candidate with verified stock backtest evidence.",
      "Mock trend evidence and liquidity support a paper-only entry test.",
      "Trend may reverse before a paper entry can validate the thesis.",
      "Shares close below the mock breakout level.",
      '["Close below mock breakout level"]',
      "Mock data may not represent current market behavior.",
      "Mock daily price history",
      "https://example.test/mock/msft/prices",
      "mock-provider",
      "2026-05-01T11:30:00Z",
      now,
      "fresh",
      now,
      "[]",
      86,
      81,
      86,
      "pass",
      "pass",
      "bt_momentum_1",
      "audit_recommendation_1",
      now,
      now,
    ],
  );
}

function decisionInput(decision: OpportunityDecision) {
  return {
    id: `decision_${decision}`,
    recommendationId: "rec_1",
    auditLogId: `audit_decision_${decision}`,
    decidedBy: "operator:test",
    decidedAt: now,
    decision,
    riskDecision: decision === "paper_trade" ? "pass" : decision,
    reasonCodes: decision === "paper_trade" ? ["operator_accepted"] : [`operator_${decision}`],
    notes: `Operator recorded ${decision} during paper-only review.`,
    createdAt: now,
  };
}

describe("opportunity decision ledger persistence", () => {
  beforeEach(async () => {
    client = await createLocalClient();
    await runMigrations(client);
  });

  afterEach(() => {
    client.close();
  });

  it("persists paper-only opportunity decisions with audit linkage and recommendation context", async () => {
    await seedPaperTradeEligibleRecommendation();

    for (const decision of ["watchlist", "paper_trade", "avoid", "needs_more_data"] as const) {
      await persistOpportunityDecision(client, decisionInput(decision));
    }

    const decisions = await listPersistedOpportunityDecisions(client, {
      recommendationId: "rec_1",
    });

    expect(decisions).toHaveLength(4);
    expect(decisions.map((decision) => decision.operatorDecision)).toEqual([
      "needs_more_data",
      "avoid",
      "paper_trade",
      "watchlist",
    ]);
    expect(decisions[0]).toMatchObject({
      id: "decision_needs_more_data",
      recommendationId: "rec_1",
      ticker: "MSFT",
      instrumentType: "stock",
      strategyVersionId: "momentum-v0",
      mode: "paper",
      notRecommendation: true,
      liveTradingEnabled: false,
      brokerExecution: false,
      operatorDecision: "needs_more_data",
      reasonCodes: ["operator_needs_more_data"],
      audit: {
        auditLogId: "audit_decision_needs_more_data",
        eventType: "operator_decision",
        actorType: "operator",
        actorId: "operator:test",
        occurredAt: now,
        subjectType: "recommendation",
        subjectId: "rec_1",
        riskDecision: "needs_more_data",
        operatorDecision: "needs_more_data",
        operatorNotes: "Operator recorded needs_more_data during paper-only review.",
      },
      scores: {
        risk: 86,
        confidence: 81,
        liquidity: 86,
      },
      evidenceGate: "verified",
      downsideScenario: "Shares close below the mock breakout level.",
      invalidationConditions: ["Close below mock breakout level"],
      dataFreshness: {
        status: "fresh",
        asOf: now,
        notes: [],
      },
    });
  });

  it("reads a single persisted opportunity decision by ID and returns null for missing IDs", async () => {
    await seedPaperTradeEligibleRecommendation();
    await persistOpportunityDecision(client, decisionInput("watchlist"));

    await expect(
      getPersistedOpportunityDecisionById(client, "missing_decision"),
    ).resolves.toBeNull();
    await expect(
      getPersistedOpportunityDecisionById(client, "decision_watchlist"),
    ).resolves.toMatchObject({
      id: "decision_watchlist",
      operatorDecision: "watchlist",
      liveTradingEnabled: false,
      brokerExecution: false,
      notRecommendation: true,
    });
  });

  it("rejects persisted opportunity decisions without reason codes", async () => {
    await seedPaperTradeEligibleRecommendation();

    await expect(
      persistOpportunityDecision(client, {
        ...decisionInput("watchlist"),
        id: "decision_empty_reason_codes",
        auditLogId: "audit_decision_empty_reason_codes",
        reasonCodes: [],
      }),
    ).rejects.toThrow();
  });

  it("inherits database safety gates for unsafe direct inserts", async () => {
    await seedPaperTradeEligibleRecommendation();

    await expect(
      execute(
        `INSERT INTO opportunity_decisions
          (id, recommendation_id, audit_log_id, mode, operator_decision,
           reason_codes_json, live_trading_enabled, broker_execution,
           not_recommendation, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "unsafe_decision",
          "rec_1",
          "missing_audit",
          "paper",
          "watchlist",
          "[]",
          1,
          0,
          1,
          now,
          now,
        ],
      ),
    ).rejects.toThrow();
  });
});
