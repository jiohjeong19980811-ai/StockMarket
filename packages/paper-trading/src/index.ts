import { isPaperTradeEligible, type InstrumentType, type Recommendation } from "@stockmarket/core";

export const paperTradingPackageStatus = "paper-trading-contracts-active" as const;

export interface PaperAccountSnapshot {
  paperEquity: number;
  currentDailyLossPct: number;
  singleNameExposurePct: number;
  sectorExposurePct: number;
  correlatedExposurePct: number;
  aggregateOptionsPremiumPct: number;
}

export interface PaperTradeEntryRequest {
  requestedAt: string;
  quantity: number;
  entryPrice: number;
  stopLossPrice: number;
  profitTargetPrice: number;
  maxLoss: number;
  thesisSnapshot: string;
  stopRule: string;
  targetRule: string;
  timeStop: string;
}

export interface PaperTradeOperatorApproval {
  approvedBy: string;
  approvedAt: string;
  auditLogId: string;
  notes: string;
}

export interface PaperTradeRequest {
  recommendation: Recommendation;
  account: PaperAccountSnapshot;
  entry: PaperTradeEntryRequest;
  operatorApproval: PaperTradeOperatorApproval;
}

export type PaperTradeRejectReason =
  | "recommendation_not_paper_trade_eligible"
  | "broker_execution_fields_prohibited"
  | "operator_approval_missing"
  | "entry_rules_missing"
  | "invalid_account_equity"
  | "invalid_entry_price_or_quantity"
  | "invalid_exit_prices"
  | "invalid_max_loss"
  | "position_risk_limit_exceeded"
  | "single_name_exposure_limit_exceeded"
  | "sector_exposure_limit_exceeded"
  | "correlated_exposure_limit_exceeded"
  | "daily_loss_limit_exceeded"
  | "options_paper_trading_deferred"
  | "options_premium_limit_exceeded";

export interface PaperTradeRiskSnapshot {
  maxLoss: number;
  riskPctOfEquity: number;
  accountEquityAtOpen: number;
  singleNameExposurePct: number;
  sectorExposurePct: number;
  correlatedExposurePct: number;
  currentDailyLossPct: number;
  aggregateOptionsPremiumPct: number;
}

export interface PaperTradeAuditSnapshot {
  openedBy: string;
  openedAt: string;
  auditLogId: string;
  recommendationAuditLogId: string;
  notes: string;
}

export interface PaperTrade {
  id: string;
  mode: "paper";
  liveTradingEnabled: false;
  brokerExecution: false;
  recommendationId: string;
  ticker: string;
  instrumentType: InstrumentType;
  strategyFamily: Recommendation["strategyFamily"];
  strategyVersion: string;
  status: "open";
  openedAt: string;
  quantity: number;
  entryPrice: number;
  stopLossPrice: number;
  profitTargetPrice: number;
  thesisSnapshot: string;
  stopRule: string;
  targetRule: string;
  timeStop: string;
  risk: PaperTradeRiskSnapshot;
  audit: PaperTradeAuditSnapshot;
  lessons: string[];
}

export interface PaperTradeExitRequest {
  exitedAt: string;
  exitPrice: number;
  priceTimestamp: string;
  exitReason: string;
  lessonsLearned: string;
  auditLogId: string;
}

export type PaperTradeCloseRejectReason =
  | "trade_not_open"
  | "broker_execution_fields_prohibited"
  | "exit_details_missing"
  | "invalid_exit_price";

export interface PaperTradeExitAuditSnapshot {
  auditLogId: string;
  exitedAt: string;
  priceTimestamp: string;
}

export interface PaperTradeClosed extends Omit<PaperTrade, "status" | "lessons"> {
  status: "closed";
  closedAt: string;
  exitPrice: number;
  exitReason: string;
  realizedPnl: number;
  realizedReturnPct: number;
  lessons: string[];
  exitAudit: PaperTradeExitAuditSnapshot;
}

export type PaperTradeLifecycle = PaperTrade | PaperTradeClosed;

export interface PaperTradeAcceptedDecision {
  status: "accepted";
  reasonCodes: [];
  trade: PaperTrade;
}

export interface PaperTradeRejectedDecision {
  status: "rejected";
  reasonCodes: PaperTradeRejectReason[];
  trade?: undefined;
}

export type PaperTradeDecision = PaperTradeAcceptedDecision | PaperTradeRejectedDecision;

export interface PaperTradeCloseAcceptedDecision {
  status: "accepted";
  reasonCodes: [];
  trade: PaperTradeClosed;
}

export interface PaperTradeCloseRejectedDecision {
  status: "rejected";
  reasonCodes: PaperTradeCloseRejectReason[];
  trade?: undefined;
}

export type PaperTradeCloseDecision =
  | PaperTradeCloseAcceptedDecision
  | PaperTradeCloseRejectedDecision;

const maximumPositionRiskPct = 0.5;
const maximumSingleNameExposurePct = 5;
const maximumSectorExposurePct = 20;
const maximumCorrelatedExposurePct = 15;
const maximumDailyLossPct = 2;
const maximumAggregateOptionsPremiumPct = 3;

const prohibitedBrokerFields = [
  "brokerOrderId",
  "brokerAccountId",
  "externalOrderId",
  "liveOrderId",
  "providerOrderId",
  "executionVenue",
] as const;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function roundedPercent(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function isOptionsInstrument(instrumentType: InstrumentType): boolean {
  return (
    instrumentType === "long_call" ||
    instrumentType === "long_put" ||
    instrumentType === "debit_spread"
  );
}

function hasProhibitedBrokerFields(request: unknown): boolean {
  const candidate = request as Record<string, unknown>;
  return prohibitedBrokerFields.some((field) => field in candidate);
}

function hasOperatorApproval(approval: PaperTradeOperatorApproval): boolean {
  return (
    hasText(approval.approvedBy) &&
    hasText(approval.approvedAt) &&
    hasText(approval.auditLogId) &&
    hasText(approval.notes)
  );
}

function hasEntryRules(entry: PaperTradeEntryRequest): boolean {
  return (
    hasText(entry.thesisSnapshot) &&
    hasText(entry.stopRule) &&
    hasText(entry.targetRule) &&
    hasText(entry.timeStop)
  );
}

function hasValidExitPrices(entry: PaperTradeEntryRequest): boolean {
  return (
    isPositiveNumber(entry.stopLossPrice) &&
    isPositiveNumber(entry.profitTargetPrice) &&
    isPositiveNumber(entry.entryPrice) &&
    entry.stopLossPrice < entry.entryPrice &&
    entry.profitTargetPrice > entry.entryPrice
  );
}

function hasExitEvidence(exit: PaperTradeExitRequest): boolean {
  return (
    hasText(exit.exitedAt) &&
    hasText(exit.priceTimestamp) &&
    hasText(exit.exitReason) &&
    hasText(exit.lessonsLearned) &&
    hasText(exit.auditLogId)
  );
}

function roundedCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildPaperTradeId(recommendationId: string, requestedAt: string): string {
  const compactTimestamp = requestedAt.replace(/[^0-9A-Za-z]/g, "");
  return `paper_${recommendationId}_${compactTimestamp}`;
}

export function createPaperTrade(request: PaperTradeRequest): PaperTradeDecision {
  const reasons: PaperTradeRejectReason[] = [];
  const { recommendation, account, entry, operatorApproval } = request;
  const riskPctOfEquity = isPositiveNumber(account.paperEquity)
    ? roundedPercent((entry.maxLoss / account.paperEquity) * 100)
    : 0;

  if (!isPaperTradeEligible(recommendation)) {
    reasons.push("recommendation_not_paper_trade_eligible");
  }
  if (hasProhibitedBrokerFields(request)) {
    reasons.push("broker_execution_fields_prohibited");
  }
  if (!hasOperatorApproval(operatorApproval)) {
    reasons.push("operator_approval_missing");
  }
  if (!hasEntryRules(entry)) {
    reasons.push("entry_rules_missing");
  }
  if (!isPositiveNumber(account.paperEquity)) {
    reasons.push("invalid_account_equity");
  }
  if (!isPositiveNumber(entry.entryPrice) || !isPositiveNumber(entry.quantity)) {
    reasons.push("invalid_entry_price_or_quantity");
  }
  if (!hasValidExitPrices(entry)) {
    reasons.push("invalid_exit_prices");
  }
  if (!isPositiveNumber(entry.maxLoss)) {
    reasons.push("invalid_max_loss");
  }
  if (riskPctOfEquity > maximumPositionRiskPct) {
    reasons.push("position_risk_limit_exceeded");
  }
  if (account.singleNameExposurePct > maximumSingleNameExposurePct) {
    reasons.push("single_name_exposure_limit_exceeded");
  }
  if (account.sectorExposurePct > maximumSectorExposurePct) {
    reasons.push("sector_exposure_limit_exceeded");
  }
  if (account.correlatedExposurePct > maximumCorrelatedExposurePct) {
    reasons.push("correlated_exposure_limit_exceeded");
  }
  if (account.currentDailyLossPct > maximumDailyLossPct) {
    reasons.push("daily_loss_limit_exceeded");
  }
  if (isOptionsInstrument(recommendation.instrumentType)) {
    reasons.push("options_paper_trading_deferred");
    if (account.aggregateOptionsPremiumPct + riskPctOfEquity > maximumAggregateOptionsPremiumPct) {
      reasons.push("options_premium_limit_exceeded");
    }
  }

  if (reasons.length > 0) {
    return {
      status: "rejected",
      reasonCodes: [...new Set(reasons)],
    };
  }

  return {
    status: "accepted",
    reasonCodes: [],
    trade: {
      id: buildPaperTradeId(recommendation.id, entry.requestedAt),
      mode: "paper",
      liveTradingEnabled: false,
      brokerExecution: false,
      recommendationId: recommendation.id,
      ticker: recommendation.ticker,
      instrumentType: recommendation.instrumentType,
      strategyFamily: recommendation.strategyFamily,
      strategyVersion: recommendation.strategyVersion,
      status: "open",
      openedAt: entry.requestedAt,
      quantity: entry.quantity,
      entryPrice: entry.entryPrice,
      stopLossPrice: entry.stopLossPrice,
      profitTargetPrice: entry.profitTargetPrice,
      thesisSnapshot: entry.thesisSnapshot,
      stopRule: entry.stopRule,
      targetRule: entry.targetRule,
      timeStop: entry.timeStop,
      risk: {
        maxLoss: entry.maxLoss,
        riskPctOfEquity,
        accountEquityAtOpen: account.paperEquity,
        singleNameExposurePct: account.singleNameExposurePct,
        sectorExposurePct: account.sectorExposurePct,
        correlatedExposurePct: account.correlatedExposurePct,
        currentDailyLossPct: account.currentDailyLossPct,
        aggregateOptionsPremiumPct: account.aggregateOptionsPremiumPct,
      },
      audit: {
        openedBy: operatorApproval.approvedBy,
        openedAt: operatorApproval.approvedAt,
        auditLogId: operatorApproval.auditLogId,
        recommendationAuditLogId: recommendation.operatorDecision.auditLogId,
        notes: operatorApproval.notes,
      },
      lessons: [],
    },
  };
}

export function closePaperTrade(
  trade: PaperTradeLifecycle,
  exit: PaperTradeExitRequest,
): PaperTradeCloseDecision {
  const reasons: PaperTradeCloseRejectReason[] = [];

  if (trade.status !== "open") {
    reasons.push("trade_not_open");
  }
  if (hasProhibitedBrokerFields(exit)) {
    reasons.push("broker_execution_fields_prohibited");
  }
  if (!hasExitEvidence(exit)) {
    reasons.push("exit_details_missing");
  }
  if (!isPositiveNumber(exit.exitPrice)) {
    reasons.push("invalid_exit_price");
  }

  if (reasons.length > 0) {
    return {
      status: "rejected",
      reasonCodes: [...new Set(reasons)],
    };
  }

  const realizedPnl = roundedCurrency((exit.exitPrice - trade.entryPrice) * trade.quantity);
  const realizedReturnPct = roundedPercent(
    ((exit.exitPrice - trade.entryPrice) / trade.entryPrice) * 100,
  );

  return {
    status: "accepted",
    reasonCodes: [],
    trade: {
      ...trade,
      status: "closed",
      closedAt: exit.exitedAt,
      exitPrice: exit.exitPrice,
      exitReason: exit.exitReason,
      realizedPnl,
      realizedReturnPct,
      lessons: [...trade.lessons, exit.lessonsLearned],
      exitAudit: {
        auditLogId: exit.auditLogId,
        exitedAt: exit.exitedAt,
        priceTimestamp: exit.priceTimestamp,
      },
    },
  };
}
