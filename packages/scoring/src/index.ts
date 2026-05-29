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
  scores: ScoreSet;
  gates: RiskGateResult[];
  explanation: ScoreExplanation;
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
  return [
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
  if (!hasPaperEvidence(input)) {
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
      ],
      blocks,
    },
  };
}
