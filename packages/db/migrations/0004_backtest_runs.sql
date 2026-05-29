CREATE TABLE backtest_runs (
  id TEXT PRIMARY KEY,
  strategy_version_id TEXT NOT NULL REFERENCES strategy_versions(id),
  strategy_family TEXT NOT NULL CHECK (length(strategy_family) > 0),
  strategy_version_label TEXT NOT NULL CHECK (length(strategy_version_label) > 0),
  instrument_type TEXT NOT NULL CHECK (instrument_type = 'stock'),
  universe TEXT NOT NULL CHECK (length(universe) > 0),
  period_start TEXT NOT NULL CHECK (length(period_start) > 0),
  period_end TEXT NOT NULL CHECK (length(period_end) > 0 AND period_end > period_start),
  benchmark_return_pct REAL NOT NULL,
  promotion_gate TEXT NOT NULL CHECK (promotion_gate IN ('ready_for_review', 'needs_more_data', 'blocked')),
  reason_codes_json TEXT NOT NULL CHECK (json_valid(reason_codes_json) AND json_type(reason_codes_json) = 'array'),
  metrics_json TEXT NOT NULL CHECK (json_valid(metrics_json) AND json_type(metrics_json) = 'object'),
  assumptions_json TEXT NOT NULL CHECK (json_valid(assumptions_json) AND json_type(assumptions_json) = 'object'),
  source_citations_json TEXT NOT NULL CHECK (
    json_valid(source_citations_json)
    AND json_type(source_citations_json) = 'array'
    AND json_array_length(source_citations_json) > 0
  ),
  freshness_status TEXT NOT NULL CHECK (freshness_status IN ('fresh', 'stale', 'partial', 'missing')),
  freshness_as_of TEXT NOT NULL CHECK (length(freshness_as_of) > 0),
  freshness_notes_json TEXT NOT NULL CHECK (json_valid(freshness_notes_json) AND json_type(freshness_notes_json) = 'array'),
  trade_count INTEGER NOT NULL CHECK (trade_count >= 0),
  win_rate_pct REAL NOT NULL CHECK (win_rate_pct >= 0 AND win_rate_pct <= 100),
  max_drawdown_pct REAL NOT NULL CHECK (max_drawdown_pct >= 0),
  net_return_pct REAL NOT NULL,
  benchmark_relative_return_pct REAL NOT NULL,
  options_proxy INTEGER NOT NULL DEFAULT 0 CHECK (options_proxy = 0),
  not_recommendation INTEGER NOT NULL DEFAULT 1 CHECK (not_recommendation = 1),
  created_at TEXT NOT NULL CHECK (length(created_at) > 0),
  updated_at TEXT NOT NULL CHECK (length(updated_at) > 0)
);

CREATE INDEX backtest_runs_strategy_version_idx ON backtest_runs(strategy_version_id);
CREATE INDEX backtest_runs_gate_idx ON backtest_runs(promotion_gate);

CREATE TABLE backtest_run_trades (
  id TEXT PRIMARY KEY,
  backtest_run_id TEXT NOT NULL REFERENCES backtest_runs(id) ON DELETE CASCADE,
  source_trade_id TEXT NOT NULL CHECK (length(source_trade_id) > 0),
  ticker TEXT NOT NULL CHECK (length(ticker) > 0),
  net_return_pct REAL NOT NULL,
  gross_return_pct REAL NOT NULL,
  holding_days REAL NOT NULL CHECK (holding_days >= 0),
  exit_order INTEGER NOT NULL CHECK (exit_order >= 0),
  created_at TEXT NOT NULL CHECK (length(created_at) > 0),
  UNIQUE(backtest_run_id, source_trade_id)
);

CREATE INDEX backtest_run_trades_run_idx ON backtest_run_trades(backtest_run_id, exit_order);
