import type { DataFreshness, ScoreSet } from "./risk.js";
import type { EvidenceStatus, StrategyFamily } from "./strategy.js";

export const opportunityDecisions = [
  "watchlist",
  "paper_trade",
  "avoid",
  "needs_more_data",
] as const;

export type OpportunityDecision = (typeof opportunityDecisions)[number];

export type InstrumentType = "stock" | "long_call" | "long_put" | "debit_spread";

export const paperTradeMinimumLiquidityScore = 70;

export interface SourceCitation {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  retrievedAt: string;
}

export interface OptionsRiskDetails {
  maxLoss: number;
  expiration: string;
  strikeLogic: string;
  spreadRisk: string;
  eventRisk: string;
  thetaRisk: string;
  historicalOptionsEvidenceId?: string;
}

export interface OperatorDecisionRecord {
  actor: "system" | "operator";
  decidedBy: string;
  decidedAt: string;
  auditLogId: string;
  notes: string;
}

export interface Recommendation {
  id: string;
  ticker: string;
  thesis: string;
  instrumentType: InstrumentType;
  strategyFamily: StrategyFamily;
  strategyVersion: string;
  decision: OpportunityDecision;
  evidenceStatus: EvidenceStatus;
  sourceCitations: SourceCitation[];
  dataFreshness: DataFreshness;
  scores: ScoreSet;
  bullCase: string;
  bearCase: string;
  downsideScenario: string;
  invalidationConditions: string[];
  whySystemMightBeWrong: string;
  operatorDecision: OperatorDecisionRecord;
  backtestRunId?: string;
  paperTradeEvidenceId?: string;
  optionsRiskDetails?: OptionsRiskDetails;
  createdAt: string;
  updatedAt: string;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function hasAuditRecord(recommendation: Recommendation): boolean {
  return (
    hasText(recommendation.operatorDecision?.auditLogId) &&
    hasText(recommendation.operatorDecision.decidedBy) &&
    hasText(recommendation.operatorDecision.decidedAt)
  );
}

function hasRequiredNarratives(recommendation: Recommendation): boolean {
  return (
    hasText(recommendation.thesis) &&
    hasText(recommendation.bullCase) &&
    hasText(recommendation.bearCase) &&
    hasText(recommendation.downsideScenario) &&
    hasText(recommendation.whySystemMightBeWrong)
  );
}

function hasValidOptionsRiskDetails(recommendation: Recommendation): boolean {
  const details = recommendation.optionsRiskDetails;
  return Boolean(
    details &&
    typeof details.maxLoss === "number" &&
    Number.isFinite(details.maxLoss) &&
    details.maxLoss > 0 &&
    hasText(details.expiration) &&
    hasText(details.strikeLogic) &&
    hasText(details.spreadRisk) &&
    hasText(details.eventRisk) &&
    hasText(details.thetaRisk) &&
    hasText(details.historicalOptionsEvidenceId),
  );
}

function isOptionsInstrument(instrumentType: InstrumentType): boolean {
  return (
    instrumentType === "long_call" ||
    instrumentType === "long_put" ||
    instrumentType === "debit_spread"
  );
}

export function isPaperTradeEligible(recommendation: Recommendation): boolean {
  if (recommendation.decision !== "paper_trade") {
    return false;
  }
  if (recommendation.evidenceStatus !== "paper_trade_eligible") {
    return false;
  }
  if (!recommendation.backtestRunId && !recommendation.paperTradeEvidenceId) {
    return false;
  }
  if (!hasAuditRecord(recommendation)) {
    return false;
  }
  if (!hasRequiredNarratives(recommendation)) {
    return false;
  }
  if (recommendation.dataFreshness.status !== "fresh") {
    return false;
  }
  if (
    !isValidScore(recommendation.scores.risk) ||
    !isValidScore(recommendation.scores.confidence) ||
    !isValidScore(recommendation.scores.liquidity)
  ) {
    return false;
  }
  if (recommendation.scores.liquidity < paperTradeMinimumLiquidityScore) {
    return false;
  }
  if (recommendation.sourceCitations.length === 0) {
    return false;
  }
  if (recommendation.invalidationConditions.length === 0) {
    return false;
  }
  if (isOptionsInstrument(recommendation.instrumentType)) {
    return hasValidOptionsRiskDetails(recommendation);
  }
  return true;
}
