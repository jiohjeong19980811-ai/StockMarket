ALTER TABLE paper_trades ADD COLUMN exit_audit_log_id TEXT REFERENCES audit_logs(id);

CREATE TRIGGER paper_trades_close_audit_insert
BEFORE INSERT ON paper_trades
WHEN NEW.status = 'closed'
BEGIN
  SELECT RAISE(ABORT, 'closed paper trade requires close audit linkage')
  WHERE NEW.exit_audit_log_id IS NULL OR length(NEW.exit_audit_log_id) = 0;
END;

CREATE TRIGGER paper_trades_close_audit_update
BEFORE UPDATE OF status, exit_audit_log_id ON paper_trades
WHEN NEW.status = 'closed'
BEGIN
  SELECT RAISE(ABORT, 'closed paper trade requires close audit linkage')
  WHERE NEW.exit_audit_log_id IS NULL OR length(NEW.exit_audit_log_id) = 0;
END;
