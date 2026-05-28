import type { DataFreshness, ScoreSet } from "./risk";
import type { EvidenceStatus, StrategyFamily } from "./strategy";

export const opportunityDecisions = [
  "watchlist",
  "paper_trade",
  "avoid",
  "needs_more_data",
] as const;

export type OpportunityDecision = (typeof opportunityDecisions)[number];

export type InstrumentType = "stock" | "long_call" | "long_put" | "debit_spread";

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
  backtestRunId?: string;
  paperTradeEvidenceId?: string;
  optionsRiskDetails?: OptionsRiskDetails;
  createdAt: string;
  updatedAt: string;
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
  if (recommendation.sourceCitations.length === 0) {
    return false;
  }
  if (recommendation.invalidationConditions.length === 0) {
    return false;
  }
  if (isOptionsInstrument(recommendation.instrumentType)) {
    return Boolean(recommendation.optionsRiskDetails?.historicalOptionsEvidenceId);
  }
  return true;
}
