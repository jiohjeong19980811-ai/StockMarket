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
  | "max_loss_understated"
  | "invalid_timestamps"
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
  invalidationConditions: string[];
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
  | "invalid_exit_price"
  | "invalid_timestamps";

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

export type PaperTradeEvidenceReviewStatus = "needs_more_data" | "ready_for_review" | "blocked";

export type PaperTradeEvidenceReason =
  | "no_closed_trades"
  | "insufficient_closed_trades"
  | "requires_backtest_and_operator_review"
  | "broker_execution_fields_prohibited"
  | "live_trading_fields_prohibited"
  | "non_paper_trade_record_prohibited"
  | "mixed_evidence_cohort";

export interface PaperTradeEvidenceSummaryOptions {
  minimumClosedTradesForReview?: number;
}

export interface PaperTradeEvidenceSummary {
  mode: "paper";
  liveTradingEnabled: false;
  brokerExecution: false;
  notRecommendation: true;
  status: "accepted" | "blocked";
  reviewStatus: PaperTradeEvidenceReviewStatus;
  reasonCodes: PaperTradeEvidenceReason[];
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  realizedPnl: number;
  averageReturnPct: number;
  averageRiskPctOfEquity: number;
  largestWin: number;
  largestLoss: number;
  closedTradeAuditLogIds: string[];
  notes: string[];
}

const maximumPositionRiskPct = 0.5;
const maximumSingleNameExposurePct = 5;
const maximumSectorExposurePct = 20;
const maximumCorrelatedExposurePct = 15;
const maximumDailyLossPct = 2;
const maximumAggregateOptionsPremiumPct = 3;
const defaultMinimumClosedTradesForReview = 30;

const prohibitedBrokerFields = [
  "brokerOrderId",
  "brokerAccountId",
  "externalOrderId",
  "liveOrderId",
  "providerOrderId",
  "executionVenue",
] as const;
const brokerExecutionBooleanFields = ["brokerExecution", "liveTradingEnabled"] as const;

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
  if (request === null || typeof request !== "object") {
    return false;
  }
  if (Array.isArray(request)) {
    return request.some((item) => hasProhibitedBrokerFields(item));
  }

  return Object.entries(request as Record<string, unknown>).some(
    ([key, value]) =>
      prohibitedBrokerFields.includes(key as (typeof prohibitedBrokerFields)[number]) ||
      hasProhibitedBrokerFields(value),
  );
}

function hasUnsafeBrokerExecutionFlags(request: unknown): boolean {
  if (request === null || typeof request !== "object") {
    return false;
  }
  if (Array.isArray(request)) {
    return request.some((item) => hasUnsafeBrokerExecutionFlags(item));
  }

  return Object.entries(request as Record<string, unknown>).some(
    ([key, value]) =>
      (brokerExecutionBooleanFields.includes(
        key as (typeof brokerExecutionBooleanFields)[number],
      ) &&
        value !== false) ||
      hasUnsafeBrokerExecutionFlags(value),
  );
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

const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function timestampMs(value: string): number | null {
  if (!isoTimestampPattern.test(value)) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function hasValidEntryTimestamps(
  entry: PaperTradeEntryRequest,
  approval: PaperTradeOperatorApproval,
): boolean {
  const requestedAt = timestampMs(entry.requestedAt);
  const approvedAt = timestampMs(approval.approvedAt);
  return requestedAt !== null && approvedAt !== null && approvedAt <= requestedAt;
}

function hasValidCloseTimestamps(trade: PaperTradeLifecycle, exit: PaperTradeExitRequest): boolean {
  const openedAt = timestampMs(trade.openedAt);
  const exitedAt = timestampMs(exit.exitedAt);
  const priceTimestamp = timestampMs(exit.priceTimestamp);
  return (
    openedAt !== null &&
    exitedAt !== null &&
    priceTimestamp !== null &&
    exitedAt >= openedAt &&
    priceTimestamp <= exitedAt
  );
}

function stopBasedMaxLoss(entry: PaperTradeEntryRequest): number | null {
  if (
    !isPositiveNumber(entry.entryPrice) ||
    !isPositiveNumber(entry.stopLossPrice) ||
    !isPositiveNumber(entry.quantity) ||
    entry.stopLossPrice >= entry.entryPrice
  ) {
    return null;
  }
  return roundedCurrency((entry.entryPrice - entry.stopLossPrice) * entry.quantity);
}

function emptyEvidenceSummary(
  totalTrades: number,
  status: PaperTradeEvidenceSummary["status"],
  reviewStatus: PaperTradeEvidenceReviewStatus,
  reasonCodes: PaperTradeEvidenceReason[],
): PaperTradeEvidenceSummary {
  return {
    mode: "paper",
    liveTradingEnabled: false,
    brokerExecution: false,
    notRecommendation: true,
    status,
    reviewStatus,
    reasonCodes,
    totalTrades,
    openTrades: 0,
    closedTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRatePct: 0,
    realizedPnl: 0,
    averageReturnPct: 0,
    averageRiskPctOfEquity: 0,
    largestWin: 0,
    largestLoss: 0,
    closedTradeAuditLogIds: [],
    notes: [
      "Paper-trade evidence is a validation input, not a recommendation or performance promise.",
    ],
  };
}

function evidenceSafetyReasons(trades: PaperTradeLifecycle[]): PaperTradeEvidenceReason[] {
  const reasons: PaperTradeEvidenceReason[] = [];
  if (trades.some((trade) => (trade as { mode?: unknown }).mode !== "paper")) {
    reasons.push("non_paper_trade_record_prohibited");
  }
  if (
    trades.some((trade) => (trade as { liveTradingEnabled?: unknown }).liveTradingEnabled !== false)
  ) {
    reasons.push("live_trading_fields_prohibited");
  }
  if (trades.some((trade) => (trade as { brokerExecution?: unknown }).brokerExecution !== false)) {
    reasons.push("broker_execution_fields_prohibited");
  }
  if (
    trades.some((trade) => hasProhibitedBrokerFields(trade) || hasUnsafeBrokerExecutionFlags(trade))
  ) {
    reasons.push("broker_execution_fields_prohibited");
  }
  const cohortKeys = new Set(
    trades.map(
      (trade) =>
        `${trade.ticker}:${trade.instrumentType}:${trade.strategyFamily}:${trade.strategyVersion}`,
    ),
  );
  if (cohortKeys.size > 1) {
    reasons.push("mixed_evidence_cohort");
  }
  return [...new Set(reasons)];
}

function isClosedPaperTrade(trade: PaperTradeLifecycle): trade is PaperTradeClosed {
  return trade.status === "closed";
}

function buildPaperTradeId(recommendationId: string, requestedAt: string): string {
  const compactTimestamp = requestedAt.replace(/[^0-9A-Za-z]/g, "");
  return `paper_${recommendationId}_${compactTimestamp}`;
}

export function createPaperTrade(request: PaperTradeRequest): PaperTradeDecision {
  const reasons: PaperTradeRejectReason[] = [];
  const { recommendation, account, entry, operatorApproval } = request;
  const computedStopBasedMaxLoss = stopBasedMaxLoss(entry);
  const conservativeMaxLoss =
    computedStopBasedMaxLoss === null
      ? entry.maxLoss
      : Math.max(entry.maxLoss, computedStopBasedMaxLoss);
  const riskPctOfEquity = isPositiveNumber(account.paperEquity)
    ? roundedPercent((conservativeMaxLoss / account.paperEquity) * 100)
    : 0;

  if (!isPaperTradeEligible(recommendation)) {
    reasons.push("recommendation_not_paper_trade_eligible");
  }
  if (hasProhibitedBrokerFields(request) || hasUnsafeBrokerExecutionFlags(request)) {
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
  if (computedStopBasedMaxLoss !== null && entry.maxLoss < computedStopBasedMaxLoss) {
    reasons.push("max_loss_understated");
  }
  if (!hasValidEntryTimestamps(entry, operatorApproval)) {
    reasons.push("invalid_timestamps");
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
      invalidationConditions: [...recommendation.invalidationConditions],
      thesisSnapshot: entry.thesisSnapshot,
      stopRule: entry.stopRule,
      targetRule: entry.targetRule,
      timeStop: entry.timeStop,
      risk: {
        maxLoss: conservativeMaxLoss,
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
  if (hasProhibitedBrokerFields(exit) || hasUnsafeBrokerExecutionFlags(exit)) {
    reasons.push("broker_execution_fields_prohibited");
  }
  if (!hasExitEvidence(exit)) {
    reasons.push("exit_details_missing");
  }
  if (!isPositiveNumber(exit.exitPrice)) {
    reasons.push("invalid_exit_price");
  }
  if (!hasValidCloseTimestamps(trade, exit)) {
    reasons.push("invalid_timestamps");
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

export function summarizePaperTradeEvidence(
  trades: PaperTradeLifecycle[],
  options: PaperTradeEvidenceSummaryOptions = {},
): PaperTradeEvidenceSummary {
  const safetyReasons = evidenceSafetyReasons(trades);
  if (safetyReasons.length > 0) {
    return emptyEvidenceSummary(trades.length, "blocked", "blocked", safetyReasons);
  }

  const closedTrades = trades.filter(isClosedPaperTrade);
  const openTrades = trades.filter((trade) => trade.status === "open");
  const minimumClosedTradesForReview =
    options.minimumClosedTradesForReview !== undefined && options.minimumClosedTradesForReview > 0
      ? Math.floor(options.minimumClosedTradesForReview)
      : defaultMinimumClosedTradesForReview;

  if (closedTrades.length === 0) {
    return {
      ...emptyEvidenceSummary(trades.length, "accepted", "needs_more_data", [
        "no_closed_trades",
        "insufficient_closed_trades",
      ]),
      openTrades: openTrades.length,
    };
  }

  const winningTrades = closedTrades.filter((trade) => trade.realizedPnl > 0);
  const losingTrades = closedTrades.filter((trade) => trade.realizedPnl < 0);
  const realizedPnl = roundedCurrency(
    closedTrades.reduce((total, trade) => total + trade.realizedPnl, 0),
  );
  const averageReturnPct = roundedPercent(
    closedTrades.reduce((total, trade) => total + trade.realizedReturnPct, 0) / closedTrades.length,
  );
  const averageRiskPctOfEquity = roundedPercent(
    closedTrades.reduce((total, trade) => total + trade.risk.riskPctOfEquity, 0) /
      closedTrades.length,
  );
  const reviewStatus: PaperTradeEvidenceReviewStatus =
    closedTrades.length >= minimumClosedTradesForReview ? "ready_for_review" : "needs_more_data";
  const reasonCodes: PaperTradeEvidenceReason[] =
    reviewStatus === "ready_for_review"
      ? ["requires_backtest_and_operator_review"]
      : ["insufficient_closed_trades"];

  return {
    mode: "paper",
    liveTradingEnabled: false,
    brokerExecution: false,
    notRecommendation: true,
    status: "accepted",
    reviewStatus,
    reasonCodes,
    totalTrades: trades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRatePct: roundedPercent((winningTrades.length / closedTrades.length) * 100),
    realizedPnl,
    averageReturnPct,
    averageRiskPctOfEquity,
    largestWin:
      winningTrades.length === 0 ? 0 : Math.max(...winningTrades.map((trade) => trade.realizedPnl)),
    largestLoss:
      losingTrades.length === 0 ? 0 : Math.min(...losingTrades.map((trade) => trade.realizedPnl)),
    closedTradeAuditLogIds: closedTrades.map((trade) => trade.exitAudit.auditLogId),
    notes: [
      "Paper-trade evidence is a validation input, not a recommendation or performance promise.",
    ],
  };
}
