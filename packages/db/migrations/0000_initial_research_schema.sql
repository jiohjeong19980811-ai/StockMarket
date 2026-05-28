CREATE TABLE instruments (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  instrument_type TEXT NOT NULL CHECK (instrument_type IN ('stock', 'etf', 'option', 'index')),
  exchange TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (symbol, exchange)
);

CREATE TABLE ingestion_runs (
  id TEXT PRIMARY KEY,
  provider_name TEXT NOT NULL,
  provider_dataset TEXT NOT NULL,
  adapter_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  started_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE provider_records (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL REFERENCES ingestion_runs(id),
  provider_name TEXT NOT NULL,
  provider_dataset TEXT NOT NULL,
  provider_record_id TEXT,
  content_hash TEXT NOT NULL,
  provider_timestamp TEXT,
  source_published_at TEXT,
  retrieved_at TEXT NOT NULL,
  ingested_at TEXT NOT NULL,
  normalized_at TEXT NOT NULL,
  adapter_version TEXT NOT NULL,
  normalization_version TEXT NOT NULL,
  quality_status TEXT NOT NULL CHECK (quality_status IN ('fresh', 'stale', 'partial', 'missing')),
  quality_flags_json TEXT NOT NULL DEFAULT '[]',
  quality_notes TEXT NOT NULL DEFAULT '',
  stale_reason TEXT,
  entitlement_status TEXT NOT NULL DEFAULT 'not_reviewed',
  source_url TEXT,
  UNIQUE (provider_name, provider_dataset, provider_record_id),
  UNIQUE (provider_name, provider_dataset, content_hash)
);

CREATE INDEX provider_records_ingestion_run_idx ON provider_records(ingestion_run_id);

CREATE TABLE data_quality_events (
  id TEXT PRIMARY KEY,
  provider_record_id TEXT REFERENCES provider_records(id),
  ingestion_run_id TEXT REFERENCES ingestion_runs(id),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  quality_status TEXT NOT NULL CHECK (quality_status IN ('fresh', 'stale', 'partial', 'missing')),
  message TEXT NOT NULL CHECK (length(message) > 0),
  created_at TEXT NOT NULL
);

CREATE TABLE strategy_definitions (
  id TEXT PRIMARY KEY,
  family TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  allowed_instrument_types_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE strategy_versions (
  id TEXT PRIMARY KEY,
  strategy_definition_id TEXT NOT NULL REFERENCES strategy_definitions(id),
  version TEXT NOT NULL,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('research_only', 'watchlist_eligible', 'paper_trade_eligible', 'avoid', 'needs_more_data')),
  promotion_state TEXT NOT NULL CHECK (promotion_state IN ('research_only', 'watchlist_eligible', 'paper_trade_eligible', 'avoid', 'needs_more_data')),
  required_data_json TEXT NOT NULL,
  risk_policy_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (strategy_definition_id, version)
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'operator')),
  actor_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  pipeline_run_id TEXT,
  strategy_version_id TEXT,
  scoring_version TEXT,
  risk_policy_version TEXT,
  provider_name TEXT,
  provider_timestamp TEXT,
  retrieved_at TEXT,
  risk_decision TEXT,
  risk_reasons_json TEXT NOT NULL DEFAULT '[]',
  operator_decision TEXT,
  operator_notes TEXT,
  ai_model TEXT,
  ai_prompt_version TEXT
);

CREATE TABLE recommendations (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  instrument_type TEXT NOT NULL CHECK (instrument_type IN ('stock', 'long_call', 'long_put', 'debit_spread')),
  strategy_version_id TEXT NOT NULL REFERENCES strategy_versions(id),
  decision TEXT NOT NULL CHECK (decision IN ('watchlist', 'paper_trade', 'avoid', 'needs_more_data')),
  evidence_status TEXT NOT NULL CHECK (evidence_status IN ('research_only', 'watchlist_eligible', 'paper_trade_eligible', 'avoid', 'needs_more_data')),
  thesis TEXT NOT NULL CHECK (length(thesis) > 0),
  bull_case TEXT NOT NULL CHECK (length(bull_case) > 0),
  bear_case TEXT NOT NULL CHECK (length(bear_case) > 0),
  downside_scenario TEXT NOT NULL CHECK (length(downside_scenario) > 0),
  invalidation_conditions_json TEXT NOT NULL CHECK (
    json_valid(invalidation_conditions_json)
    AND json_type(invalidation_conditions_json) = 'array'
    AND json_array_length(invalidation_conditions_json) > 0
  ),
  why_system_might_be_wrong TEXT NOT NULL CHECK (length(why_system_might_be_wrong) > 0),
  primary_citation_title TEXT NOT NULL CHECK (length(primary_citation_title) > 0),
  primary_citation_url TEXT NOT NULL CHECK (length(primary_citation_url) > 0),
  primary_citation_source TEXT NOT NULL CHECK (length(primary_citation_source) > 0),
  primary_citation_published_at TEXT NOT NULL CHECK (length(primary_citation_published_at) > 0),
  primary_citation_retrieved_at TEXT NOT NULL CHECK (length(primary_citation_retrieved_at) > 0),
  freshness_status TEXT NOT NULL CHECK (freshness_status IN ('fresh', 'stale', 'partial', 'missing')),
  freshness_as_of TEXT NOT NULL,
  freshness_notes_json TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  liquidity_score INTEGER NOT NULL CHECK (liquidity_score BETWEEN 0 AND 100),
  liquidity_decision TEXT NOT NULL CHECK (liquidity_decision IN ('pass', 'fail')),
  risk_decision TEXT NOT NULL CHECK (risk_decision IN ('pass', 'fail')),
  backtest_run_id TEXT,
  paper_trade_evidence_id TEXT,
  option_max_loss REAL,
  option_expiration TEXT,
  option_strike_logic TEXT,
  option_bid REAL,
  option_ask REAL,
  option_mid REAL,
  option_volume INTEGER,
  option_open_interest INTEGER,
  option_implied_volatility REAL,
  option_breakeven REAL,
  option_liquidity_pass INTEGER CHECK (option_liquidity_pass IS NULL OR option_liquidity_pass IN (0, 1)),
  option_spread_risk TEXT,
  option_event_risk TEXT,
  option_theta_risk TEXT,
  option_historical_options_evidence_id TEXT,
  operator_audit_log_id TEXT NOT NULL REFERENCES audit_logs(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    instrument_type = 'stock'
    OR (
      option_max_loss IS NOT NULL AND option_max_loss > 0
      AND option_expiration IS NOT NULL AND length(option_expiration) > 0
      AND option_strike_logic IS NOT NULL AND length(option_strike_logic) > 0
      AND option_bid IS NOT NULL AND option_bid > 0
      AND option_ask IS NOT NULL AND option_ask >= option_bid
      AND option_mid IS NOT NULL AND option_mid > 0
      AND option_volume IS NOT NULL AND option_volume >= 0
      AND option_open_interest IS NOT NULL AND option_open_interest >= 0
      AND option_implied_volatility IS NOT NULL AND option_implied_volatility > 0
      AND option_breakeven IS NOT NULL AND option_breakeven > 0
      AND option_liquidity_pass IS NOT NULL
      AND option_spread_risk IS NOT NULL AND length(option_spread_risk) > 0
      AND option_event_risk IS NOT NULL AND length(option_event_risk) > 0
      AND option_theta_risk IS NOT NULL AND length(option_theta_risk) > 0
    )
  ),
  CHECK (
    decision != 'paper_trade'
    OR (
      evidence_status = 'paper_trade_eligible'
      AND (length(coalesce(backtest_run_id, '')) > 0 OR length(coalesce(paper_trade_evidence_id, '')) > 0)
      AND freshness_status = 'fresh'
      AND liquidity_decision = 'pass'
      AND liquidity_score >= 70
      AND risk_decision = 'pass'
      AND (
        instrument_type = 'stock'
        OR (
          option_liquidity_pass = 1
          AND option_historical_options_evidence_id IS NOT NULL
          AND length(option_historical_options_evidence_id) > 0
        )
      )
    )
  )
);

CREATE INDEX recommendations_ticker_idx ON recommendations(ticker);
CREATE INDEX recommendations_strategy_version_idx ON recommendations(strategy_version_id);

CREATE TABLE recommendation_citations (
  id TEXT PRIMARY KEY,
  recommendation_id TEXT NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) > 0),
  url TEXT NOT NULL CHECK (length(url) > 0),
  source TEXT NOT NULL CHECK (length(source) > 0),
  published_at TEXT NOT NULL CHECK (length(published_at) > 0),
  retrieved_at TEXT NOT NULL CHECK (length(retrieved_at) > 0)
);

CREATE INDEX recommendation_citations_recommendation_idx ON recommendation_citations(recommendation_id);
