import type {
  DataFreshness,
  InstrumentType,
  SourceCitation,
  StrategyFamily,
} from "@stockmarket/core";

export type BacktestPromotionGate = "ready_for_review" | "needs_more_data" | "blocked";

export type BacktestReasonCode =
  | "non_stock_instrument"
  | "options_backtest_not_supported"
  | "missing_source_citations"
  | "missing_data_freshness"
  | "missing_point_in_time_control"
  | "missing_survivorship_bias_control"
  | "missing_lookahead_bias_control"
  | "insufficient_trade_count"
  | "no_trades"
  | "invalid_trade";

export interface StockBacktestPeriod {
  start: string;
  end: string;
}

export interface BacktestAssumptions {
  slippageBps: number;
  spreadBps: number;
  feePerTrade: number;
  minTradesForReview: number;
  pointInTimeData: boolean;
  survivorshipBiasControl: boolean;
  lookaheadBiasControl: boolean;
  rejectedParameterSets: number;
  costStressMultipliers: number[];
  notes: string[];
}

export interface StockBacktestTrade {
  id: string;
  ticker: string;
  sector?: string;
  marketRegime?: string;
  earningsProximity?: string;
  entryAt: string;
  exitAt: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
}

export interface StockBacktestInput {
  id: string;
  strategyFamily: StrategyFamily;
  strategyVersionId: string;
  instrumentType: InstrumentType;
  universe: string;
  period: StockBacktestPeriod;
  benchmarkReturnPct: number;
  dataFreshness: DataFreshness;
  sourceCitations: SourceCitation[];
  assumptions: BacktestAssumptions;
  trades: StockBacktestTrade[];
  optionsProxy?: boolean;
}

export interface BacktestCostSensitivity {
  multiplier: number;
  netReturnPct: number;
  averageReturnPct: number;
  profitFactor: number;
}

export interface BacktestMetrics {
  tradeCount: number;
  winRatePct: number;
  averageReturnPct: number;
  medianReturnPct: number;
  maxDrawdownPct: number;
  profitFactor: number;
  bestTradeReturnPct: number;
  worstTradeReturnPct: number;
  averageHoldingDays: number;
  grossReturnPct: number;
  netReturnPct: number;
  benchmarkRelativeReturnPct: number;
  costSensitivity: BacktestCostSensitivity[];
}

export interface BacktestTradeResult {
  id: string;
  ticker: string;
  netReturnPct: number;
  grossReturnPct: number;
  holdingDays: number;
}

export interface StockBacktestResult {
  notRecommendation: true;
  id: string;
  strategyFamily: StrategyFamily;
  strategyVersionId: string;
  instrumentType: InstrumentType;
  promotionGate: BacktestPromotionGate;
  reasonCodes: BacktestReasonCode[];
  metrics: BacktestMetrics;
  trades: BacktestTradeResult[];
  assumptions: BacktestAssumptions;
  sourceCitations: SourceCitation[];
  dataFreshness: DataFreshness;
}

const millisecondsPerDay = 24 * 60 * 60 * 1000;

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function hasValidIsoDate(value: string): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function isValidTrade(trade: StockBacktestTrade): boolean {
  return (
    trade.id.trim().length > 0 &&
    trade.ticker.trim().length > 0 &&
    hasValidIsoDate(trade.entryAt) &&
    hasValidIsoDate(trade.exitAt) &&
    Date.parse(trade.exitAt) > Date.parse(trade.entryAt) &&
    Number.isFinite(trade.entryPrice) &&
    trade.entryPrice > 0 &&
    Number.isFinite(trade.exitPrice) &&
    trade.exitPrice > 0 &&
    Number.isInteger(trade.quantity) &&
    trade.quantity > 0
  );
}

function uniqueReasons(reasons: BacktestReasonCode[]): BacktestReasonCode[] {
  return [...new Set(reasons)];
}

function costPctForTrade(
  trade: StockBacktestTrade,
  assumptions: BacktestAssumptions,
  multiplier: number,
): number {
  const notional = trade.entryPrice * trade.quantity;
  const marketCostPct = (assumptions.slippageBps + assumptions.spreadBps) / 100;
  const feePct = (assumptions.feePerTrade / notional) * 100;
  return (marketCostPct + feePct) * multiplier;
}

function tradeReturnPct(
  trade: StockBacktestTrade,
  assumptions: BacktestAssumptions,
  multiplier: number,
): number {
  const grossReturnPct = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
  return round(grossReturnPct - costPctForTrade(trade, assumptions, multiplier));
}

function holdingDays(trade: StockBacktestTrade): number {
  return round((Date.parse(trade.exitAt) - Date.parse(trade.entryAt)) / millisecondsPerDay);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return round(values.reduce((total, value) => total + value, 0) / values.length);
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return round(sorted[middle] ?? 0);
  }
  return round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2);
}

function profitFactor(returns: number[]): number {
  const wins = returns.filter((value) => value > 0).reduce((total, value) => total + value, 0);
  const losses = Math.abs(
    returns.filter((value) => value < 0).reduce((total, value) => total + value, 0),
  );
  if (losses === 0) {
    return wins > 0 ? Number.POSITIVE_INFINITY : 0;
  }
  return round(wins / losses);
}

function maxDrawdownPct(returns: number[]): number {
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const value of returns) {
    cumulative += value;
    peak = Math.max(peak, cumulative);
    maxDrawdown = Math.min(maxDrawdown, cumulative - peak);
  }

  return round(Math.abs(maxDrawdown));
}

function promotionGateFor(reasons: BacktestReasonCode[]): BacktestPromotionGate {
  const blockingReasons = new Set<BacktestReasonCode>([
    "non_stock_instrument",
    "options_backtest_not_supported",
    "missing_point_in_time_control",
    "missing_survivorship_bias_control",
    "missing_lookahead_bias_control",
    "invalid_trade",
  ]);
  if (reasons.some((reason) => blockingReasons.has(reason))) {
    return "blocked";
  }
  if (reasons.length > 0) {
    return "needs_more_data";
  }
  return "ready_for_review";
}

function evaluateReturns(
  input: StockBacktestInput,
  multiplier: number,
): { returns: number[]; trades: BacktestTradeResult[] } {
  const trades = input.trades.filter(isValidTrade).map((trade) => ({
    id: trade.id,
    ticker: trade.ticker,
    netReturnPct: tradeReturnPct(trade, input.assumptions, multiplier),
    grossReturnPct: round(((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100),
    holdingDays: holdingDays(trade),
  }));

  return {
    trades,
    returns: trades.map((trade) => trade.netReturnPct),
  };
}

function metricsFor(input: StockBacktestInput): BacktestMetrics {
  const baseline = evaluateReturns(input, 1);
  const returns = baseline.returns;
  const grossReturns = baseline.trades.map((trade) => trade.grossReturnPct);
  const winningTrades = returns.filter((value) => value > 0).length;
  const costMultipliers =
    input.assumptions.costStressMultipliers.length > 0
      ? input.assumptions.costStressMultipliers
      : [1, 2, 3];

  return {
    tradeCount: returns.length,
    winRatePct: returns.length === 0 ? 0 : round((winningTrades / returns.length) * 100),
    averageReturnPct: average(returns),
    medianReturnPct: median(returns),
    maxDrawdownPct: maxDrawdownPct(returns),
    profitFactor: profitFactor(returns),
    bestTradeReturnPct: returns.length === 0 ? 0 : round(Math.max(...returns)),
    worstTradeReturnPct: returns.length === 0 ? 0 : round(Math.min(...returns)),
    averageHoldingDays: average(baseline.trades.map((trade) => trade.holdingDays)),
    grossReturnPct: average(grossReturns),
    netReturnPct: average(returns),
    benchmarkRelativeReturnPct: round(average(returns) - input.benchmarkReturnPct),
    costSensitivity: costMultipliers.map((multiplier) => {
      const scenarioReturns = evaluateReturns(input, multiplier).returns;
      return {
        multiplier,
        netReturnPct: average(scenarioReturns),
        averageReturnPct: average(scenarioReturns),
        profitFactor: profitFactor(scenarioReturns),
      };
    }),
  };
}

function reasonCodesFor(input: StockBacktestInput): BacktestReasonCode[] {
  const reasons: BacktestReasonCode[] = [];

  if (input.instrumentType !== "stock") {
    reasons.push("non_stock_instrument");
  }
  if (input.optionsProxy === true || input.instrumentType !== "stock") {
    reasons.push("options_backtest_not_supported");
  }
  if (input.sourceCitations.length === 0) {
    reasons.push("missing_source_citations");
  }
  if (input.dataFreshness.status === "missing") {
    reasons.push("missing_data_freshness");
  }
  if (!input.assumptions.pointInTimeData) {
    reasons.push("missing_point_in_time_control");
  }
  if (!input.assumptions.survivorshipBiasControl) {
    reasons.push("missing_survivorship_bias_control");
  }
  if (!input.assumptions.lookaheadBiasControl) {
    reasons.push("missing_lookahead_bias_control");
  }
  if (input.trades.length === 0) {
    reasons.push("no_trades");
  }
  if (input.trades.some((trade) => !isValidTrade(trade))) {
    reasons.push("invalid_trade");
  }
  if (input.trades.length > 0 && input.trades.length < input.assumptions.minTradesForReview) {
    reasons.push("insufficient_trade_count");
  }

  return uniqueReasons(reasons);
}

export function evaluateStockBacktest(input: StockBacktestInput): StockBacktestResult {
  const reasonCodes = reasonCodesFor(input);

  return {
    notRecommendation: true,
    id: input.id,
    strategyFamily: input.strategyFamily,
    strategyVersionId: input.strategyVersionId,
    instrumentType: input.instrumentType,
    promotionGate: promotionGateFor(reasonCodes),
    reasonCodes,
    metrics: metricsFor(input),
    trades: evaluateReturns(input, 1).trades,
    assumptions: input.assumptions,
    sourceCitations: input.sourceCitations,
    dataFreshness: input.dataFreshness,
  };
}
