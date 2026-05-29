CREATE TABLE paper_trades (
  id TEXT PRIMARY KEY,
  recommendation_id TEXT NOT NULL REFERENCES recommendations(id),
  account_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'paper' CHECK (mode = 'paper'),
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'cancelled')),
  ticker TEXT NOT NULL,
  instrument_type TEXT NOT NULL CHECK (instrument_type = 'stock'),
  strategy_version_id TEXT NOT NULL REFERENCES strategy_versions(id),
  operator_approval_audit_log_id TEXT NOT NULL REFERENCES audit_logs(id),
  entry_audit_log_id TEXT NOT NULL REFERENCES audit_logs(id),
  thesis_snapshot TEXT NOT NULL,
  entry_reason TEXT NOT NULL,
  downside_scenario TEXT NOT NULL,
  invalidation_conditions_json TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('market', 'limit')),
  requested_entry_price REAL NOT NULL,
  simulated_entry_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  entered_at TEXT NOT NULL,
  stop_loss REAL NOT NULL,
  profit_target REAL NOT NULL,
  time_stop_at TEXT NOT NULL,
  max_loss_amount REAL NOT NULL,
  risk_pct_of_equity REAL NOT NULL,
  account_equity_at_entry REAL NOT NULL,
  single_name_exposure_pct REAL NOT NULL,
  sector_exposure_pct REAL NOT NULL,
  correlated_exposure_pct REAL NOT NULL,
  daily_loss_pct_at_entry REAL NOT NULL,
  live_trading_enabled INTEGER NOT NULL DEFAULT 0 CHECK (live_trading_enabled = 0),
  broker_execution INTEGER NOT NULL DEFAULT 0 CHECK (broker_execution = 0),
  closed_at TEXT,
  exit_price REAL,
  exit_reason TEXT,
  lessons_learned TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(account_id) > 0),
  CHECK (length(ticker) > 0),
  CHECK (length(thesis_snapshot) > 0),
  CHECK (length(entry_reason) > 0),
  CHECK (length(downside_scenario) > 0),
  CHECK (
    json_valid(invalidation_conditions_json)
    AND json_type(invalidation_conditions_json) = 'array'
    AND json_array_length(invalidation_conditions_json) > 0
  ),
  CHECK (requested_entry_price > 0),
  CHECK (simulated_entry_price > 0),
  CHECK (quantity > 0),
  CHECK (length(entered_at) > 0),
  CHECK (stop_loss > 0 AND stop_loss < simulated_entry_price),
  CHECK (profit_target > simulated_entry_price),
  CHECK (length(time_stop_at) > 0),
  CHECK (max_loss_amount > 0),
  CHECK (account_equity_at_entry > 0),
  CHECK (max_loss_amount <= account_equity_at_entry * 0.005),
  CHECK (risk_pct_of_equity >= 0 AND risk_pct_of_equity <= 0.5),
  CHECK (abs(risk_pct_of_equity - ((max_loss_amount / account_equity_at_entry) * 100)) <= 0.0001),
  CHECK (single_name_exposure_pct >= 0 AND single_name_exposure_pct <= 5),
  CHECK (sector_exposure_pct >= 0 AND sector_exposure_pct <= 20),
  CHECK (correlated_exposure_pct >= 0 AND correlated_exposure_pct <= 15),
  CHECK (daily_loss_pct_at_entry >= 0 AND daily_loss_pct_at_entry <= 2),
  CHECK (
    status != 'closed'
    OR (
      closed_at IS NOT NULL AND length(closed_at) > 0
      AND exit_price IS NOT NULL AND exit_price > 0
      AND exit_reason IS NOT NULL AND length(exit_reason) > 0
      AND lessons_learned IS NOT NULL AND length(lessons_learned) > 0
    )
  ),
  CHECK (length(created_at) > 0),
  CHECK (length(updated_at) > 0)
);

CREATE UNIQUE INDEX paper_trades_recommendation_unique ON paper_trades(recommendation_id);
CREATE INDEX paper_trades_ticker_status_idx ON paper_trades(ticker, status);
CREATE INDEX paper_trades_strategy_version_idx ON paper_trades(strategy_version_id);
CREATE INDEX paper_trades_account_status_idx ON paper_trades(account_id, status);

CREATE TRIGGER paper_trades_recommendation_eligible_insert
BEFORE INSERT ON paper_trades
BEGIN
  SELECT RAISE(ABORT, 'paper trade requires a paper-trade eligible recommendation')
  WHERE NOT EXISTS (
    SELECT 1
    FROM recommendations
    WHERE recommendations.id = NEW.recommendation_id
      AND recommendations.decision = 'paper_trade'
      AND recommendations.evidence_status = 'paper_trade_eligible'
      AND recommendations.instrument_type = NEW.instrument_type
      AND recommendations.ticker = NEW.ticker
      AND recommendations.strategy_version_id = NEW.strategy_version_id
      AND recommendations.risk_decision = 'pass'
      AND recommendations.liquidity_decision = 'pass'
      AND recommendations.liquidity_score >= 70
  );
END;

CREATE TRIGGER paper_trades_recommendation_eligible_update
BEFORE UPDATE OF recommendation_id, ticker, instrument_type, strategy_version_id ON paper_trades
BEGIN
  SELECT RAISE(ABORT, 'paper trade requires a paper-trade eligible recommendation')
  WHERE NOT EXISTS (
    SELECT 1
    FROM recommendations
    WHERE recommendations.id = NEW.recommendation_id
      AND recommendations.decision = 'paper_trade'
      AND recommendations.evidence_status = 'paper_trade_eligible'
      AND recommendations.instrument_type = NEW.instrument_type
      AND recommendations.ticker = NEW.ticker
      AND recommendations.strategy_version_id = NEW.strategy_version_id
      AND recommendations.risk_decision = 'pass'
      AND recommendations.liquidity_decision = 'pass'
      AND recommendations.liquidity_score >= 70
  );
END;
