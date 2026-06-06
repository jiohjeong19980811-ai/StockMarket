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

export const priceBars = sqliteTable(
  "price_bars",
  {
    id: text("id").primaryKey(),
    providerRecordId: text("provider_record_id")
      .notNull()
      .references(() => providerRecords.id),
    providerName: text("provider_name").notNull(),
    instrumentId: text("instrument_id").references(() => instruments.id),
    symbol: text("symbol").notNull(),
    barInterval: text("bar_interval", { enum: ["1d", "1h", "15m", "5m", "1m"] }).notNull(),
    timestamp: text("timestamp").notNull(),
    open: real("open").notNull(),
    high: real("high").notNull(),
    low: real("low").notNull(),
    close: real("close").notNull(),
    adjustedClose: real("adjusted_close"),
    volume: integer("volume").notNull(),
    currency: text("currency").notNull().default("USD"),
  },
  (table) => [
    uniqueIndex("price_bars_provider_symbol_interval_timestamp_unique").on(
      table.providerName,
      table.symbol,
      table.barInterval,
      table.timestamp,
    ),
    index("price_bars_symbol_timestamp_idx").on(table.symbol, table.timestamp),
    index("price_bars_provider_record_idx").on(table.providerRecordId),
    check("price_bars_provider_name_nonempty", sql`length(${table.providerName}) > 0`),
    check("price_bars_symbol_nonempty", sql`length(${table.symbol}) > 0`),
    check("price_bars_timestamp_nonempty", sql`length(${table.timestamp}) > 0`),
    check("price_bars_open_positive", sql`${table.open} > 0`),
    check("price_bars_high_positive", sql`${table.high} > 0`),
    check("price_bars_low_positive", sql`${table.low} > 0`),
    check("price_bars_close_positive", sql`${table.close} > 0`),
    check(
      "price_bars_adjusted_close_positive",
      sql`${table.adjustedClose} IS NULL OR ${table.adjustedClose} > 0`,
    ),
    check("price_bars_volume_nonnegative", sql`${table.volume} >= 0`),
    check("price_bars_high_low_order", sql`${table.high} >= ${table.low}`),
    check(
      "price_bars_ohlc_bounds",
      sql`${table.high} >= ${table.open} AND ${table.high} >= ${table.close}
        AND ${table.low} <= ${table.open} AND ${table.low} <= ${table.close}`,
    ),
  ],
);

export const newsArticles = sqliteTable(
  "news_articles",
  {
    id: text("id").primaryKey(),
    providerRecordId: text("provider_record_id")
      .notNull()
      .references(() => providerRecords.id),
    providerName: text("provider_name").notNull(),
    symbol: text("symbol").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    source: text("source").notNull(),
    publishedAt: text("published_at").notNull(),
    retrievedAt: text("retrieved_at").notNull(),
    summary: text("summary").notNull().default(""),
    sentimentScore: real("sentiment_score"),
    duplicateKey: text("duplicate_key").notNull(),
  },
  (table) => [
    uniqueIndex("news_articles_duplicate_key_unique").on(table.duplicateKey),
    index("news_articles_symbol_published_idx").on(table.symbol, table.publishedAt),
    index("news_articles_provider_record_idx").on(table.providerRecordId),
    check("news_articles_provider_name_nonempty", sql`length(${table.providerName}) > 0`),
    check("news_articles_symbol_nonempty", sql`length(${table.symbol}) > 0`),
    check("news_articles_title_nonempty", sql`length(${table.title}) > 0`),
    check("news_articles_url_nonempty", sql`length(${table.url}) > 0`),
    check("news_articles_source_nonempty", sql`length(${table.source}) > 0`),
    check("news_articles_published_nonempty", sql`length(${table.publishedAt}) > 0`),
    check("news_articles_retrieved_nonempty", sql`length(${table.retrievedAt}) > 0`),
    check("news_articles_duplicate_key_nonempty", sql`length(${table.duplicateKey}) > 0`),
    check(
      "news_articles_sentiment_range",
      sql`${table.sentimentScore} IS NULL OR (${table.sentimentScore} >= -1 AND ${table.sentimentScore} <= 1)`,
    ),
  ],
);

export const earningsEvents = sqliteTable(
  "earnings_events",
  {
    id: text("id").primaryKey(),
    providerRecordId: text("provider_record_id")
      .notNull()
      .references(() => providerRecords.id),
    providerName: text("provider_name").notNull(),
    symbol: text("symbol").notNull(),
    fiscalPeriod: text("fiscal_period").notNull(),
    announcementDate: text("announcement_date").notNull(),
    announcementTiming: text("announcement_timing", {
      enum: ["pre_market", "after_market", "during_market", "unknown"],
    }).notNull(),
    epsEstimate: real("eps_estimate"),
    epsActual: real("eps_actual"),
    epsSurprise: real("eps_surprise"),
    revenueEstimate: real("revenue_estimate"),
    revenueActual: real("revenue_actual"),
    guidanceText: text("guidance_text").notNull().default(""),
    sourceUrl: text("source_url").notNull(),
  },
  (table) => [
    uniqueIndex("earnings_events_provider_symbol_period_date_unique").on(
      table.providerName,
      table.symbol,
      table.fiscalPeriod,
      table.announcementDate,
    ),
    index("earnings_events_symbol_date_idx").on(table.symbol, table.announcementDate),
    index("earnings_events_provider_record_idx").on(table.providerRecordId),
    check("earnings_events_provider_name_nonempty", sql`length(${table.providerName}) > 0`),
    check("earnings_events_symbol_nonempty", sql`length(${table.symbol}) > 0`),
    check("earnings_events_period_nonempty", sql`length(${table.fiscalPeriod}) > 0`),
    check("earnings_events_date_nonempty", sql`length(${table.announcementDate}) > 0`),
    check("earnings_events_source_url_nonempty", sql`length(${table.sourceUrl}) > 0`),
  ],
);

export const optionQuotes = sqliteTable(
  "option_quotes",
  {
    id: text("id").primaryKey(),
    providerRecordId: text("provider_record_id")
      .notNull()
      .references(() => providerRecords.id),
    providerName: text("provider_name").notNull(),
    underlyingSymbol: text("underlying_symbol").notNull(),
    contractSymbol: text("contract_symbol").notNull(),
    expiration: text("expiration").notNull(),
    strike: real("strike").notNull(),
    optionType: text("option_type", { enum: ["call", "put"] }).notNull(),
    quoteTimestamp: text("quote_timestamp").notNull(),
    bid: real("bid").notNull(),
    ask: real("ask").notNull(),
    mid: real("mid").notNull(),
    last: real("last"),
    volume: integer("volume").notNull(),
    openInterest: integer("open_interest").notNull(),
    impliedVolatility: real("implied_volatility").notNull(),
    underlyingPrice: real("underlying_price").notNull(),
    delta: real("delta"),
    gamma: real("gamma"),
    theta: real("theta"),
    vega: real("vega"),
    liquidityFlagsJson: text("liquidity_flags_json").notNull().default("[]"),
  },
  (table) => [
    uniqueIndex("option_quotes_provider_contract_timestamp_unique").on(
      table.providerName,
      table.contractSymbol,
      table.quoteTimestamp,
    ),
    index("option_quotes_underlying_expiration_idx").on(table.underlyingSymbol, table.expiration),
    index("option_quotes_provider_record_idx").on(table.providerRecordId),
    check("option_quotes_provider_name_nonempty", sql`length(${table.providerName}) > 0`),
    check("option_quotes_underlying_nonempty", sql`length(${table.underlyingSymbol}) > 0`),
    check("option_quotes_contract_nonempty", sql`length(${table.contractSymbol}) > 0`),
    check("option_quotes_expiration_nonempty", sql`length(${table.expiration}) > 0`),
    check("option_quotes_timestamp_nonempty", sql`length(${table.quoteTimestamp}) > 0`),
    check("option_quotes_strike_positive", sql`${table.strike} > 0`),
    check("option_quotes_bid_nonnegative", sql`${table.bid} >= 0`),
    check("option_quotes_ask_positive", sql`${table.ask} > 0`),
    check("option_quotes_mid_positive", sql`${table.mid} > 0`),
    check("option_quotes_last_nonnegative", sql`${table.last} IS NULL OR ${table.last} >= 0`),
    check("option_quotes_volume_nonnegative", sql`${table.volume} >= 0`),
    check("option_quotes_open_interest_nonnegative", sql`${table.openInterest} >= 0`),
    check("option_quotes_iv_positive", sql`${table.impliedVolatility} > 0`),
    check("option_quotes_underlying_price_positive", sql`${table.underlyingPrice} > 0`),
    check(
      "option_quotes_delta_range",
      sql`${table.delta} IS NULL OR (${table.delta} >= -1 AND ${table.delta} <= 1)`,
    ),
    check("option_quotes_gamma_nonnegative", sql`${table.gamma} IS NULL OR ${table.gamma} >= 0`),
    check("option_quotes_vega_nonnegative", sql`${table.vega} IS NULL OR ${table.vega} >= 0`),
    check("option_quotes_ask_bid_order", sql`${table.ask} >= ${table.bid}`),
    check(
      "option_quotes_mid_bounds",
      sql`${table.mid} >= ${table.bid} AND ${table.mid} <= ${table.ask}`,
    ),
    check(
      "option_quotes_liquidity_flags_valid",
      sql`
        json_valid(${table.liquidityFlagsJson})
        AND json_type(${table.liquidityFlagsJson}) = 'array'
      `,
    ),
  ],
);

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
    evidenceGate: text("evidence_gate", {
      enum: ["verified", "needs_more_data", "blocked"],
    })
      .notNull()
      .default("needs_more_data"),
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
      "recommendations_invalidation_conditions_valid",
      sql`
        json_valid(${table.invalidationConditionsJson})
        AND json_type(${table.invalidationConditionsJson}) = 'array'
        AND json_array_length(${table.invalidationConditionsJson}) > 0
      `,
    ),
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
        AND ${table.evidenceGate} = 'verified'
        AND (
          length(coalesce(${table.backtestRunId}, '')) > 0
          OR length(coalesce(${table.paperTradeEvidenceId}, '')) > 0
        )
        AND ${table.freshnessStatus} = 'fresh'
        AND ${table.liquidityDecision} = 'pass'
        AND ${table.liquidityScore} >= 70
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

export const paperTrades = sqliteTable(
  "paper_trades",
  {
    id: text("id").primaryKey(),
    recommendationId: text("recommendation_id")
      .notNull()
      .references(() => recommendations.id),
    accountId: text("account_id").notNull(),
    mode: text("mode", { enum: ["paper"] })
      .notNull()
      .default("paper"),
    status: text("status", { enum: ["open", "closed", "cancelled"] }).notNull(),
    ticker: text("ticker").notNull(),
    instrumentType: text("instrument_type", { enum: ["stock"] }).notNull(),
    strategyVersionId: text("strategy_version_id")
      .notNull()
      .references(() => strategyVersions.id),
    operatorApprovalAuditLogId: text("operator_approval_audit_log_id")
      .notNull()
      .references(() => auditLogs.id),
    entryAuditLogId: text("entry_audit_log_id")
      .notNull()
      .references(() => auditLogs.id),
    thesisSnapshot: text("thesis_snapshot").notNull(),
    entryReason: text("entry_reason").notNull(),
    downsideScenario: text("downside_scenario").notNull(),
    invalidationConditionsJson: text("invalidation_conditions_json").notNull(),
    entryType: text("entry_type", { enum: ["market", "limit"] }).notNull(),
    requestedEntryPrice: real("requested_entry_price").notNull(),
    simulatedEntryPrice: real("simulated_entry_price").notNull(),
    quantity: integer("quantity").notNull(),
    enteredAt: text("entered_at").notNull(),
    stopLoss: real("stop_loss").notNull(),
    profitTarget: real("profit_target").notNull(),
    timeStopAt: text("time_stop_at").notNull(),
    maxLossAmount: real("max_loss_amount").notNull(),
    riskPctOfEquity: real("risk_pct_of_equity").notNull(),
    accountEquityAtEntry: real("account_equity_at_entry").notNull(),
    singleNameExposurePct: real("single_name_exposure_pct").notNull(),
    sectorExposurePct: real("sector_exposure_pct").notNull(),
    correlatedExposurePct: real("correlated_exposure_pct").notNull(),
    dailyLossPctAtEntry: real("daily_loss_pct_at_entry").notNull(),
    liveTradingEnabled: integer("live_trading_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    brokerExecution: integer("broker_execution", { mode: "boolean" }).notNull().default(false),
    exitAuditLogId: text("exit_audit_log_id").references(() => auditLogs.id),
    closedAt: text("closed_at"),
    exitPrice: real("exit_price"),
    exitReason: text("exit_reason"),
    lessonsLearned: text("lessons_learned"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("paper_trades_recommendation_unique").on(table.recommendationId),
    index("paper_trades_ticker_status_idx").on(table.ticker, table.status),
    index("paper_trades_strategy_version_idx").on(table.strategyVersionId),
    index("paper_trades_account_status_idx").on(table.accountId, table.status),
    check("paper_trades_mode_paper_only", sql`${table.mode} = 'paper'`),
    check("paper_trades_stock_only_mvp", sql`${table.instrumentType} = 'stock'`),
    check("paper_trades_no_live_trading", sql`${table.liveTradingEnabled} = 0`),
    check("paper_trades_no_broker_execution", sql`${table.brokerExecution} = 0`),
    check("paper_trades_account_nonempty", sql`length(${table.accountId}) > 0`),
    check("paper_trades_ticker_nonempty", sql`length(${table.ticker}) > 0`),
    check("paper_trades_thesis_nonempty", sql`length(${table.thesisSnapshot}) > 0`),
    check("paper_trades_entry_reason_nonempty", sql`length(${table.entryReason}) > 0`),
    check("paper_trades_downside_nonempty", sql`length(${table.downsideScenario}) > 0`),
    check(
      "paper_trades_invalidation_conditions_valid",
      sql`
        json_valid(${table.invalidationConditionsJson})
        AND json_type(${table.invalidationConditionsJson}) = 'array'
        AND json_array_length(${table.invalidationConditionsJson}) > 0
      `,
    ),
    check("paper_trades_requested_entry_positive", sql`${table.requestedEntryPrice} > 0`),
    check("paper_trades_simulated_entry_positive", sql`${table.simulatedEntryPrice} > 0`),
    check("paper_trades_quantity_positive", sql`${table.quantity} > 0`),
    check("paper_trades_entered_at_nonempty", sql`length(${table.enteredAt}) > 0`),
    check(
      "paper_trades_stop_loss_valid",
      sql`${table.stopLoss} > 0 AND ${table.stopLoss} < ${table.simulatedEntryPrice}`,
    ),
    check(
      "paper_trades_profit_target_valid",
      sql`${table.profitTarget} > ${table.simulatedEntryPrice}`,
    ),
    check("paper_trades_time_stop_nonempty", sql`length(${table.timeStopAt}) > 0`),
    check("paper_trades_max_loss_positive", sql`${table.maxLossAmount} > 0`),
    check("paper_trades_account_equity_positive", sql`${table.accountEquityAtEntry} > 0`),
    check(
      "paper_trades_max_loss_cap",
      sql`${table.maxLossAmount} <= ${table.accountEquityAtEntry} * 0.005`,
    ),
    check(
      "paper_trades_risk_pct_cap",
      sql`${table.riskPctOfEquity} >= 0 AND ${table.riskPctOfEquity} <= 0.5`,
    ),
    check(
      "paper_trades_risk_pct_matches_max_loss",
      sql`abs(${table.riskPctOfEquity} - ((${table.maxLossAmount} / ${table.accountEquityAtEntry}) * 100)) <= 0.0001`,
    ),
    check(
      "paper_trades_single_name_cap",
      sql`${table.singleNameExposurePct} >= 0 AND ${table.singleNameExposurePct} <= 5`,
    ),
    check(
      "paper_trades_sector_cap",
      sql`${table.sectorExposurePct} >= 0 AND ${table.sectorExposurePct} <= 20`,
    ),
    check(
      "paper_trades_correlated_cap",
      sql`${table.correlatedExposurePct} >= 0 AND ${table.correlatedExposurePct} <= 15`,
    ),
    check(
      "paper_trades_daily_loss_cap",
      sql`${table.dailyLossPctAtEntry} >= 0 AND ${table.dailyLossPctAtEntry} <= 2`,
    ),
    check(
      "paper_trades_closed_exit_details",
      sql`
        ${table.status} != 'closed'
        OR (
          ${table.closedAt} IS NOT NULL AND length(${table.closedAt}) > 0
          AND ${table.exitPrice} IS NOT NULL AND ${table.exitPrice} > 0
          AND ${table.exitReason} IS NOT NULL AND length(${table.exitReason}) > 0
          AND ${table.lessonsLearned} IS NOT NULL AND length(${table.lessonsLearned}) > 0
          AND ${table.exitAuditLogId} IS NOT NULL AND length(${table.exitAuditLogId}) > 0
        )
      `,
    ),
    check("paper_trades_created_at_nonempty", sql`length(${table.createdAt}) > 0`),
    check("paper_trades_updated_at_nonempty", sql`length(${table.updatedAt}) > 0`),
  ],
);

export const backtestRuns = sqliteTable(
  "backtest_runs",
  {
    id: text("id").primaryKey(),
    strategyVersionId: text("strategy_version_id")
      .notNull()
      .references(() => strategyVersions.id),
    strategyFamily: text("strategy_family").notNull(),
    strategyVersionLabel: text("strategy_version_label").notNull(),
    instrumentType: text("instrument_type", { enum: ["stock"] }).notNull(),
    universe: text("universe").notNull(),
    periodStart: text("period_start").notNull(),
    periodEnd: text("period_end").notNull(),
    benchmarkReturnPct: real("benchmark_return_pct").notNull(),
    promotionGate: text("promotion_gate", {
      enum: ["ready_for_review", "needs_more_data", "blocked"],
    }).notNull(),
    reasonCodesJson: text("reason_codes_json").notNull(),
    metricsJson: text("metrics_json").notNull(),
    assumptionsJson: text("assumptions_json").notNull(),
    sourceCitationsJson: text("source_citations_json").notNull(),
    freshnessStatus: text("freshness_status", {
      enum: ["fresh", "stale", "partial", "missing"],
    }).notNull(),
    freshnessAsOf: text("freshness_as_of").notNull(),
    freshnessNotesJson: text("freshness_notes_json").notNull(),
    tradeCount: integer("trade_count").notNull(),
    winRatePct: real("win_rate_pct").notNull(),
    maxDrawdownPct: real("max_drawdown_pct").notNull(),
    netReturnPct: real("net_return_pct").notNull(),
    benchmarkRelativeReturnPct: real("benchmark_relative_return_pct").notNull(),
    optionsProxy: integer("options_proxy", { mode: "boolean" }).notNull().default(false),
    notRecommendation: integer("not_recommendation", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("backtest_runs_strategy_version_idx").on(table.strategyVersionId),
    index("backtest_runs_gate_idx").on(table.promotionGate),
    check("backtest_runs_strategy_family_nonempty", sql`length(${table.strategyFamily}) > 0`),
    check(
      "backtest_runs_strategy_version_label_nonempty",
      sql`length(${table.strategyVersionLabel}) > 0`,
    ),
    check("backtest_runs_stock_only", sql`${table.instrumentType} = 'stock'`),
    check("backtest_runs_universe_nonempty", sql`length(${table.universe}) > 0`),
    check("backtest_runs_period_start_nonempty", sql`length(${table.periodStart}) > 0`),
    check(
      "backtest_runs_period_end_valid",
      sql`length(${table.periodEnd}) > 0 AND ${table.periodEnd} > ${table.periodStart}`,
    ),
    check(
      "backtest_runs_promotion_gate_valid",
      sql`${table.promotionGate} IN ('ready_for_review', 'needs_more_data', 'blocked')`,
    ),
    check(
      "backtest_runs_reason_codes_valid",
      sql`json_valid(${table.reasonCodesJson}) AND json_type(${table.reasonCodesJson}) = 'array'`,
    ),
    check(
      "backtest_runs_metrics_valid",
      sql`json_valid(${table.metricsJson}) AND json_type(${table.metricsJson}) = 'object'`,
    ),
    check(
      "backtest_runs_assumptions_valid",
      sql`json_valid(${table.assumptionsJson}) AND json_type(${table.assumptionsJson}) = 'object'`,
    ),
    check(
      "backtest_runs_source_citations_valid",
      sql`
        json_valid(${table.sourceCitationsJson})
        AND json_type(${table.sourceCitationsJson}) = 'array'
        AND json_array_length(${table.sourceCitationsJson}) > 0
      `,
    ),
    check(
      "backtest_runs_freshness_status_valid",
      sql`${table.freshnessStatus} IN ('fresh', 'stale', 'partial', 'missing')`,
    ),
    check("backtest_runs_freshness_as_of_nonempty", sql`length(${table.freshnessAsOf}) > 0`),
    check(
      "backtest_runs_freshness_notes_valid",
      sql`
        json_valid(${table.freshnessNotesJson})
        AND json_type(${table.freshnessNotesJson}) = 'array'
      `,
    ),
    check("backtest_runs_trade_count_nonnegative", sql`${table.tradeCount} >= 0`),
    check(
      "backtest_runs_win_rate_range",
      sql`${table.winRatePct} >= 0 AND ${table.winRatePct} <= 100`,
    ),
    check("backtest_runs_max_drawdown_nonnegative", sql`${table.maxDrawdownPct} >= 0`),
    check("backtest_runs_no_options_proxy", sql`${table.optionsProxy} = 0`),
    check("backtest_runs_not_recommendation", sql`${table.notRecommendation} = 1`),
    check("backtest_runs_created_at_nonempty", sql`length(${table.createdAt}) > 0`),
    check("backtest_runs_updated_at_nonempty", sql`length(${table.updatedAt}) > 0`),
  ],
);

export const backtestRunTrades = sqliteTable(
  "backtest_run_trades",
  {
    id: text("id").primaryKey(),
    backtestRunId: text("backtest_run_id")
      .notNull()
      .references(() => backtestRuns.id, { onDelete: "cascade" }),
    sourceTradeId: text("source_trade_id").notNull(),
    ticker: text("ticker").notNull(),
    netReturnPct: real("net_return_pct").notNull(),
    grossReturnPct: real("gross_return_pct").notNull(),
    holdingDays: real("holding_days").notNull(),
    exitOrder: integer("exit_order").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("backtest_run_trades_run_source_unique").on(
      table.backtestRunId,
      table.sourceTradeId,
    ),
    index("backtest_run_trades_run_idx").on(table.backtestRunId, table.exitOrder),
    check("backtest_run_trades_source_trade_nonempty", sql`length(${table.sourceTradeId}) > 0`),
    check("backtest_run_trades_ticker_nonempty", sql`length(${table.ticker}) > 0`),
    check("backtest_run_trades_holding_days_nonnegative", sql`${table.holdingDays} >= 0`),
    check("backtest_run_trades_exit_order_nonnegative", sql`${table.exitOrder} >= 0`),
    check("backtest_run_trades_created_at_nonempty", sql`length(${table.createdAt}) > 0`),
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

export const dailyOpportunityReports = sqliteTable(
  "daily_opportunity_reports",
  {
    id: text("id").primaryKey(),
    generatedAt: text("generated_at").notNull(),
    outcome: text("outcome", { enum: ["ranked_opportunities", "no_good_trades"] }).notNull(),
    reviewedCount: integer("reviewed_count").notNull(),
    opportunityCount: integer("opportunity_count").notNull(),
    providerKeysRequiredJson: text("provider_keys_required_json").notNull(),
    disclaimer: text("disclaimer").notNull(),
    noGoodMessage: text("no_good_message"),
    noGoodReasonCodesJson: text("no_good_reason_codes_json").notNull(),
    liveTradingEnabled: integer("live_trading_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    notRecommendation: integer("not_recommendation", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("daily_opportunity_reports_generated_idx").on(table.generatedAt),
    check("daily_opportunity_reports_reviewed_nonnegative", sql`${table.reviewedCount} >= 0`),
    check("daily_opportunity_reports_opportunity_nonnegative", sql`${table.opportunityCount} >= 0`),
    check(
      "daily_opportunity_reports_provider_keys_valid",
      sql`
        json_valid(${table.providerKeysRequiredJson})
        AND json_type(${table.providerKeysRequiredJson}) = 'array'
      `,
    ),
    check("daily_opportunity_reports_disclaimer_nonempty", sql`length(${table.disclaimer}) > 0`),
    check(
      "daily_opportunity_reports_no_good_codes_valid",
      sql`
        json_valid(${table.noGoodReasonCodesJson})
        AND json_type(${table.noGoodReasonCodesJson}) = 'array'
      `,
    ),
    check("daily_opportunity_reports_no_live_trading", sql`${table.liveTradingEnabled} = 0`),
    check("daily_opportunity_reports_not_recommendation", sql`${table.notRecommendation} = 1`),
    check(
      "daily_opportunity_reports_outcome_consistent",
      sql`
        (
          ${table.outcome} = 'ranked_opportunities'
          AND ${table.opportunityCount} > 0
          AND ${table.noGoodMessage} IS NULL
        )
        OR (
          ${table.outcome} = 'no_good_trades'
          AND ${table.opportunityCount} = 0
          AND ${table.noGoodMessage} IS NOT NULL
          AND length(${table.noGoodMessage}) > 0
        )
      `,
    ),
    check("daily_opportunity_reports_created_at_nonempty", sql`length(${table.createdAt}) > 0`),
    check("daily_opportunity_reports_updated_at_nonempty", sql`length(${table.updatedAt}) > 0`),
  ],
);

export const dailyOpportunityReportRecommendations = sqliteTable(
  "daily_opportunity_report_recommendations",
  {
    id: text("id").primaryKey(),
    dailyReportId: text("daily_report_id")
      .notNull()
      .references(() => dailyOpportunityReports.id, { onDelete: "cascade" }),
    recommendationId: text("recommendation_id")
      .notNull()
      .references(() => recommendations.id, { onDelete: "cascade" }),
    reportRank: integer("report_rank").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("daily_report_recommendations_report_rec_unique").on(
      table.dailyReportId,
      table.recommendationId,
    ),
    uniqueIndex("daily_report_recommendations_report_rank_unique").on(
      table.dailyReportId,
      table.reportRank,
    ),
    index("daily_opportunity_report_recommendations_report_idx").on(
      table.dailyReportId,
      table.reportRank,
    ),
    check("daily_report_recommendations_rank_positive", sql`${table.reportRank} > 0`),
    check("daily_report_recommendations_created_at_nonempty", sql`length(${table.createdAt}) > 0`),
  ],
);

export const opportunityDecisions = sqliteTable(
  "opportunity_decisions",
  {
    id: text("id").primaryKey(),
    recommendationId: text("recommendation_id")
      .notNull()
      .references(() => recommendations.id, { onDelete: "cascade" }),
    auditLogId: text("audit_log_id")
      .notNull()
      .references(() => auditLogs.id),
    mode: text("mode").notNull().default("paper"),
    operatorDecision: text("operator_decision", {
      enum: ["watchlist", "paper_trade", "avoid", "needs_more_data"],
    }).notNull(),
    reasonCodesJson: text("reason_codes_json").notNull().default("[]"),
    liveTradingEnabled: integer("live_trading_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    brokerExecution: integer("broker_execution", { mode: "boolean" }).notNull().default(false),
    notRecommendation: integer("not_recommendation", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("opportunity_decisions_audit_unique").on(table.auditLogId),
    index("opportunity_decisions_recommendation_idx").on(table.recommendationId, table.createdAt),
    index("opportunity_decisions_operator_decision_idx").on(
      table.operatorDecision,
      table.createdAt,
    ),
    check("opportunity_decisions_id_nonempty", sql`length(${table.id}) > 0`),
    check(
      "opportunity_decisions_recommendation_nonempty",
      sql`length(${table.recommendationId}) > 0`,
    ),
    check("opportunity_decisions_audit_nonempty", sql`length(${table.auditLogId}) > 0`),
    check("opportunity_decisions_mode_paper_only", sql`${table.mode} = 'paper'`),
    check(
      "opportunity_decisions_reason_codes_valid",
      sql`
        json_valid(${table.reasonCodesJson})
        AND json_type(${table.reasonCodesJson}) = 'array'
        AND json_array_length(${table.reasonCodesJson}) > 0
      `,
    ),
    check("opportunity_decisions_no_live_trading", sql`${table.liveTradingEnabled} = 0`),
    check("opportunity_decisions_no_broker_execution", sql`${table.brokerExecution} = 0`),
    check("opportunity_decisions_not_recommendation", sql`${table.notRecommendation} = 1`),
    check("opportunity_decisions_created_at_nonempty", sql`length(${table.createdAt}) > 0`),
    check("opportunity_decisions_updated_at_nonempty", sql`length(${table.updatedAt}) > 0`),
  ],
);
