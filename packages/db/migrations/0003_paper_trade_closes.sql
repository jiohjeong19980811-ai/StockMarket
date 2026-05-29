ALTER TABLE paper_trades ADD COLUMN exit_audit_log_id TEXT REFERENCES audit_logs(id);

CREATE TRIGGER paper_trades_close_audit_insert
BEFORE INSERT ON paper_trades
WHEN NEW.status = 'closed'
BEGIN
  SELECT RAISE(ABORT, 'closed paper trade requires close audit linkage')
  WHERE NEW.exit_audit_log_id IS NULL OR length(NEW.exit_audit_log_id) = 0;

  SELECT RAISE(ABORT, 'closed paper trade requires matching close audit linkage')
  WHERE NOT EXISTS (
    SELECT 1
    FROM audit_logs
    WHERE audit_logs.id = NEW.exit_audit_log_id
      AND audit_logs.event_type = 'paper_trade_closed'
      AND audit_logs.actor_type = 'system'
      AND audit_logs.subject_type = 'paper_trade'
      AND audit_logs.subject_id = NEW.id
      AND audit_logs.risk_decision = 'pass'
      AND audit_logs.operator_decision = 'paper_trade'
  );
END;

CREATE TRIGGER paper_trades_close_audit_update
BEFORE UPDATE OF status, exit_audit_log_id ON paper_trades
WHEN NEW.status = 'closed'
BEGIN
  SELECT RAISE(ABORT, 'closed paper trade requires close audit linkage')
  WHERE NEW.exit_audit_log_id IS NULL OR length(NEW.exit_audit_log_id) = 0;

  SELECT RAISE(ABORT, 'closed paper trade requires matching close audit linkage')
  WHERE NOT EXISTS (
    SELECT 1
    FROM audit_logs
    WHERE audit_logs.id = NEW.exit_audit_log_id
      AND audit_logs.event_type = 'paper_trade_closed'
      AND audit_logs.actor_type = 'system'
      AND audit_logs.subject_type = 'paper_trade'
      AND audit_logs.subject_id = NEW.id
      AND audit_logs.risk_decision = 'pass'
      AND audit_logs.operator_decision = 'paper_trade'
  );
END;
