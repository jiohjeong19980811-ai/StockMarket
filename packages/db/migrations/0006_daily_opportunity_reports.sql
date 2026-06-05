CREATE TABLE daily_opportunity_reports (
  id TEXT PRIMARY KEY,
  generated_at TEXT NOT NULL CHECK (length(generated_at) > 0),
  outcome TEXT NOT NULL CHECK (outcome IN ('ranked_opportunities', 'no_good_trades')),
  reviewed_count INTEGER NOT NULL CHECK (reviewed_count >= 0),
  opportunity_count INTEGER NOT NULL CHECK (opportunity_count >= 0),
  provider_keys_required_json TEXT NOT NULL CHECK (
    json_valid(provider_keys_required_json)
    AND json_type(provider_keys_required_json) = 'array'
  ),
  disclaimer TEXT NOT NULL CHECK (length(disclaimer) > 0),
  no_good_message TEXT,
  no_good_reason_codes_json TEXT NOT NULL CHECK (
    json_valid(no_good_reason_codes_json)
    AND json_type(no_good_reason_codes_json) = 'array'
  ),
  live_trading_enabled INTEGER NOT NULL DEFAULT 0 CHECK (live_trading_enabled = 0),
  not_recommendation INTEGER NOT NULL DEFAULT 1 CHECK (not_recommendation = 1),
  created_at TEXT NOT NULL CHECK (length(created_at) > 0),
  updated_at TEXT NOT NULL CHECK (length(updated_at) > 0),
  CHECK (
    (outcome = 'ranked_opportunities' AND opportunity_count > 0 AND no_good_message IS NULL)
    OR (
      outcome = 'no_good_trades'
      AND opportunity_count = 0
      AND no_good_message IS NOT NULL
      AND length(no_good_message) > 0
    )
  )
);

CREATE INDEX daily_opportunity_reports_generated_idx
  ON daily_opportunity_reports(generated_at);

CREATE TABLE daily_opportunity_report_recommendations (
  id TEXT PRIMARY KEY,
  daily_report_id TEXT NOT NULL REFERENCES daily_opportunity_reports(id) ON DELETE CASCADE,
  recommendation_id TEXT NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  report_rank INTEGER NOT NULL CHECK (report_rank > 0),
  created_at TEXT NOT NULL CHECK (length(created_at) > 0),
  UNIQUE(daily_report_id, recommendation_id),
  UNIQUE(daily_report_id, report_rank)
);

CREATE INDEX daily_opportunity_report_recommendations_report_idx
  ON daily_opportunity_report_recommendations(daily_report_id, report_rank);
