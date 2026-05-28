import { z } from "zod";
import {
  instrumentTypes,
  isPaperTradeEligible,
  opportunityDecisions,
  type Recommendation,
} from "./recommendation.js";
import { evidenceStatuses, strategyFamilies } from "./strategy.js";

const nonemptyString = z.string().trim().min(1);
const isoTimestamp = nonemptyString;
const score = z.number().finite().min(0).max(100);
const positiveFiniteNumber = z.number().finite().positive();
const nonNegativeWholeNumber = z.number().finite().int().nonnegative();

export const scoreSetSchema = z.object({
  risk: score,
  confidence: score,
  liquidity: score,
});

export const dataFreshnessSchema = z.object({
  status: z.enum(["fresh", "stale", "partial", "missing"]),
  asOf: isoTimestamp,
  notes: z.array(z.string()),
});

export const sourceCitationSchema = z.object({
  title: nonemptyString,
  url: z.string().url(),
  source: nonemptyString,
  publishedAt: isoTimestamp,
  retrievedAt: isoTimestamp,
});

export const optionsRiskDetailsSchema = z
  .object({
    maxLoss: positiveFiniteNumber,
    expiration: nonemptyString,
    strikeLogic: nonemptyString,
    bid: positiveFiniteNumber,
    ask: positiveFiniteNumber,
    mid: positiveFiniteNumber,
    volume: nonNegativeWholeNumber,
    openInterest: nonNegativeWholeNumber,
    impliedVolatility: positiveFiniteNumber,
    breakeven: positiveFiniteNumber,
    liquidityPass: z.boolean(),
    spreadRisk: nonemptyString,
    eventRisk: nonemptyString,
    thetaRisk: nonemptyString,
    historicalOptionsEvidenceId: nonemptyString.optional(),
  })
  .refine((details) => details.ask >= details.bid, {
    message: "Option ask must be greater than or equal to bid.",
    path: ["ask"],
  });

export const operatorDecisionRecordSchema = z.object({
  actor: z.enum(["system", "operator"]),
  decidedBy: nonemptyString,
  decidedAt: isoTimestamp,
  auditLogId: nonemptyString,
  notes: z.string(),
});

export const recommendationSchema: z.ZodType<Recommendation> = z
  .object({
    id: nonemptyString,
    ticker: nonemptyString,
    thesis: nonemptyString,
    instrumentType: z.enum(instrumentTypes),
    strategyFamily: z.enum(strategyFamilies),
    strategyVersion: nonemptyString,
    decision: z.enum(opportunityDecisions),
    evidenceStatus: z.enum(evidenceStatuses),
    sourceCitations: z.array(sourceCitationSchema).min(1),
    dataFreshness: dataFreshnessSchema,
    scores: scoreSetSchema,
    bullCase: nonemptyString,
    bearCase: nonemptyString,
    downsideScenario: nonemptyString,
    invalidationConditions: z.array(nonemptyString).min(1),
    whySystemMightBeWrong: nonemptyString,
    operatorDecision: operatorDecisionRecordSchema,
    backtestRunId: nonemptyString.optional(),
    paperTradeEvidenceId: nonemptyString.optional(),
    optionsRiskDetails: optionsRiskDetailsSchema.optional(),
    createdAt: isoTimestamp,
    updatedAt: isoTimestamp,
  })
  .superRefine((recommendation, context) => {
    if (
      recommendation.instrumentType !== "stock" &&
      recommendation.optionsRiskDetails === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["optionsRiskDetails"],
        message: "Options instruments require contract-level risk and liquidity details.",
      });
    }
    if (recommendation.decision === "paper_trade" && !isPaperTradeEligible(recommendation)) {
      context.addIssue({
        code: "custom",
        path: ["decision"],
        message:
          "Paper-trade recommendations require evidence, fresh data, audit linkage, citations, liquidity, and risk gates.",
      });
    }
  });
