import type {
  DataFreshness,
  InstrumentType,
  OpportunityDecision,
  OptionsRiskDetails,
  ScoreSet,
  SourceCitation,
  StrategyFamily,
  EvidenceStatus,
} from "@stockmarket/core";

export type ScoreComponent =
  | "earnings"
  | "momentum"
  | "mean_reversion"
  | "volatility"
  | "options"
  | "news_sentiment"
  | "value_quality"
  | "sector_macro"
  | "liquidity"
  | "risk";

export interface ComponentSignal {
  component: ScoreComponent;
  score: number;
  weight: number;
  explanation: string;
}

export type StrategyMvpDecision = "test_now" | "context_only" | "test_later" | "control_layer";
export type StrategyImplementationComplexity = "low" | "medium" | "high" | "very_high";
export type StrategyOverfittingRisk = "medium" | "high" | "very_high" | "extreme";

export interface StrategyPolicy {
  family: StrategyFamily;
  label: string;
  mvpDecision: StrategyMvpDecision;
  paperTradeAllowed: boolean;
  requiredData: string[];
  backtestingRequirements: string[];
  riskControls: string[];
  optionsConsiderations: string[];
  implementationComplexity: StrategyImplementationComplexity;
  overfittingRisk: StrategyOverfittingRisk;
  notes: string;
}

export interface LiquidityContext {
  score: number;
  averageDailyDollarVolume?: number;
  spreadPercentOfMid?: number;
  passes: boolean;
}

export interface PaperExposureContext {
  proposedPositionRiskPct: number;
  singleNameExposurePct: number;
  sectorExposurePct: number;
  correlatedExposurePct: number;
  dailyLossPct: number;
  aggregateOptionsPremiumPct: number;
}

export interface ScoringInput {
  id: string;
  ticker: string;
  instrumentType: InstrumentType;
  strategyFamily: StrategyFamily;
  evidenceStatus: EvidenceStatus;
  evidenceIds: string[];
  dataFreshness: DataFreshness;
  sourceCitations: SourceCitation[];
  componentSignals: ComponentSignal[];
  liquidity: LiquidityContext;
  paperExposure: PaperExposureContext;
  optionsRiskDetails?: OptionsRiskDetails;
}

export type RiskGateImpact = "avoid" | "needs_more_data" | "paper_trade_block";

export interface RiskGateResult {
  id: string;
  passed: boolean;
  impact: RiskGateImpact;
  message: string;
}

export interface ScoreExplanation {
  summary: string;
  contributors: string[];
  assumptions: string[];
  blocks: string[];
}

export interface ScoringResult {
  inputId: string;
  ticker: string;
  decision: OpportunityDecision;
  evidenceStatus: EvidenceStatus;
  strategyPolicy: StrategyPolicy;
  scores: ScoreSet;
  gates: RiskGateResult[];
  explanation: ScoreExplanation;
}

const strategyPolicies: Record<StrategyFamily, StrategyPolicy> = {
  earnings: {
    family: "earnings",
    label: "Earnings",
    mvpDecision: "test_now",
    paperTradeAllowed: true,
    requiredData: [
      "Point-in-time earnings timestamps",
      "Adjusted OHLCV",
      "Surprise and estimate history",
      "Source citations",
    ],
    backtestingRequirements: [
      "Event-time alignment",
      "No same-bar leakage",
      "Pre-earnings and post-earnings split",
      "Market and sector comparison",
    ],
    riskControls: [
      "Earnings timestamp gate",
      "Extreme gap no-trade rule",
      "Liquidity floor",
      "Downside scenario",
    ],
    optionsConsiderations: [
      "Block options around earnings without historical chain and expected-move evidence.",
    ],
    implementationComplexity: "medium",
    overfittingRisk: "high",
    notes: "MVP testing is stock-only until historical options chains are available.",
  },
  momentum: {
    family: "momentum",
    label: "Momentum",
    mvpDecision: "test_now",
    paperTradeAllowed: true,
    requiredData: [
      "Adjusted OHLCV",
      "Point-in-time universe membership",
      "Sector classification",
      "Corporate actions",
    ],
    backtestingRequirements: [
      "Turnover and cost modeling",
      "Reversal-regime stress tests",
      "Benchmark and sector comparison",
      "Small parameter grid",
    ],
    riskControls: [
      "Liquidity floor",
      "Sector exposure cap",
      "Volatility extension guard",
      "Gap-risk guard",
    ],
    optionsConsiderations: [
      "Use long calls or debit spreads only after contract-level options evidence exists.",
    ],
    implementationComplexity: "medium",
    overfittingRisk: "medium",
    notes: "Liquid equity and ETF momentum is an MVP test-first family.",
  },
  mean_reversion: {
    family: "mean_reversion",
    label: "Mean Reversion",
    mvpDecision: "test_now",
    paperTradeAllowed: true,
    requiredData: [
      "Adjusted OHLCV",
      "Realized volatility",
      "Spread and liquidity data",
      "News and earnings calendar filters",
    ],
    backtestingRequirements: [
      "Conservative entry timing",
      "Crisis-period stress tests",
      "Stop and holding-period sensitivity",
      "Separate pullback, RSI, and gap tests",
    ],
    riskControls: [
      "No averaging down by default",
      "Event/news block",
      "Maximum holding period",
      "Drawdown guard",
    ],
    optionsConsiderations: [
      "Early mean-reversion tests should avoid options unless IV and expected move support them.",
    ],
    implementationComplexity: "medium",
    overfittingRisk: "high",
    notes: "MVP testing is limited to large liquid stocks and ETFs.",
  },
  volatility: {
    family: "volatility",
    label: "Volatility",
    mvpDecision: "context_only",
    paperTradeAllowed: false,
    requiredData: [
      "Realized volatility",
      "Implied volatility",
      "IV rank or percentile",
      "Event calendar",
    ],
    backtestingRequirements: [
      "Regime-specific analysis",
      "Event and non-event splits",
      "Spread and slippage stress tests",
      "Point-in-time IV history",
    ],
    riskControls: [
      "Short-volatility block",
      "IV crush warning",
      "Expected-move check",
      "Options liquidity floor",
    ],
    optionsConsiderations: [
      "Use as a long-options filter now; standalone volatility strategies wait for chain history.",
    ],
    implementationComplexity: "high",
    overfittingRisk: "high",
    notes: "Volatility is an MVP filter/context layer, not a standalone paper-trade strategy.",
  },
  options: {
    family: "options",
    label: "Options",
    mvpDecision: "test_later",
    paperTradeAllowed: false,
    requiredData: [
      "Historical options chains",
      "Bid, ask, mid, volume, open interest, and IV",
      "Expiration and strike metadata",
      "Underlying price timestamp",
    ],
    backtestingRequirements: [
      "Contract selection at trade time",
      "Bid/ask and slippage modeling",
      "Expiration handling",
      "Historical options evidence ID",
    ],
    riskControls: [
      "Max loss display",
      "Spread-width cap",
      "Open interest and volume floor",
      "Theta and event-risk notes",
    ],
    optionsConsiderations: [
      "Only long calls, long puts, and debit spreads are allowed; naked short options are blocked.",
    ],
    implementationComplexity: "high",
    overfittingRisk: "very_high",
    notes:
      "Automatic paper-trade promotion is blocked until a future options policy review; contract evidence remains required before that policy can change.",
  },
  news_sentiment: {
    family: "news_sentiment",
    label: "News / Sentiment",
    mvpDecision: "context_only",
    paperTradeAllowed: false,
    requiredData: [
      "Publisher and source URL",
      "Published and retrieved timestamps",
      "Ticker/entity mapping",
      "Duplicate detection metadata",
    ],
    backtestingRequirements: [
      "Publish-time alignment",
      "Vendor latency assumptions",
      "Deduplication",
      "Sentiment model versioning",
    ],
    riskControls: [
      "Citation requirement",
      "Stale headline block",
      "Low-quality source haircut",
      "Catalyst uncertainty note",
    ],
    optionsConsiderations: [
      "Catalyst options still need IV, expected move, max loss, and liquidity evidence.",
    ],
    implementationComplexity: "high",
    overfittingRisk: "high",
    notes:
      "News and sentiment can confirm watchlist signals but cannot stand alone for MVP paper trades.",
  },
  value_quality: {
    family: "value_quality",
    label: "Value / Quality",
    mvpDecision: "context_only",
    paperTradeAllowed: false,
    requiredData: [
      "Point-in-time fundamentals",
      "Filing dates",
      "Fiscal periods",
      "Sector comparisons",
    ],
    backtestingRequirements: [
      "Filing-lag rules",
      "Sector-neutral comparison",
      "Longer holding periods",
      "Restatement handling",
    ],
    riskControls: [
      "Value-trap warning",
      "Stale-fundamental block",
      "Debt and liquidity screen",
      "Guidance contradiction haircut",
    ],
    optionsConsiderations: [
      "Fundamentals do not justify options without contract-level options evidence.",
    ],
    implementationComplexity: "medium",
    overfittingRisk: "high",
    notes:
      "Value and quality are MVP context signals, not standalone short-term timing strategies.",
  },
  sector_macro: {
    family: "sector_macro",
    label: "Sector / Macro",
    mvpDecision: "test_later",
    paperTradeAllowed: false,
    requiredData: [
      "Sector ETF OHLCV",
      "Point-in-time sector classification",
      "Macro release timestamps",
      "Volatility regime data",
    ],
    backtestingRequirements: [
      "Weekly or monthly rebalance tests",
      "Transaction costs",
      "Benchmark against SPY and equal-weight sectors",
      "No lookahead in macro releases",
    ],
    riskControls: [
      "Sector concentration cap",
      "Correlation limit",
      "Turnover cap",
      "Cash/no-trade state",
    ],
    optionsConsiderations: [
      "Sector ETF options wait for historical chain data and liquidity validation.",
    ],
    implementationComplexity: "medium",
    overfittingRisk: "medium",
    notes: "Sector and macro are risk/context inputs until portfolio views mature.",
  },
  portfolio_risk: {
    family: "portfolio_risk",
    label: "Portfolio Risk",
    mvpDecision: "control_layer",
    paperTradeAllowed: false,
    requiredData: [
      "Open paper positions",
      "Strategy exposure",
      "Sector exposure",
      "Paper P/L and drawdown",
    ],
    backtestingRequirements: [
      "Sequential portfolio simulation",
      "Overlapping-position analysis",
      "Drawdown and daily-loss controls",
      "Exposure and capacity tracking",
    ],
    riskControls: [
      "Max paper position risk",
      "Daily loss guard",
      "Correlation cap",
      "Kill switch logic",
    ],
    optionsConsiderations: [
      "Options exposure should use premium or max loss, not underlying notional alone.",
    ],
    implementationComplexity: "medium",
    overfittingRisk: "medium",
    notes: "Portfolio risk is a required control layer, not a standalone opportunity family.",
  },
};

export function getStrategyPolicy(family: StrategyFamily): StrategyPolicy {
  return strategyPolicies[family];
}

export function listStrategyPolicies(): StrategyPolicy[] {
  return Object.values(strategyPolicies);
}

const minimumLiquidityScore = 70;
const maximumPositionRiskPct = 0.5;
const maximumSingleNameExposurePct = 5;
const maximumSectorExposurePct = 20;
const maximumCorrelatedExposurePct = 15;
const maximumDailyLossPct = 2;
const maximumAggregateOptionsPremiumPct = 3;

function clampScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(score)));
}

function weightedComponentScore(signals: ComponentSignal[]): number {
  const usableSignals = signals.filter((signal) => signal.weight > 0);
  const totalWeight = usableSignals.reduce((sum, signal) => sum + signal.weight, 0);
  if (totalWeight <= 0) {
    return 0;
  }
  return clampScore(
    usableSignals.reduce((sum, signal) => sum + clampScore(signal.score) * signal.weight, 0) /
      totalWeight,
  );
}

function paperExposurePasses(exposure: PaperExposureContext): boolean {
  return (
    exposure.proposedPositionRiskPct <= maximumPositionRiskPct &&
    exposure.singleNameExposurePct <= maximumSingleNameExposurePct &&
    exposure.sectorExposurePct <= maximumSectorExposurePct &&
    exposure.correlatedExposurePct <= maximumCorrelatedExposurePct &&
    exposure.dailyLossPct <= maximumDailyLossPct &&
    exposure.aggregateOptionsPremiumPct <= maximumAggregateOptionsPremiumPct
  );
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0
  );
}

function isOptionsInstrument(instrumentType: InstrumentType): boolean {
  return (
    instrumentType === "long_call" ||
    instrumentType === "long_put" ||
    instrumentType === "debit_spread"
  );
}

function hasValidOptionsRiskDetails(details: OptionsRiskDetails | undefined): boolean {
  return Boolean(
    details &&
    isPositiveNumber(details.maxLoss) &&
    hasText(details.expiration) &&
    hasText(details.strikeLogic) &&
    isPositiveNumber(details.bid) &&
    isPositiveNumber(details.ask) &&
    details.ask >= details.bid &&
    isPositiveNumber(details.mid) &&
    details.mid >= details.bid &&
    details.mid <= details.ask &&
    isNonNegativeInteger(details.volume) &&
    isNonNegativeInteger(details.openInterest) &&
    isPositiveNumber(details.impliedVolatility) &&
    isPositiveNumber(details.breakeven) &&
    details.liquidityPass === true &&
    hasText(details.spreadRisk) &&
    hasText(details.eventRisk) &&
    hasText(details.thetaRisk) &&
    hasText(details.historicalOptionsEvidenceId),
  );
}

function hasPaperEvidence(input: ScoringInput): boolean {
  return input.evidenceStatus === "paper_trade_eligible" && input.evidenceIds.length > 0;
}

export function evaluateRiskGates(input: ScoringInput): RiskGateResult[] {
  const strategyPolicy = getStrategyPolicy(input.strategyFamily);

  return [
    {
      id: "strategy_family_mvp_scope",
      passed: strategyPolicy.paperTradeAllowed,
      impact: "paper_trade_block",
      message: `${strategyPolicy.label} is ${strategyPolicy.mvpDecision} in the MVP and cannot bypass strategy readiness policy.`,
    },
    {
      id: "citations_present",
      passed: input.sourceCitations.length > 0,
      impact: "needs_more_data",
      message: "Source citations and timestamps are required before scoring can promote an idea.",
    },
    {
      id: "fresh_data",
      passed: input.dataFreshness.status === "fresh",
      impact: "needs_more_data",
      message: "Fresh data is required before paper-trade promotion.",
    },
    {
      id: "paper_trade_evidence",
      passed: hasPaperEvidence(input),
      impact: "paper_trade_block",
      message: "Backtest or paper-trade evidence is required before paper-trade promotion.",
    },
    {
      id: "liquidity",
      passed: input.liquidity.passes && input.liquidity.score >= minimumLiquidityScore,
      impact: "avoid",
      message: "Liquidity must pass the configured floor before a candidate can be used.",
    },
    {
      id: "paper_exposure",
      passed: paperExposurePasses(input.paperExposure),
      impact: "avoid",
      message: "Paper exposure must stay within conservative MVP limits.",
    },
    {
      id: "options_risk_details",
      passed:
        !isOptionsInstrument(input.instrumentType) ||
        hasValidOptionsRiskDetails(input.optionsRiskDetails),
      impact: "avoid",
      message:
        "Options need contract-level risk details, liquidity pass, max loss, and historical options evidence.",
    },
  ];
}

function decisionFromGates(input: ScoringInput, gates: RiskGateResult[]): OpportunityDecision {
  if (gates.some((gate) => !gate.passed && gate.impact === "needs_more_data")) {
    return "needs_more_data";
  }
  if (gates.some((gate) => !gate.passed && gate.impact === "avoid")) {
    return "avoid";
  }
  if (gates.some((gate) => !gate.passed && gate.impact === "paper_trade_block")) {
    return "watchlist";
  }
  return "paper_trade";
}

function riskControlScore(gates: RiskGateResult[]): number {
  const passedCount = gates.filter((gate) => gate.passed).length;
  return clampScore((passedCount / gates.length) * 100);
}

export function scoreOpportunity(input: ScoringInput): ScoringResult {
  const gates = evaluateRiskGates(input);
  const strategyPolicy = getStrategyPolicy(input.strategyFamily);
  const confidence = weightedComponentScore(input.componentSignals);
  const scores: ScoreSet = {
    risk: riskControlScore(gates),
    confidence,
    liquidity: clampScore(input.liquidity.score),
  };
  const blocks = gates.filter((gate) => !gate.passed).map((gate) => gate.message);

  return {
    inputId: input.id,
    ticker: input.ticker,
    decision: decisionFromGates(input, gates),
    evidenceStatus: input.evidenceStatus,
    strategyPolicy,
    scores,
    gates,
    explanation: {
      summary: `Scored ${input.ticker} as ${input.strategyFamily} research with ${scores.confidence}/100 confidence.`,
      contributors: input.componentSignals.map(
        (signal) => `${signal.component}: ${clampScore(signal.score)}/100 - ${signal.explanation}`,
      ),
      assumptions: [
        "Scores are research signals only and are not guaranteed to predict returns.",
        "Risk score is a risk-control quality score where higher means safer controls.",
        `Strategy policy: ${strategyPolicy.label} is ${strategyPolicy.mvpDecision} for MVP scope.`,
      ],
      blocks,
    },
  };
}
