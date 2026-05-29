import type { DataFreshness, ScoreSet } from "./risk.js";
import type { EvidenceStatus, StrategyFamily } from "./strategy.js";

export const opportunityDecisions = [
  "watchlist",
  "paper_trade",
  "avoid",
  "needs_more_data",
] as const;

export type OpportunityDecision = (typeof opportunityDecisions)[number];

export const instrumentTypes = ["stock", "long_call", "long_put", "debit_spread"] as const;

export type InstrumentType = (typeof instrumentTypes)[number];

export const evidenceGates = ["verified", "needs_more_data", "blocked"] as const;

export type EvidenceGate = (typeof evidenceGates)[number];

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
  bid: number;
  ask: number;
  mid: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  breakeven: number;
  liquidityPass: boolean;
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

export interface EvidenceReviewRecord {
  resolver: "db_recommendation_evidence_resolver";
  recommendationId: string;
  evidenceGate: EvidenceGate;
  evidenceIds: string[];
  reasonCodes: string[];
  resolvedAt: string;
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
  evidenceGate?: EvidenceGate;
  evidenceReview?: EvidenceReviewRecord;
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

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeWholeNumber(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0
  );
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
    isFinitePositiveNumber(details.maxLoss) &&
    hasText(details.expiration) &&
    hasText(details.strikeLogic) &&
    isFinitePositiveNumber(details.bid) &&
    isFinitePositiveNumber(details.ask) &&
    details.ask >= details.bid &&
    isFinitePositiveNumber(details.mid) &&
    isNonNegativeWholeNumber(details.volume) &&
    isNonNegativeWholeNumber(details.openInterest) &&
    isFinitePositiveNumber(details.impliedVolatility) &&
    isFinitePositiveNumber(details.breakeven) &&
    details.liquidityPass === true &&
    hasText(details.spreadRisk) &&
    hasText(details.eventRisk) &&
    hasText(details.thetaRisk) &&
    hasText(details.historicalOptionsEvidenceId),
  );
}

function hasVerifiedEvidenceReview(recommendation: Recommendation): boolean {
  const review = recommendation.evidenceReview;
  const recommendationEvidenceIds = [
    recommendation.backtestRunId,
    recommendation.paperTradeEvidenceId,
  ].filter(hasText);
  const reviewEvidenceIds = Array.isArray(review?.evidenceIds) ? review.evidenceIds : [];
  const uniqueRecommendationEvidenceIds = new Set(recommendationEvidenceIds);
  const uniqueReviewEvidenceIds = new Set(reviewEvidenceIds);
  return Boolean(
    recommendation.evidenceGate === "verified" &&
    review &&
    review.resolver === "db_recommendation_evidence_resolver" &&
    review.recommendationId === recommendation.id &&
    review.evidenceGate === "verified" &&
    Array.isArray(review.reasonCodes) &&
    review.reasonCodes.length === 0 &&
    hasText(review.resolvedAt) &&
    Number.isFinite(Date.parse(review.resolvedAt)) &&
    Array.isArray(review.evidenceIds) &&
    reviewEvidenceIds.length > 0 &&
    uniqueReviewEvidenceIds.size === reviewEvidenceIds.length &&
    uniqueRecommendationEvidenceIds.size === recommendationEvidenceIds.length &&
    uniqueReviewEvidenceIds.size === uniqueRecommendationEvidenceIds.size &&
    reviewEvidenceIds.every((evidenceId) => hasText(evidenceId)) &&
    recommendationEvidenceIds.every((evidenceId) => uniqueReviewEvidenceIds.has(evidenceId)),
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
  if (!hasVerifiedEvidenceReview(recommendation)) {
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
