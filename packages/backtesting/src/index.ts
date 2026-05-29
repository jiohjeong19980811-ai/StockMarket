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
  | "invalid_source_timestamps"
  | "missing_data_freshness"
  | "invalid_freshness_timestamp"
  | "invalid_backtest_period"
  | "missing_point_in_time_control"
  | "missing_survivorship_bias_control"
  | "missing_lookahead_bias_control"
  | "invalid_cost_assumptions"
  | "missing_cost_stress_scenarios"
  | "invalid_parameter_trials"
  | "excessive_parameter_search"
  | "liquidity_filter_failed"
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
  minAverageDailyDollarVolume: number;
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
  averageDailyDollarVolume: number;
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
  profitFactor: number | null;
}

export interface BacktestMetrics {
  tradeCount: number;
  winRatePct: number;
  averageReturnPct: number;
  medianReturnPct: number;
  maxDrawdownPct: number;
  profitFactor: number | null;
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

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function hasValidCitationTimestamps(citation: SourceCitation): boolean {
  return (
    hasText(citation.title) &&
    hasText(citation.url) &&
    hasText(citation.source) &&
    hasValidIsoDate(citation.publishedAt) &&
    hasValidIsoDate(citation.retrievedAt)
  );
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
    trade.quantity > 0 &&
    Number.isFinite(trade.averageDailyDollarVolume) &&
    trade.averageDailyDollarVolume >= 0
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

function profitFactor(returns: number[]): number | null {
  const wins = returns.filter((value) => value > 0).reduce((total, value) => total + value, 0);
  const losses = Math.abs(
    returns.filter((value) => value < 0).reduce((total, value) => total + value, 0),
  );
  if (losses === 0) {
    return wins > 0 ? null : 0;
  }
  return round(wins / losses);
}

function maxDrawdownPct(returns: number[]): number {
  let equity = 1;
  let peak = 1;
  let maxDrawdown = 0;

  for (const value of returns) {
    equity *= 1 + value / 100;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.min(maxDrawdown, ((equity - peak) / peak) * 100);
  }

  return round(Math.abs(maxDrawdown));
}

function compoundedReturnPct(returns: number[]): number {
  return round((returns.reduce((equity, value) => equity * (1 + value / 100), 1) - 1) * 100);
}

function promotionGateFor(reasons: BacktestReasonCode[]): BacktestPromotionGate {
  const blockingReasons = new Set<BacktestReasonCode>([
    "non_stock_instrument",
    "options_backtest_not_supported",
    "invalid_source_timestamps",
    "invalid_freshness_timestamp",
    "invalid_backtest_period",
    "missing_point_in_time_control",
    "missing_survivorship_bias_control",
    "missing_lookahead_bias_control",
    "invalid_cost_assumptions",
    "missing_cost_stress_scenarios",
    "invalid_parameter_trials",
    "liquidity_filter_failed",
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
  const trades = input.trades
    .filter(isValidTrade)
    .slice()
    .sort((left, right) => Date.parse(left.exitAt) - Date.parse(right.exitAt))
    .map((trade) => ({
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
      ? [...new Set(input.assumptions.costStressMultipliers)].sort((left, right) => left - right)
      : [1, 2, 3];
  const netReturnPct = compoundedReturnPct(returns);

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
    netReturnPct,
    benchmarkRelativeReturnPct: round(netReturnPct - input.benchmarkReturnPct),
    costSensitivity: costMultipliers.map((multiplier) => {
      const scenarioReturns = evaluateReturns(input, multiplier).returns;
      return {
        multiplier,
        netReturnPct: compoundedReturnPct(scenarioReturns),
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
  if (
    input.optionsProxy === true ||
    input.instrumentType !== "stock" ||
    input.strategyFamily === "options"
  ) {
    reasons.push("options_backtest_not_supported");
  }
  if (input.sourceCitations.length === 0) {
    reasons.push("missing_source_citations");
  }
  if (
    input.sourceCitations.length > 0 &&
    input.sourceCitations.some((citation) => !hasValidCitationTimestamps(citation))
  ) {
    reasons.push("invalid_source_timestamps");
  }
  if (input.dataFreshness.status === "missing") {
    reasons.push("missing_data_freshness");
  }
  if (!hasValidIsoDate(input.dataFreshness.asOf)) {
    reasons.push("invalid_freshness_timestamp");
  }
  if (
    !hasValidIsoDate(input.period.start) ||
    !hasValidIsoDate(input.period.end) ||
    Date.parse(input.period.end) <= Date.parse(input.period.start)
  ) {
    reasons.push("invalid_backtest_period");
  }
  if (
    !Number.isFinite(input.assumptions.slippageBps) ||
    input.assumptions.slippageBps < 0 ||
    !Number.isFinite(input.assumptions.spreadBps) ||
    input.assumptions.spreadBps <= 0 ||
    !Number.isFinite(input.assumptions.feePerTrade) ||
    input.assumptions.feePerTrade < 0 ||
    !Number.isFinite(input.assumptions.minAverageDailyDollarVolume) ||
    input.assumptions.minAverageDailyDollarVolume <= 0 ||
    !Number.isInteger(input.assumptions.minTradesForReview) ||
    input.assumptions.minTradesForReview <= 0
  ) {
    reasons.push("invalid_cost_assumptions");
  }
  if (
    !Number.isInteger(input.assumptions.rejectedParameterSets) ||
    input.assumptions.rejectedParameterSets < 0
  ) {
    reasons.push("invalid_parameter_trials");
  }
  if (
    Number.isInteger(input.assumptions.rejectedParameterSets) &&
    input.assumptions.rejectedParameterSets > Math.max(20, input.trades.length * 5)
  ) {
    reasons.push("excessive_parameter_search");
  }
  if (
    ![1, 2, 3].every((requiredMultiplier) =>
      input.assumptions.costStressMultipliers.includes(requiredMultiplier),
    ) ||
    input.assumptions.costStressMultipliers.some(
      (multiplier) => !Number.isFinite(multiplier) || multiplier <= 0,
    )
  ) {
    reasons.push("missing_cost_stress_scenarios");
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
  if (
    input.trades.some(
      (trade) =>
        Number.isFinite(trade.averageDailyDollarVolume) &&
        trade.averageDailyDollarVolume < input.assumptions.minAverageDailyDollarVolume,
    )
  ) {
    reasons.push("liquidity_filter_failed");
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
