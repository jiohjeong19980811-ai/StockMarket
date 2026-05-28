import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const instruments = sqliteTable(
  "instruments",
  {
    id: text("id").primaryKey(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    instrumentType: text("instrument_type", {
      enum: ["stock", "etf", "option", "index"],
    }).notNull(),
    exchange: text("exchange").notNull(),
    currency: text("currency").notNull().default("USD"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("instruments_symbol_exchange_unique").on(table.symbol, table.exchange)],
);

export const ingestionRuns = sqliteTable("ingestion_runs", {
  id: text("id").primaryKey(),
  providerName: text("provider_name").notNull(),
  providerDataset: text("provider_dataset").notNull(),
  adapterVersion: text("adapter_version").notNull(),
  status: text("status", { enum: ["started", "completed", "failed"] }).notNull(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
});

export const providerRecords = sqliteTable(
  "provider_records",
  {
    id: text("id").primaryKey(),
    ingestionRunId: text("ingestion_run_id")
      .notNull()
      .references(() => ingestionRuns.id),
    providerName: text("provider_name").notNull(),
    providerDataset: text("provider_dataset").notNull(),
    providerRecordId: text("provider_record_id"),
    contentHash: text("content_hash").notNull(),
    providerTimestamp: text("provider_timestamp"),
    sourcePublishedAt: text("source_published_at"),
    retrievedAt: text("retrieved_at").notNull(),
    ingestedAt: text("ingested_at").notNull(),
    normalizedAt: text("normalized_at").notNull(),
    adapterVersion: text("adapter_version").notNull(),
    normalizationVersion: text("normalization_version").notNull(),
    qualityStatus: text("quality_status", {
      enum: ["fresh", "stale", "partial", "missing"],
    }).notNull(),
    qualityFlagsJson: text("quality_flags_json").notNull().default("[]"),
    qualityNotes: text("quality_notes").notNull().default(""),
    staleReason: text("stale_reason"),
    entitlementStatus: text("entitlement_status").notNull().default("not_reviewed"),
    sourceUrl: text("source_url"),
  },
  (table) => [
    uniqueIndex("provider_records_provider_record_unique").on(
      table.providerName,
      table.providerDataset,
      table.providerRecordId,
    ),
    uniqueIndex("provider_records_content_hash_unique").on(
      table.providerName,
      table.providerDataset,
      table.contentHash,
    ),
    index("provider_records_ingestion_run_idx").on(table.ingestionRunId),
  ],
);

export const dataQualityEvents = sqliteTable("data_quality_events", {
  id: text("id").primaryKey(),
  providerRecordId: text("provider_record_id").references(() => providerRecords.id),
  ingestionRunId: text("ingestion_run_id").references(() => ingestionRuns.id),
  severity: text("severity", { enum: ["info", "warning", "error"] }).notNull(),
  qualityStatus: text("quality_status", {
    enum: ["fresh", "stale", "partial", "missing"],
  }).notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});

export const strategyDefinitions = sqliteTable("strategy_definitions", {
  id: text("id").primaryKey(),
  family: text("family").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  allowedInstrumentTypesJson: text("allowed_instrument_types_json").notNull(),
  createdAt: text("created_at").notNull(),
});

export const strategyVersions = sqliteTable(
  "strategy_versions",
  {
    id: text("id").primaryKey(),
    strategyDefinitionId: text("strategy_definition_id")
      .notNull()
      .references(() => strategyDefinitions.id),
    version: text("version").notNull(),
    validationStatus: text("validation_status", {
      enum: [
        "research_only",
        "watchlist_eligible",
        "paper_trade_eligible",
        "avoid",
        "needs_more_data",
      ],
    }).notNull(),
    promotionState: text("promotion_state", {
      enum: [
        "research_only",
        "watchlist_eligible",
        "paper_trade_eligible",
        "avoid",
        "needs_more_data",
      ],
    }).notNull(),
    requiredDataJson: text("required_data_json").notNull(),
    riskPolicyVersion: text("risk_policy_version").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("strategy_versions_strategy_version_unique").on(
      table.strategyDefinitionId,
      table.version,
    ),
  ],
);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  actorType: text("actor_type", { enum: ["system", "operator"] }).notNull(),
  actorId: text("actor_id").notNull(),
  occurredAt: text("occurred_at").notNull(),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  pipelineRunId: text("pipeline_run_id"),
  strategyVersionId: text("strategy_version_id"),
  scoringVersion: text("scoring_version"),
  riskPolicyVersion: text("risk_policy_version"),
  providerName: text("provider_name"),
  providerTimestamp: text("provider_timestamp"),
  retrievedAt: text("retrieved_at"),
  riskDecision: text("risk_decision"),
  riskReasonsJson: text("risk_reasons_json").notNull().default("[]"),
  operatorDecision: text("operator_decision"),
  operatorNotes: text("operator_notes"),
  aiModel: text("ai_model"),
  aiPromptVersion: text("ai_prompt_version"),
});

export const recommendations = sqliteTable(
  "recommendations",
  {
    id: text("id").primaryKey(),
    ticker: text("ticker").notNull(),
    instrumentType: text("instrument_type", {
      enum: ["stock", "long_call", "long_put", "debit_spread"],
    }).notNull(),
    strategyVersionId: text("strategy_version_id")
      .notNull()
      .references(() => strategyVersions.id),
    decision: text("decision", {
      enum: ["watchlist", "paper_trade", "avoid", "needs_more_data"],
    }).notNull(),
    evidenceStatus: text("evidence_status", {
      enum: [
        "research_only",
        "watchlist_eligible",
        "paper_trade_eligible",
        "avoid",
        "needs_more_data",
      ],
    }).notNull(),
    thesis: text("thesis").notNull(),
    bullCase: text("bull_case").notNull(),
    bearCase: text("bear_case").notNull(),
    downsideScenario: text("downside_scenario").notNull(),
    invalidationConditionsJson: text("invalidation_conditions_json").notNull(),
    whySystemMightBeWrong: text("why_system_might_be_wrong").notNull(),
    primaryCitationTitle: text("primary_citation_title").notNull(),
    primaryCitationUrl: text("primary_citation_url").notNull(),
    primaryCitationSource: text("primary_citation_source").notNull(),
    primaryCitationPublishedAt: text("primary_citation_published_at").notNull(),
    primaryCitationRetrievedAt: text("primary_citation_retrieved_at").notNull(),
    freshnessStatus: text("freshness_status", {
      enum: ["fresh", "stale", "partial", "missing"],
    }).notNull(),
    freshnessAsOf: text("freshness_as_of").notNull(),
    freshnessNotesJson: text("freshness_notes_json").notNull(),
    riskScore: integer("risk_score").notNull(),
    confidenceScore: integer("confidence_score").notNull(),
    liquidityScore: integer("liquidity_score").notNull(),
    liquidityDecision: text("liquidity_decision", { enum: ["pass", "fail"] }).notNull(),
    riskDecision: text("risk_decision", { enum: ["pass", "fail"] }).notNull(),
    backtestRunId: text("backtest_run_id"),
    paperTradeEvidenceId: text("paper_trade_evidence_id"),
    optionMaxLoss: real("option_max_loss"),
    optionExpiration: text("option_expiration"),
    optionStrikeLogic: text("option_strike_logic"),
    optionBid: real("option_bid"),
    optionAsk: real("option_ask"),
    optionMid: real("option_mid"),
    optionVolume: integer("option_volume"),
    optionOpenInterest: integer("option_open_interest"),
    optionImpliedVolatility: real("option_implied_volatility"),
    optionBreakeven: real("option_breakeven"),
    optionLiquidityPass: integer("option_liquidity_pass", { mode: "boolean" }),
    optionSpreadRisk: text("option_spread_risk"),
    optionEventRisk: text("option_event_risk"),
    optionThetaRisk: text("option_theta_risk"),
    optionHistoricalOptionsEvidenceId: text("option_historical_options_evidence_id"),
    operatorAuditLogId: text("operator_audit_log_id")
      .notNull()
      .references(() => auditLogs.id),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("recommendations_ticker_idx").on(table.ticker),
    index("recommendations_strategy_version_idx").on(table.strategyVersionId),
    check("recommendations_risk_score_range", sql`${table.riskScore} BETWEEN 0 AND 100`),
    check(
      "recommendations_confidence_score_range",
      sql`${table.confidenceScore} BETWEEN 0 AND 100`,
    ),
    check("recommendations_liquidity_score_range", sql`${table.liquidityScore} BETWEEN 0 AND 100`),
    check(
      "recommendations_option_details_required",
      sql`
        ${table.instrumentType} = 'stock'
        OR (
          ${table.optionMaxLoss} IS NOT NULL AND ${table.optionMaxLoss} > 0
          AND ${table.optionExpiration} IS NOT NULL AND length(${table.optionExpiration}) > 0
          AND ${table.optionStrikeLogic} IS NOT NULL AND length(${table.optionStrikeLogic}) > 0
          AND ${table.optionBid} IS NOT NULL AND ${table.optionBid} > 0
          AND ${table.optionAsk} IS NOT NULL AND ${table.optionAsk} >= ${table.optionBid}
          AND ${table.optionMid} IS NOT NULL AND ${table.optionMid} > 0
          AND ${table.optionVolume} IS NOT NULL AND ${table.optionVolume} >= 0
          AND ${table.optionOpenInterest} IS NOT NULL AND ${table.optionOpenInterest} >= 0
          AND ${table.optionImpliedVolatility} IS NOT NULL AND ${table.optionImpliedVolatility} > 0
          AND ${table.optionBreakeven} IS NOT NULL AND ${table.optionBreakeven} > 0
          AND ${table.optionLiquidityPass} IS NOT NULL
          AND ${table.optionSpreadRisk} IS NOT NULL AND length(${table.optionSpreadRisk}) > 0
          AND ${table.optionEventRisk} IS NOT NULL AND length(${table.optionEventRisk}) > 0
          AND ${table.optionThetaRisk} IS NOT NULL AND length(${table.optionThetaRisk}) > 0
        )
      `,
    ),
    check(
      "recommendations_paper_trade_gate",
      sql`
      ${table.decision} != 'paper_trade'
      OR (
        ${table.evidenceStatus} = 'paper_trade_eligible'
        AND (
          length(coalesce(${table.backtestRunId}, '')) > 0
          OR length(coalesce(${table.paperTradeEvidenceId}, '')) > 0
        )
        AND ${table.freshnessStatus} = 'fresh'
        AND ${table.liquidityDecision} = 'pass'
        AND ${table.riskDecision} = 'pass'
        AND (
          ${table.instrumentType} = 'stock'
          OR (
            ${table.optionLiquidityPass} = 1
            AND ${table.optionHistoricalOptionsEvidenceId} IS NOT NULL
            AND length(${table.optionHistoricalOptionsEvidenceId}) > 0
          )
        )
      )
    `,
    ),
  ],
);

export const recommendationCitations = sqliteTable(
  "recommendation_citations",
  {
    id: text("id").primaryKey(),
    recommendationId: text("recommendation_id")
      .notNull()
      .references(() => recommendations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    source: text("source").notNull(),
    publishedAt: text("published_at").notNull(),
    retrievedAt: text("retrieved_at").notNull(),
  },
  (table) => [index("recommendation_citations_recommendation_idx").on(table.recommendationId)],
);
