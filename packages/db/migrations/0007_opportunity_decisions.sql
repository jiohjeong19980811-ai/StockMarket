CREATE TABLE opportunity_decisions (
  id TEXT PRIMARY KEY,
  recommendation_id TEXT NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  audit_log_id TEXT NOT NULL UNIQUE REFERENCES audit_logs(id),
  mode TEXT NOT NULL DEFAULT 'paper',
  operator_decision TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL DEFAULT '[]',
  live_trading_enabled INTEGER NOT NULL DEFAULT 0,
  broker_execution INTEGER NOT NULL DEFAULT 0,
  not_recommendation INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(id) > 0),
  CHECK (length(recommendation_id) > 0),
  CHECK (length(audit_log_id) > 0),
  CHECK (mode = 'paper'),
  CHECK (operator_decision IN ('watchlist', 'paper_trade', 'avoid', 'needs_more_data')),
  CHECK (
    json_valid(reason_codes_json)
    AND json_type(reason_codes_json) = 'array'
    AND json_array_length(reason_codes_json) > 0
  ),
  CHECK (live_trading_enabled = 0),
  CHECK (broker_execution = 0),
  CHECK (not_recommendation = 1),
  CHECK (length(created_at) > 0),
  CHECK (length(updated_at) > 0)
);

CREATE INDEX opportunity_decisions_recommendation_idx
  ON opportunity_decisions(recommendation_id, created_at);

CREATE INDEX opportunity_decisions_operator_decision_idx
  ON opportunity_decisions(operator_decision, created_at);

CREATE TRIGGER opportunity_decisions_audit_insert
BEFORE INSERT ON opportunity_decisions
BEGIN
  SELECT RAISE(ABORT, 'opportunity decision reason codes must be strings')
  WHERE EXISTS (
    SELECT 1
    FROM json_each(NEW.reason_codes_json)
    WHERE json_each.type != 'text'
      OR length(json_each.value) = 0
  );

  SELECT RAISE(ABORT, 'opportunity decision requires matching audit log')
  WHERE NOT EXISTS (
    SELECT 1
    FROM audit_logs
    WHERE audit_logs.id = NEW.audit_log_id
      AND audit_logs.event_type = 'operator_decision'
      AND audit_logs.actor_type = 'operator'
      AND audit_logs.subject_type = 'recommendation'
      AND audit_logs.subject_id = NEW.recommendation_id
      AND audit_logs.operator_decision = NEW.operator_decision
      AND length(coalesce(audit_logs.actor_id, '')) > 0
      AND length(coalesce(audit_logs.occurred_at, '')) > 0
  );

  SELECT RAISE(ABORT, 'paper trade opportunity decisions require verified paper-trade recommendation evidence')
  WHERE NEW.operator_decision = 'paper_trade'
    AND NOT EXISTS (
      SELECT 1
      FROM recommendations
      WHERE recommendations.id = NEW.recommendation_id
        AND recommendations.decision = 'paper_trade'
        AND recommendations.evidence_status = 'paper_trade_eligible'
        AND recommendations.evidence_gate = 'verified'
        AND recommendations.risk_decision = 'pass'
        AND recommendations.liquidity_decision = 'pass'
        AND recommendations.liquidity_score >= 70
        AND (
          length(coalesce(recommendations.backtest_run_id, '')) > 0
          OR length(coalesce(recommendations.paper_trade_evidence_id, '')) > 0
        )
    );
END;

CREATE TRIGGER opportunity_decisions_audit_update
BEFORE UPDATE OF recommendation_id, audit_log_id, operator_decision ON opportunity_decisions
BEGIN
  SELECT RAISE(ABORT, 'opportunity decision audit fields are immutable');
END;
