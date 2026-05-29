import type { Client } from "@libsql/client";

export interface PersistPaperTradeInput {
  id: string;
  recommendationId: string;
  accountId: string;
  status?: "open" | "closed" | "cancelled";
  ticker: string;
  instrumentType: "stock";
  strategyVersionId: string;
  operatorApprovalAuditLogId: string;
  entryAuditLogId: string;
  thesisSnapshot: string;
  entryReason: string;
  downsideScenario: string;
  invalidationConditions: string[];
  entryType: "market" | "limit";
  requestedEntryPrice: number;
  simulatedEntryPrice: number;
  quantity: number;
  enteredAt: string;
  stopLoss: number;
  profitTarget: number;
  timeStopAt: string;
  maxLossAmount: number;
  accountEquityAtEntry: number;
  singleNameExposurePct: number;
  sectorExposurePct: number;
  correlatedExposurePct: number;
  dailyLossPctAtEntry: number;
  closedAt?: string | null;
  exitPrice?: number | null;
  exitReason?: string | null;
  lessonsLearned?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClosePersistedPaperTradeInput {
  id: string;
  closeAuditLogId: string;
  closedAt: string;
  exitPrice: number;
  exitReason: string;
  lessonsLearned: string;
  updatedAt: string;
}

export interface PaperTradeReadModel {
  id: string;
  recommendationId: string;
  accountId: string;
  mode: "paper";
  status: "open" | "closed" | "cancelled";
  ticker: string;
  instrumentType: "stock";
  strategyVersionId: string;
  thesisSnapshot: string;
  entryReason: string;
  downsideScenario: string;
  invalidationConditions: string[];
  liveTradingEnabled: false;
  brokerExecution: false;
  audit: {
    operatorApprovalAuditLogId: string;
    entryAuditLogId: string;
    exitAuditLogId: string | null;
  };
  entry: {
    type: "market" | "limit";
    requestedPrice: number;
    simulatedPrice: number;
    quantity: number;
    enteredAt: string;
    stopLoss: number;
    profitTarget: number;
    timeStopAt: string;
  };
  risk: {
    maxLossAmount: number;
    riskPctOfEquity: number;
    accountEquityAtEntry: number;
    singleNameExposurePct: number;
    sectorExposurePct: number;
    correlatedExposurePct: number;
    dailyLossPctAtEntry: number;
  };
  outcome: {
    closedAt: string;
    exitPrice: number;
    exitReason: string;
    lessonsLearned: string;
    realizedPnl: number;
    realizedReturnPct: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListPersistedPaperTradesFilters {
  accountId?: string;
  status?: PaperTradeReadModel["status"];
  ticker?: string;
  limit?: number;
}

function roundedPercent(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function roundedCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function riskPctOfEquity(trade: PersistPaperTradeInput): number {
  const riskPct = (trade.maxLossAmount / trade.accountEquityAtEntry) * 100;
  return Number.isFinite(riskPct) ? roundedPercent(riskPct) : 0;
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected ${key} to be a nonempty string.`);
  }
  return value;
}

function readOptionalString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`Expected ${key} to be a string or null.`);
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

function readOptionalNumber(row: Record<string, unknown>, key: string): number | null {
  const value = row[key];
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Expected ${key} to be a finite number or null.`);
  }
  return value;
}

function readSafeFalse(row: Record<string, unknown>, key: string): false {
  if (readNumber(row, key) !== 0) {
    throw new Error(`Unsafe paper-trade row has ${key} enabled.`);
  }
  return false;
}

function parseInvalidationConditions(value: string): string[] {
  const parsed = JSON.parse(value) as unknown;
  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    parsed.some((item) => typeof item !== "string" || item.length === 0)
  ) {
    throw new Error("Persisted paper trade has invalid invalidation conditions.");
  }
  return parsed;
}

function normalizeStatus(value: string): PaperTradeReadModel["status"] {
  if (value === "open" || value === "closed" || value === "cancelled") {
    return value;
  }
  throw new Error(`Unsupported paper-trade status: ${value}`);
}

function normalizeEntryType(value: string): PaperTradeReadModel["entry"]["type"] {
  if (value === "market" || value === "limit") {
    return value;
  }
  throw new Error(`Unsupported paper-trade entry type: ${value}`);
}

function mapPaperTradeReadModel(row: Record<string, unknown>): PaperTradeReadModel {
  const mode = readString(row, "mode");
  if (mode !== "paper") {
    throw new Error(`Unsupported persisted paper-trade mode: ${mode}`);
  }

  const instrumentType = readString(row, "instrument_type");
  if (instrumentType !== "stock") {
    throw new Error(`Unsupported persisted paper-trade instrument type: ${instrumentType}`);
  }

  const status = normalizeStatus(readString(row, "status"));
  const simulatedEntryPrice = readNumber(row, "simulated_entry_price");
  const quantity = readNumber(row, "quantity");
  const exitPrice = readOptionalNumber(row, "exit_price");

  const outcome =
    status === "closed"
      ? {
          closedAt: readString(row, "closed_at"),
          exitPrice: exitPrice ?? readNumber(row, "exit_price"),
          exitReason: readString(row, "exit_reason"),
          lessonsLearned: readString(row, "lessons_learned"),
          realizedPnl: roundedCurrency(((exitPrice ?? 0) - simulatedEntryPrice) * quantity),
          realizedReturnPct: roundedPercent(
            (((exitPrice ?? 0) - simulatedEntryPrice) / simulatedEntryPrice) * 100,
          ),
        }
      : null;

  return {
    id: readString(row, "id"),
    recommendationId: readString(row, "recommendation_id"),
    accountId: readString(row, "account_id"),
    mode,
    status,
    ticker: readString(row, "ticker"),
    instrumentType,
    strategyVersionId: readString(row, "strategy_version_id"),
    thesisSnapshot: readString(row, "thesis_snapshot"),
    entryReason: readString(row, "entry_reason"),
    downsideScenario: readString(row, "downside_scenario"),
    invalidationConditions: parseInvalidationConditions(
      readString(row, "invalidation_conditions_json"),
    ),
    liveTradingEnabled: readSafeFalse(row, "live_trading_enabled"),
    brokerExecution: readSafeFalse(row, "broker_execution"),
    audit: {
      operatorApprovalAuditLogId: readString(row, "operator_approval_audit_log_id"),
      entryAuditLogId: readString(row, "entry_audit_log_id"),
      exitAuditLogId: readOptionalString(row, "exit_audit_log_id"),
    },
    entry: {
      type: normalizeEntryType(readString(row, "entry_type")),
      requestedPrice: readNumber(row, "requested_entry_price"),
      simulatedPrice: simulatedEntryPrice,
      quantity,
      enteredAt: readString(row, "entered_at"),
      stopLoss: readNumber(row, "stop_loss"),
      profitTarget: readNumber(row, "profit_target"),
      timeStopAt: readString(row, "time_stop_at"),
    },
    risk: {
      maxLossAmount: readNumber(row, "max_loss_amount"),
      riskPctOfEquity: readNumber(row, "risk_pct_of_equity"),
      accountEquityAtEntry: readNumber(row, "account_equity_at_entry"),
      singleNameExposurePct: readNumber(row, "single_name_exposure_pct"),
      sectorExposurePct: readNumber(row, "sector_exposure_pct"),
      correlatedExposurePct: readNumber(row, "correlated_exposure_pct"),
      dailyLossPctAtEntry: readNumber(row, "daily_loss_pct_at_entry"),
    },
    outcome,
    createdAt: readString(row, "created_at"),
    updatedAt: readString(row, "updated_at"),
  };
}

const paperTradeReadColumns = `
  id, recommendation_id, account_id, mode, status, ticker, instrument_type,
  strategy_version_id, operator_approval_audit_log_id, entry_audit_log_id,
  exit_audit_log_id, thesis_snapshot, entry_reason, downside_scenario,
  invalidation_conditions_json, entry_type, requested_entry_price,
  simulated_entry_price, quantity, entered_at, stop_loss, profit_target,
  time_stop_at, max_loss_amount, risk_pct_of_equity, account_equity_at_entry,
  single_name_exposure_pct, sector_exposure_pct, correlated_exposure_pct,
  daily_loss_pct_at_entry, live_trading_enabled, broker_execution, closed_at,
  exit_price, exit_reason, lessons_learned, created_at, updated_at
`;

export async function persistPaperTrade(
  client: Client,
  trade: PersistPaperTradeInput,
): Promise<void> {
  const computedRiskPctOfEquity = riskPctOfEquity(trade);

  await client.execute({
    sql: `INSERT INTO paper_trades
      (id, recommendation_id, account_id, mode, status, ticker, instrument_type,
       strategy_version_id, operator_approval_audit_log_id, entry_audit_log_id,
       thesis_snapshot, entry_reason, downside_scenario, invalidation_conditions_json,
       entry_type, requested_entry_price, simulated_entry_price, quantity, entered_at,
       stop_loss, profit_target, time_stop_at, max_loss_amount, risk_pct_of_equity,
       account_equity_at_entry, single_name_exposure_pct, sector_exposure_pct,
       correlated_exposure_pct, daily_loss_pct_at_entry, live_trading_enabled,
       broker_execution, closed_at, exit_price, exit_reason, lessons_learned,
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      trade.id,
      trade.recommendationId,
      trade.accountId,
      "paper",
      trade.status ?? "open",
      trade.ticker,
      trade.instrumentType,
      trade.strategyVersionId,
      trade.operatorApprovalAuditLogId,
      trade.entryAuditLogId,
      trade.thesisSnapshot,
      trade.entryReason,
      trade.downsideScenario,
      JSON.stringify(trade.invalidationConditions),
      trade.entryType,
      trade.requestedEntryPrice,
      trade.simulatedEntryPrice,
      trade.quantity,
      trade.enteredAt,
      trade.stopLoss,
      trade.profitTarget,
      trade.timeStopAt,
      trade.maxLossAmount,
      computedRiskPctOfEquity,
      trade.accountEquityAtEntry,
      trade.singleNameExposurePct,
      trade.sectorExposurePct,
      trade.correlatedExposurePct,
      trade.dailyLossPctAtEntry,
      0,
      0,
      trade.closedAt ?? null,
      trade.exitPrice ?? null,
      trade.exitReason ?? null,
      trade.lessonsLearned ?? null,
      trade.createdAt,
      trade.updatedAt,
    ],
  });
}

export async function closePersistedPaperTrade(
  client: Client,
  close: ClosePersistedPaperTradeInput,
): Promise<void> {
  const result = await client.execute({
    sql: `UPDATE paper_trades
      SET status = 'closed',
        exit_audit_log_id = ?,
        closed_at = ?,
        exit_price = ?,
        exit_reason = ?,
        lessons_learned = ?,
        updated_at = ?
      WHERE id = ? AND status = 'open'`,
    args: [
      close.closeAuditLogId,
      close.closedAt,
      close.exitPrice,
      close.exitReason,
      close.lessonsLearned,
      close.updatedAt,
      close.id,
    ],
  });

  if (result.rowsAffected !== 1) {
    throw new Error(`Could not close open paper trade ${close.id}.`);
  }
}

export async function listPersistedPaperTrades(
  client: Client,
  filters: ListPersistedPaperTradesFilters = {},
): Promise<PaperTradeReadModel[]> {
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (filters.accountId !== undefined) {
    conditions.push("account_id = ?");
    args.push(filters.accountId);
  }
  if (filters.status !== undefined) {
    conditions.push("status = ?");
    args.push(filters.status);
  }
  if (filters.ticker !== undefined) {
    conditions.push("ticker = ?");
    args.push(filters.ticker);
  }

  const safeLimit =
    filters.limit !== undefined && Number.isFinite(filters.limit) && filters.limit > 0
      ? Math.min(Math.floor(filters.limit), 100)
      : 50;
  args.push(safeLimit);

  const result = await client.execute({
    sql: `SELECT ${paperTradeReadColumns}
      FROM paper_trades
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY entered_at DESC, id ASC
      LIMIT ?`,
    args,
  });

  return result.rows.map((row) => mapPaperTradeReadModel(row as Record<string, unknown>));
}

export async function getPersistedPaperTradeById(
  client: Client,
  id: string,
): Promise<PaperTradeReadModel | null> {
  const result = await client.execute({
    sql: `SELECT ${paperTradeReadColumns}
      FROM paper_trades
      WHERE id = ?
      LIMIT 1`,
    args: [id],
  });
  const row = result.rows[0];
  return row === undefined ? null : mapPaperTradeReadModel(row as Record<string, unknown>);
}
