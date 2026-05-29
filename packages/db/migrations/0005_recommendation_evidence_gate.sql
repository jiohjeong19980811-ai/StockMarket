ALTER TABLE recommendations
ADD COLUMN evidence_gate TEXT NOT NULL DEFAULT 'needs_more_data'
CHECK (evidence_gate IN ('verified', 'needs_more_data', 'blocked'));

CREATE TRIGGER recommendations_verified_evidence_gate_insert
BEFORE INSERT ON recommendations
WHEN NEW.decision = 'paper_trade' AND NEW.evidence_gate != 'verified'
BEGIN
  SELECT RAISE(ABORT, 'paper trade recommendations require verified evidence gate');
END;

CREATE TRIGGER recommendations_verified_evidence_gate_update
BEFORE UPDATE ON recommendations
WHEN NEW.decision = 'paper_trade' AND NEW.evidence_gate != 'verified'
BEGIN
  SELECT RAISE(ABORT, 'paper trade recommendations require verified evidence gate');
END;
