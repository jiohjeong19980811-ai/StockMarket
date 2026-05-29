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

function roundedPercent(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function riskPctOfEquity(trade: PersistPaperTradeInput): number {
  const riskPct = (trade.maxLossAmount / trade.accountEquityAtEntry) * 100;
  return Number.isFinite(riskPct) ? roundedPercent(riskPct) : 0;
}

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
