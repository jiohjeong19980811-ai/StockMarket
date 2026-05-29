import type { Client } from "@libsql/client";
import {
  evaluateStockBacktest,
  type StockBacktestInput,
  type StockBacktestResult,
} from "@stockmarket/backtesting";

function json(value: unknown): string {
  return JSON.stringify(value);
}

function assertFiniteIsoTimestamp(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} must be a valid ISO timestamp.`);
  }
}

function assertMatchingBacktestInput(input: StockBacktestInput, result: StockBacktestResult): void {
  if (input.id !== result.id) {
    throw new Error("Backtest result ID must match the input ID.");
  }
  if (input.strategyFamily !== result.strategyFamily) {
    throw new Error("Backtest result strategy family must match the input strategy family.");
  }
  if (input.strategyVersionId !== result.strategyVersionId) {
    throw new Error("Backtest result strategy version must match the input strategy version.");
  }
  if (input.instrumentType !== result.instrumentType) {
    throw new Error("Backtest result instrument type must match the input instrument type.");
  }
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function assertResultMatchesEvaluatedInput(
  input: StockBacktestInput,
  result: StockBacktestResult,
): void {
  const expected = evaluateStockBacktest(input);
  if (canonicalJson(expected) !== canonicalJson(result)) {
    throw new Error("Backtest result must match the evaluated input snapshot.");
  }
}

export async function persistStockBacktestRun(
  client: Client,
  input: StockBacktestInput,
  result: StockBacktestResult,
  persistedAt: string,
): Promise<StockBacktestResult> {
  if (input.instrumentType !== "stock" || result.instrumentType !== "stock") {
    throw new Error("Only stock backtests can be persisted in MVP.");
  }
  if (input.optionsProxy === true || input.strategyFamily === "options") {
    throw new Error("Options proxy backtests cannot be persisted as stock evidence.");
  }
  if (result.notRecommendation !== true) {
    throw new Error("Backtest persistence requires notRecommendation evidence.");
  }
  assertMatchingBacktestInput(input, result);
  assertResultMatchesEvaluatedInput(input, result);
  assertFiniteIsoTimestamp(persistedAt, "persistedAt");

  const runArgs = [
    result.id,
    input.strategyVersionId,
    input.strategyFamily,
    result.strategyVersionId,
    result.instrumentType,
    input.universe,
    input.period.start,
    input.period.end,
    input.benchmarkReturnPct,
    result.promotionGate,
    json(result.reasonCodes),
    json(result.metrics),
    json(result.assumptions),
    json(result.sourceCitations),
    result.dataFreshness.status,
    result.dataFreshness.asOf,
    json(result.dataFreshness.notes),
    result.metrics.tradeCount,
    result.metrics.winRatePct,
    result.metrics.maxDrawdownPct,
    result.metrics.netReturnPct,
    result.metrics.benchmarkRelativeReturnPct,
    0,
    1,
    persistedAt,
    persistedAt,
  ];

  await client.batch(
    [
      {
        sql: `INSERT INTO backtest_runs (
          id, strategy_version_id, strategy_family, strategy_version_label,
          instrument_type, universe, period_start, period_end,
          benchmark_return_pct, promotion_gate, reason_codes_json,
          metrics_json, assumptions_json, source_citations_json,
          freshness_status, freshness_as_of, freshness_notes_json,
          trade_count, win_rate_pct, max_drawdown_pct, net_return_pct,
          benchmark_relative_return_pct, options_proxy, not_recommendation,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: runArgs,
      },
      ...result.trades.map((trade, index) => ({
        sql: `INSERT INTO backtest_run_trades (
          id, backtest_run_id, source_trade_id, ticker,
          net_return_pct, gross_return_pct, holding_days, exit_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `${result.id}_${trade.id}`,
          result.id,
          trade.id,
          trade.ticker,
          trade.netReturnPct,
          trade.grossReturnPct,
          trade.holdingDays,
          index,
          persistedAt,
        ],
      })),
    ],
    "write",
  );

  return result;
}
