import type { Client } from "@libsql/client";
import {
  evaluateStockBacktest,
  type BacktestAssumptions,
  type BacktestMetrics,
  type BacktestPromotionGate,
  type BacktestReasonCode,
  type StockBacktestInput,
  type StockBacktestResult,
} from "@stockmarket/backtesting";
import type { SourceCitation, StrategyFamily } from "@stockmarket/core";

export interface StockBacktestRunTradeReadModel {
  id: string;
  sourceTradeId: string;
  ticker: string;
  netReturnPct: number;
  grossReturnPct: number;
  holdingDays: number;
  exitOrder: number;
  createdAt: string;
}

export interface StockBacktestRunReadModel {
  id: string;
  strategyVersionId: string;
  strategyFamily: StrategyFamily;
  strategyVersionLabel: string;
  instrumentType: "stock";
  universe: string;
  period: {
    start: string;
    end: string;
  };
  benchmarkReturnPct: number;
  promotionGate: BacktestPromotionGate;
  reasonCodes: BacktestReasonCode[];
  metrics: BacktestMetrics;
  assumptions: BacktestAssumptions;
  sourceCitations: SourceCitation[];
  dataFreshness: {
    status: "fresh" | "stale" | "partial" | "missing";
    asOf: string;
    notes: string[];
  };
  optionsProxy: false;
  notRecommendation: true;
  trades: StockBacktestRunTradeReadModel[];
  createdAt: string;
  updatedAt: string;
}

export interface ListPersistedStockBacktestRunsFilters {
  strategyVersionId?: string;
  promotionGate?: BacktestPromotionGate;
  limit?: number;
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected ${key} to be a nonempty string.`);
  }
  return value;
}

function readNumber(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Expected ${key} to be a finite number.`);
  }
  return value;
}

function readInteger(row: Record<string, unknown>, key: string): number {
  const value = readNumber(row, key);
  if (!Number.isInteger(value)) {
    throw new Error(`Expected ${key} to be an integer.`);
  }
  return value;
}

function readSafeFalse(row: Record<string, unknown>, key: string): false {
  if (readNumber(row, key) !== 0) {
    throw new Error(`Unsafe stock backtest row has ${key} enabled.`);
  }
  return false;
}

function readSafeTrue(row: Record<string, unknown>, key: string): true {
  if (readNumber(row, key) !== 1) {
    throw new Error(`Unsafe stock backtest row has ${key} disabled.`);
  }
  return true;
}

function parseJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Persisted stock backtest has invalid ${label}.`);
  }
}

function normalizePromotionGate(value: string): BacktestPromotionGate {
  if (value === "ready_for_review" || value === "needs_more_data" || value === "blocked") {
    return value;
  }
  throw new Error(`Unsupported stock backtest promotion gate: ${value}`);
}

function normalizeStrategyFamily(value: string): StrategyFamily {
  if (
    value === "earnings" ||
    value === "momentum" ||
    value === "mean_reversion" ||
    value === "volatility" ||
    value === "options" ||
    value === "news_sentiment" ||
    value === "value_quality" ||
    value === "sector_macro" ||
    value === "portfolio_risk"
  ) {
    return value;
  }
  throw new Error(`Unsupported stock backtest strategy family: ${value}`);
}

function normalizeFreshnessStatus(
  value: string,
): StockBacktestRunReadModel["dataFreshness"]["status"] {
  if (value === "fresh" || value === "stale" || value === "partial" || value === "missing") {
    return value;
  }
  throw new Error(`Unsupported stock backtest freshness status: ${value}`);
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

const stockBacktestRunReadColumns = `
  id, strategy_version_id, strategy_family, strategy_version_label, instrument_type,
  universe, period_start, period_end, benchmark_return_pct, promotion_gate,
  reason_codes_json, metrics_json, assumptions_json, source_citations_json,
  freshness_status, freshness_as_of, freshness_notes_json, trade_count,
  win_rate_pct, max_drawdown_pct, net_return_pct, benchmark_relative_return_pct,
  options_proxy, not_recommendation, created_at, updated_at
`;

function mapStockBacktestRunTradeReadModel(
  row: Record<string, unknown>,
): StockBacktestRunTradeReadModel {
  return {
    id: readString(row, "id"),
    sourceTradeId: readString(row, "source_trade_id"),
    ticker: readString(row, "ticker"),
    netReturnPct: readNumber(row, "net_return_pct"),
    grossReturnPct: readNumber(row, "gross_return_pct"),
    holdingDays: readNumber(row, "holding_days"),
    exitOrder: readInteger(row, "exit_order"),
    createdAt: readString(row, "created_at"),
  };
}

function mapStockBacktestRunReadModel(
  row: Record<string, unknown>,
  trades: StockBacktestRunTradeReadModel[],
): StockBacktestRunReadModel {
  const instrumentType = readString(row, "instrument_type");
  if (instrumentType !== "stock") {
    throw new Error(`Unsupported persisted backtest instrument type: ${instrumentType}`);
  }

  return {
    id: readString(row, "id"),
    strategyVersionId: readString(row, "strategy_version_id"),
    strategyFamily: normalizeStrategyFamily(readString(row, "strategy_family")),
    strategyVersionLabel: readString(row, "strategy_version_label"),
    instrumentType,
    universe: readString(row, "universe"),
    period: {
      start: readString(row, "period_start"),
      end: readString(row, "period_end"),
    },
    benchmarkReturnPct: readNumber(row, "benchmark_return_pct"),
    promotionGate: normalizePromotionGate(readString(row, "promotion_gate")),
    reasonCodes: parseJson<BacktestReasonCode[]>(readString(row, "reason_codes_json"), "reasons"),
    metrics: parseJson<BacktestMetrics>(readString(row, "metrics_json"), "metrics"),
    assumptions: parseJson<BacktestAssumptions>(readString(row, "assumptions_json"), "assumptions"),
    sourceCitations: parseJson<SourceCitation[]>(
      readString(row, "source_citations_json"),
      "source citations",
    ),
    dataFreshness: {
      status: normalizeFreshnessStatus(readString(row, "freshness_status")),
      asOf: readString(row, "freshness_as_of"),
      notes: parseJson<string[]>(readString(row, "freshness_notes_json"), "freshness notes"),
    },
    optionsProxy: readSafeFalse(row, "options_proxy"),
    notRecommendation: readSafeTrue(row, "not_recommendation"),
    trades,
    createdAt: readString(row, "created_at"),
    updatedAt: readString(row, "updated_at"),
  };
}

async function listStockBacktestTrades(
  client: Client,
  backtestRunId: string,
): Promise<StockBacktestRunTradeReadModel[]> {
  const result = await client.execute({
    sql: `SELECT id, source_trade_id, ticker, net_return_pct, gross_return_pct,
        holding_days, exit_order, created_at
      FROM backtest_run_trades
      WHERE backtest_run_id = ?
      ORDER BY exit_order ASC, source_trade_id ASC`,
    args: [backtestRunId],
  });

  return result.rows.map((row) =>
    mapStockBacktestRunTradeReadModel(row as Record<string, unknown>),
  );
}

export async function listPersistedStockBacktestRuns(
  client: Client,
  filters: ListPersistedStockBacktestRunsFilters = {},
): Promise<StockBacktestRunReadModel[]> {
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (filters.strategyVersionId !== undefined) {
    conditions.push("strategy_version_id = ?");
    args.push(filters.strategyVersionId);
  }
  if (filters.promotionGate !== undefined) {
    conditions.push("promotion_gate = ?");
    args.push(filters.promotionGate);
  }

  const safeLimit =
    filters.limit !== undefined && Number.isFinite(filters.limit) && filters.limit > 0
      ? Math.min(Math.floor(filters.limit), 100)
      : 50;
  args.push(safeLimit);

  const result = await client.execute({
    sql: `SELECT ${stockBacktestRunReadColumns}
      FROM backtest_runs
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY updated_at DESC, id ASC
      LIMIT ?`,
    args,
  });

  const readModels: StockBacktestRunReadModel[] = [];
  for (const row of result.rows) {
    const record = row as Record<string, unknown>;
    readModels.push(
      mapStockBacktestRunReadModel(
        record,
        await listStockBacktestTrades(client, readString(record, "id")),
      ),
    );
  }
  return readModels;
}
