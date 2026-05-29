ALTER TABLE recommendations
ADD COLUMN evidence_gate TEXT NOT NULL DEFAULT 'needs_more_data'
CHECK (evidence_gate IN ('verified', 'needs_more_data', 'blocked'));

CREATE VIEW verified_backtest_ticker_evidence AS
SELECT
  backtest_runs.id AS backtest_run_id,
  backtest_runs.strategy_version_id AS strategy_version_id,
  backtest_runs.instrument_type AS instrument_type,
  ticker_trade_counts.ticker AS ticker
FROM backtest_runs
JOIN (
  SELECT backtest_run_id, ticker, COUNT(*) AS ticker_trade_count
  FROM backtest_run_trades
  GROUP BY backtest_run_id, ticker
) AS ticker_trade_counts
  ON ticker_trade_counts.backtest_run_id = backtest_runs.id
WHERE backtest_runs.promotion_gate = 'ready_for_review'
  AND backtest_runs.options_proxy = 0
  AND backtest_runs.not_recommendation = 1
  AND backtest_runs.freshness_status = 'fresh'
  AND backtest_runs.freshness_as_of GLOB '????-??-??T??:??:??*Z'
  AND backtest_runs.freshness_as_of NOT GLOB '*[^0-9TZ:.-]*'
  AND (
    (
      length(backtest_runs.freshness_as_of) = 20
      AND strftime('%Y-%m-%dT%H:%M:%SZ', backtest_runs.freshness_as_of) = backtest_runs.freshness_as_of
    )
    OR (
      length(backtest_runs.freshness_as_of) = 24
      AND strftime('%Y-%m-%dT%H:%M:%fZ', backtest_runs.freshness_as_of) = backtest_runs.freshness_as_of
    )
  )
  AND CAST(substr(backtest_runs.freshness_as_of, 12, 2) AS INTEGER) BETWEEN 0 AND 23
  AND backtest_runs.period_end GLOB '????-??-??T??:??:??*Z'
  AND backtest_runs.period_end NOT GLOB '*[^0-9TZ:.-]*'
  AND (
    (
      length(backtest_runs.period_end) = 20
      AND strftime('%Y-%m-%dT%H:%M:%SZ', backtest_runs.period_end) = backtest_runs.period_end
    )
    OR (
      length(backtest_runs.period_end) = 24
      AND strftime('%Y-%m-%dT%H:%M:%fZ', backtest_runs.period_end) = backtest_runs.period_end
    )
  )
  AND CAST(substr(backtest_runs.period_end, 12, 2) AS INTEGER) BETWEEN 0 AND 23
  AND julianday(backtest_runs.freshness_as_of) IS NOT NULL
  AND julianday(backtest_runs.period_end) IS NOT NULL
  AND julianday(backtest_runs.freshness_as_of) >= julianday(backtest_runs.period_end)
  AND json_valid(backtest_runs.reason_codes_json)
  AND json_type(backtest_runs.reason_codes_json) = 'array'
  AND json_array_length(backtest_runs.reason_codes_json) = 0
  AND json_valid(backtest_runs.metrics_json)
  AND json_type(backtest_runs.metrics_json, '$.tradeCount') IN ('integer', 'real')
  AND abs(json_extract(backtest_runs.metrics_json, '$.tradeCount') - backtest_runs.trade_count) <= 0.0001
  AND json_type(backtest_runs.metrics_json, '$.winRatePct') IN ('integer', 'real')
  AND abs(json_extract(backtest_runs.metrics_json, '$.winRatePct') - backtest_runs.win_rate_pct) <= 0.0001
  AND json_type(backtest_runs.metrics_json, '$.averageReturnPct') IN ('integer', 'real')
  AND json_extract(backtest_runs.metrics_json, '$.averageReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_type(backtest_runs.metrics_json, '$.medianReturnPct') IN ('integer', 'real')
  AND json_extract(backtest_runs.metrics_json, '$.medianReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_type(backtest_runs.metrics_json, '$.netReturnPct') IN ('integer', 'real')
  AND abs(json_extract(backtest_runs.metrics_json, '$.netReturnPct') - backtest_runs.net_return_pct) <= 0.0001
  AND json_type(backtest_runs.metrics_json, '$.maxDrawdownPct') IN ('integer', 'real')
  AND abs(json_extract(backtest_runs.metrics_json, '$.maxDrawdownPct') - backtest_runs.max_drawdown_pct) <= 0.0001
  AND json_type(backtest_runs.metrics_json, '$.benchmarkRelativeReturnPct') IN ('integer', 'real')
  AND abs(json_extract(backtest_runs.metrics_json, '$.benchmarkRelativeReturnPct') - backtest_runs.benchmark_relative_return_pct) <= 0.0001
  AND json_type(backtest_runs.metrics_json, '$.bestTradeReturnPct') IN ('integer', 'real')
  AND json_extract(backtest_runs.metrics_json, '$.bestTradeReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_type(backtest_runs.metrics_json, '$.worstTradeReturnPct') IN ('integer', 'real')
  AND json_extract(backtest_runs.metrics_json, '$.worstTradeReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_type(backtest_runs.metrics_json, '$.averageHoldingDays') IN ('integer', 'real')
  AND json_extract(backtest_runs.metrics_json, '$.averageHoldingDays') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_type(backtest_runs.metrics_json, '$.grossReturnPct') IN ('integer', 'real')
  AND json_extract(backtest_runs.metrics_json, '$.grossReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND (
    (
      json_type(backtest_runs.metrics_json, '$.profitFactor') IN ('integer', 'real')
      AND json_extract(backtest_runs.metrics_json, '$.profitFactor') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
    )
    OR json_type(backtest_runs.metrics_json, '$.profitFactor') = 'null'
  )
  AND json_type(backtest_runs.metrics_json, '$.costSensitivity') = 'array'
  AND json_array_length(backtest_runs.metrics_json, '$.costSensitivity') = 3
  AND NOT EXISTS (
    SELECT 1
    FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
    WHERE stress.type != 'object'
      OR coalesce(json_type(stress.value, '$.multiplier'), '') NOT IN ('integer', 'real')
      OR json_extract(stress.value, '$.multiplier') NOT IN (1, 2, 3)
      OR coalesce(json_type(stress.value, '$.netReturnPct'), '') NOT IN ('integer', 'real')
      OR json_extract(stress.value, '$.netReturnPct') NOT BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
      OR coalesce(json_type(stress.value, '$.averageReturnPct'), '') NOT IN ('integer', 'real')
      OR json_extract(stress.value, '$.averageReturnPct') NOT BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
      OR NOT (
        (
          coalesce(json_type(stress.value, '$.profitFactor'), '') IN ('integer', 'real')
          AND json_extract(stress.value, '$.profitFactor') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
        )
        OR coalesce(json_type(stress.value, '$.profitFactor'), '') = 'null'
      )
  )
  AND (
    SELECT COUNT(DISTINCT json_extract(stress.value, '$.multiplier'))
    FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
  ) = 3
  AND EXISTS (
    SELECT 1
    FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
    WHERE stress.type = 'object'
      AND json_type(stress.value, '$.multiplier') IN ('integer', 'real')
      AND json_extract(stress.value, '$.multiplier') = 1
      AND json_type(stress.value, '$.netReturnPct') IN ('integer', 'real')
      AND json_extract(stress.value, '$.netReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
      AND json_type(stress.value, '$.averageReturnPct') IN ('integer', 'real')
      AND json_extract(stress.value, '$.averageReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
      AND (
        (
          json_type(stress.value, '$.profitFactor') IN ('integer', 'real')
          AND json_extract(stress.value, '$.profitFactor') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
        )
        OR json_type(stress.value, '$.profitFactor') = 'null'
      )
  )
  AND EXISTS (
    SELECT 1
    FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
    WHERE stress.type = 'object'
      AND json_type(stress.value, '$.multiplier') IN ('integer', 'real')
      AND json_extract(stress.value, '$.multiplier') = 2
      AND json_type(stress.value, '$.netReturnPct') IN ('integer', 'real')
      AND json_extract(stress.value, '$.netReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
      AND json_type(stress.value, '$.averageReturnPct') IN ('integer', 'real')
      AND json_extract(stress.value, '$.averageReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
      AND (
        (
          json_type(stress.value, '$.profitFactor') IN ('integer', 'real')
          AND json_extract(stress.value, '$.profitFactor') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
        )
        OR json_type(stress.value, '$.profitFactor') = 'null'
      )
  )
  AND EXISTS (
    SELECT 1
    FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
    WHERE stress.type = 'object'
      AND json_type(stress.value, '$.multiplier') IN ('integer', 'real')
      AND json_extract(stress.value, '$.multiplier') = 3
      AND json_type(stress.value, '$.netReturnPct') IN ('integer', 'real')
      AND json_extract(stress.value, '$.netReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
      AND json_type(stress.value, '$.averageReturnPct') IN ('integer', 'real')
      AND json_extract(stress.value, '$.averageReturnPct') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
      AND (
        (
          json_type(stress.value, '$.profitFactor') IN ('integer', 'real')
          AND json_extract(stress.value, '$.profitFactor') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
        )
        OR json_type(stress.value, '$.profitFactor') = 'null'
      )
  )
  AND json_valid(backtest_runs.assumptions_json)
  AND json_type(backtest_runs.assumptions_json, '$.slippageBps') IN ('integer', 'real')
  AND json_extract(backtest_runs.assumptions_json, '$.slippageBps') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_extract(backtest_runs.assumptions_json, '$.slippageBps') >= 0
  AND json_type(backtest_runs.assumptions_json, '$.pointInTimeData') = 'true'
  AND json_type(backtest_runs.assumptions_json, '$.survivorshipBiasControl') = 'true'
  AND json_type(backtest_runs.assumptions_json, '$.lookaheadBiasControl') = 'true'
  AND json_type(backtest_runs.assumptions_json, '$.spreadBps') IN ('integer', 'real')
  AND json_extract(backtest_runs.assumptions_json, '$.spreadBps') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_extract(backtest_runs.assumptions_json, '$.spreadBps') > 0
  AND json_type(backtest_runs.assumptions_json, '$.feePerTrade') IN ('integer', 'real')
  AND json_extract(backtest_runs.assumptions_json, '$.feePerTrade') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_extract(backtest_runs.assumptions_json, '$.feePerTrade') >= 0
  AND json_type(backtest_runs.assumptions_json, '$.minAverageDailyDollarVolume') IN ('integer', 'real')
  AND json_extract(backtest_runs.assumptions_json, '$.minAverageDailyDollarVolume') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_extract(backtest_runs.assumptions_json, '$.minAverageDailyDollarVolume') > 0
  AND json_type(backtest_runs.assumptions_json, '$.minTradesForReview') IN ('integer', 'real')
  AND json_extract(backtest_runs.assumptions_json, '$.minTradesForReview') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_extract(backtest_runs.assumptions_json, '$.minTradesForReview') > 0
  AND json_extract(backtest_runs.assumptions_json, '$.minTradesForReview') =
    CAST(json_extract(backtest_runs.assumptions_json, '$.minTradesForReview') AS INTEGER)
  AND json_type(backtest_runs.assumptions_json, '$.rejectedParameterSets') IN ('integer', 'real')
  AND json_extract(backtest_runs.assumptions_json, '$.rejectedParameterSets') BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
  AND json_extract(backtest_runs.assumptions_json, '$.rejectedParameterSets') >= 0
  AND json_extract(backtest_runs.assumptions_json, '$.rejectedParameterSets') =
    CAST(json_extract(backtest_runs.assumptions_json, '$.rejectedParameterSets') AS INTEGER)
  AND json_type(backtest_runs.assumptions_json, '$.costStressMultipliers') = 'array'
  AND json_array_length(backtest_runs.assumptions_json, '$.costStressMultipliers') = 3
  AND EXISTS (
    SELECT 1
    FROM json_each(backtest_runs.assumptions_json, '$.costStressMultipliers') AS multiplier
    WHERE multiplier.value = 1
  )
  AND EXISTS (
    SELECT 1
    FROM json_each(backtest_runs.assumptions_json, '$.costStressMultipliers') AS multiplier
    WHERE multiplier.value = 2
  )
  AND EXISTS (
    SELECT 1
    FROM json_each(backtest_runs.assumptions_json, '$.costStressMultipliers') AS multiplier
    WHERE multiplier.value = 3
  )
  AND NOT EXISTS (
    SELECT 1
    FROM json_each(backtest_runs.assumptions_json, '$.costStressMultipliers') AS multiplier
    WHERE multiplier.type NOT IN ('integer', 'real')
      OR multiplier.value NOT BETWEEN -1.7976931348623157e308 AND 1.7976931348623157e308
      OR multiplier.value NOT IN (1, 2, 3)
  )
  AND (
    SELECT COUNT(DISTINCT multiplier.value)
    FROM json_each(backtest_runs.assumptions_json, '$.costStressMultipliers') AS multiplier
  ) = 3
  AND json_type(backtest_runs.assumptions_json, '$.notes') = 'array'
  AND NOT EXISTS (
    SELECT 1
    FROM json_each(backtest_runs.assumptions_json, '$.notes') AS note
    WHERE note.type != 'text'
  )
  AND json_valid(backtest_runs.source_citations_json)
  AND json_type(backtest_runs.source_citations_json) = 'array'
  AND json_array_length(backtest_runs.source_citations_json) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM json_each(backtest_runs.source_citations_json) AS citation
    WHERE citation.type != 'object'
      OR CASE
        WHEN citation.type = 'object' THEN (
          coalesce(json_type(citation.value, '$.title'), '') != 'text'
          OR length(trim(coalesce(json_extract(citation.value, '$.title'), ''))) = 0
          OR coalesce(json_type(citation.value, '$.url'), '') != 'text'
          OR length(trim(coalesce(json_extract(citation.value, '$.url'), ''))) = 0
          OR coalesce(json_type(citation.value, '$.source'), '') != 'text'
          OR length(trim(coalesce(json_extract(citation.value, '$.source'), ''))) = 0
          OR coalesce(json_type(citation.value, '$.publishedAt'), '') != 'text'
          OR coalesce(json_type(citation.value, '$.retrievedAt'), '') != 'text'
          OR coalesce(json_extract(citation.value, '$.publishedAt'), '') NOT GLOB '????-??-??T??:??:??*Z'
          OR coalesce(json_extract(citation.value, '$.retrievedAt'), '') NOT GLOB '????-??-??T??:??:??*Z'
          OR coalesce(json_extract(citation.value, '$.publishedAt'), '') GLOB '*[^0-9TZ:.-]*'
          OR coalesce(json_extract(citation.value, '$.retrievedAt'), '') GLOB '*[^0-9TZ:.-]*'
          OR NOT (
            (
              length(json_extract(citation.value, '$.publishedAt')) = 20
              AND strftime('%Y-%m-%dT%H:%M:%SZ', json_extract(citation.value, '$.publishedAt')) =
                json_extract(citation.value, '$.publishedAt')
            )
            OR (
              length(json_extract(citation.value, '$.publishedAt')) = 24
              AND strftime('%Y-%m-%dT%H:%M:%fZ', json_extract(citation.value, '$.publishedAt')) =
                json_extract(citation.value, '$.publishedAt')
            )
          )
          OR NOT (
            (
              length(json_extract(citation.value, '$.retrievedAt')) = 20
              AND strftime('%Y-%m-%dT%H:%M:%SZ', json_extract(citation.value, '$.retrievedAt')) =
                json_extract(citation.value, '$.retrievedAt')
            )
            OR (
              length(json_extract(citation.value, '$.retrievedAt')) = 24
              AND strftime('%Y-%m-%dT%H:%M:%fZ', json_extract(citation.value, '$.retrievedAt')) =
                json_extract(citation.value, '$.retrievedAt')
            )
          )
          OR CAST(substr(json_extract(citation.value, '$.publishedAt'), 12, 2) AS INTEGER) NOT BETWEEN 0 AND 23
          OR CAST(substr(json_extract(citation.value, '$.retrievedAt'), 12, 2) AS INTEGER) NOT BETWEEN 0 AND 23
          OR julianday(json_extract(citation.value, '$.publishedAt')) IS NULL
          OR julianday(json_extract(citation.value, '$.retrievedAt')) IS NULL
          OR julianday(json_extract(citation.value, '$.retrievedAt')) <
            julianday(json_extract(citation.value, '$.publishedAt'))
        )
        ELSE 0
      END
  )
  AND (
    SELECT COUNT(*)
    FROM backtest_run_trades
    WHERE backtest_run_trades.backtest_run_id = backtest_runs.id
  ) = backtest_runs.trade_count
  AND ticker_trade_counts.ticker_trade_count >=
    json_extract(backtest_runs.assumptions_json, '$.minTradesForReview');

CREATE VIEW verified_paper_trade_evidence AS
SELECT
  paper_trades.id AS paper_trade_id,
  paper_trades.recommendation_id AS source_recommendation_id,
  paper_trades.ticker AS ticker,
  paper_trades.instrument_type AS instrument_type,
  paper_trades.strategy_version_id AS strategy_version_id
FROM paper_trades
JOIN recommendations AS source_recommendations
  ON source_recommendations.id = paper_trades.recommendation_id
WHERE paper_trades.mode = 'paper'
  AND paper_trades.status = 'closed'
  AND paper_trades.live_trading_enabled = 0
  AND paper_trades.broker_execution = 0
  AND source_recommendations.decision = 'paper_trade'
  AND source_recommendations.evidence_status = 'paper_trade_eligible'
  AND source_recommendations.evidence_gate = 'verified'
  AND source_recommendations.ticker = paper_trades.ticker
  AND source_recommendations.instrument_type = paper_trades.instrument_type
  AND source_recommendations.strategy_version_id = paper_trades.strategy_version_id
  AND length(coalesce(source_recommendations.backtest_run_id, '')) > 0
  AND length(coalesce(source_recommendations.paper_trade_evidence_id, '')) = 0
  AND EXISTS (
    SELECT 1
    FROM verified_backtest_ticker_evidence
    WHERE verified_backtest_ticker_evidence.backtest_run_id = source_recommendations.backtest_run_id
      AND verified_backtest_ticker_evidence.strategy_version_id = source_recommendations.strategy_version_id
      AND verified_backtest_ticker_evidence.instrument_type = source_recommendations.instrument_type
      AND verified_backtest_ticker_evidence.ticker = source_recommendations.ticker
  );

CREATE TRIGGER recommendations_verified_evidence_gate_insert
BEFORE INSERT ON recommendations
WHEN NEW.decision = 'paper_trade' AND (
  NEW.evidence_gate != 'verified'
  OR (
    length(coalesce(NEW.backtest_run_id, '')) = 0
    AND length(coalesce(NEW.paper_trade_evidence_id, '')) = 0
  )
  OR (
    length(coalesce(NEW.backtest_run_id, '')) > 0
    AND NOT EXISTS (
      SELECT 1
      FROM verified_backtest_ticker_evidence
      WHERE verified_backtest_ticker_evidence.backtest_run_id = NEW.backtest_run_id
        AND verified_backtest_ticker_evidence.strategy_version_id = NEW.strategy_version_id
        AND verified_backtest_ticker_evidence.instrument_type = NEW.instrument_type
        AND verified_backtest_ticker_evidence.ticker = NEW.ticker
    )
  )
  OR (
    length(coalesce(NEW.paper_trade_evidence_id, '')) > 0
    AND NOT EXISTS (
      SELECT 1
      FROM verified_paper_trade_evidence
      WHERE verified_paper_trade_evidence.paper_trade_id = NEW.paper_trade_evidence_id
        AND verified_paper_trade_evidence.source_recommendation_id != NEW.id
        AND verified_paper_trade_evidence.strategy_version_id = NEW.strategy_version_id
        AND verified_paper_trade_evidence.instrument_type = NEW.instrument_type
        AND verified_paper_trade_evidence.ticker = NEW.ticker
    )
  )
)
BEGIN
  SELECT RAISE(ABORT, 'paper trade recommendations require resolver-verified evidence');
END;

CREATE TRIGGER recommendations_verified_evidence_gate_update
BEFORE UPDATE ON recommendations
WHEN NEW.decision = 'paper_trade' AND (
  NEW.evidence_gate != 'verified'
  OR (
    length(coalesce(NEW.backtest_run_id, '')) = 0
    AND length(coalesce(NEW.paper_trade_evidence_id, '')) = 0
  )
  OR (
    length(coalesce(NEW.backtest_run_id, '')) > 0
    AND NOT EXISTS (
      SELECT 1
      FROM verified_backtest_ticker_evidence
      WHERE verified_backtest_ticker_evidence.backtest_run_id = NEW.backtest_run_id
        AND verified_backtest_ticker_evidence.strategy_version_id = NEW.strategy_version_id
        AND verified_backtest_ticker_evidence.instrument_type = NEW.instrument_type
        AND verified_backtest_ticker_evidence.ticker = NEW.ticker
    )
  )
  OR (
    length(coalesce(NEW.paper_trade_evidence_id, '')) > 0
    AND NOT EXISTS (
      SELECT 1
      FROM verified_paper_trade_evidence
      WHERE verified_paper_trade_evidence.paper_trade_id = NEW.paper_trade_evidence_id
        AND verified_paper_trade_evidence.source_recommendation_id != NEW.id
        AND verified_paper_trade_evidence.strategy_version_id = NEW.strategy_version_id
        AND verified_paper_trade_evidence.instrument_type = NEW.instrument_type
        AND verified_paper_trade_evidence.ticker = NEW.ticker
    )
  )
)
BEGIN
  SELECT RAISE(ABORT, 'paper trade recommendations require resolver-verified evidence');
END;

DROP TRIGGER IF EXISTS paper_trades_recommendation_eligible_insert;
DROP TRIGGER IF EXISTS paper_trades_recommendation_eligible_update;

CREATE TRIGGER paper_trades_recommendation_eligible_insert
BEFORE INSERT ON paper_trades
BEGIN
  SELECT RAISE(ABORT, 'paper trade requires a verified evidence recommendation')
  WHERE NOT EXISTS (
    SELECT 1
    FROM recommendations
    WHERE recommendations.id = NEW.recommendation_id
      AND recommendations.decision = 'paper_trade'
      AND recommendations.evidence_status = 'paper_trade_eligible'
      AND recommendations.evidence_gate = 'verified'
      AND recommendations.instrument_type = NEW.instrument_type
      AND recommendations.ticker = NEW.ticker
      AND recommendations.strategy_version_id = NEW.strategy_version_id
      AND recommendations.risk_decision = 'pass'
      AND recommendations.liquidity_decision = 'pass'
      AND recommendations.liquidity_score >= 70
      AND (
        length(coalesce(recommendations.backtest_run_id, '')) > 0
        OR length(coalesce(recommendations.paper_trade_evidence_id, '')) > 0
      )
      AND (
        length(coalesce(recommendations.backtest_run_id, '')) = 0
        OR EXISTS (
          SELECT 1
          FROM verified_backtest_ticker_evidence
          WHERE verified_backtest_ticker_evidence.backtest_run_id = recommendations.backtest_run_id
            AND verified_backtest_ticker_evidence.strategy_version_id = recommendations.strategy_version_id
            AND verified_backtest_ticker_evidence.instrument_type = recommendations.instrument_type
            AND verified_backtest_ticker_evidence.ticker = recommendations.ticker
        )
      )
      AND (
        length(coalesce(recommendations.paper_trade_evidence_id, '')) = 0
        OR EXISTS (
          SELECT 1
          FROM verified_paper_trade_evidence
          WHERE verified_paper_trade_evidence.paper_trade_id = recommendations.paper_trade_evidence_id
            AND verified_paper_trade_evidence.source_recommendation_id != recommendations.id
            AND verified_paper_trade_evidence.strategy_version_id = recommendations.strategy_version_id
            AND verified_paper_trade_evidence.instrument_type = recommendations.instrument_type
            AND verified_paper_trade_evidence.ticker = recommendations.ticker
        )
      )
  );
END;

CREATE TRIGGER paper_trades_recommendation_eligible_update
BEFORE UPDATE OF recommendation_id, ticker, instrument_type, strategy_version_id ON paper_trades
BEGIN
  SELECT RAISE(ABORT, 'paper trade requires a verified evidence recommendation')
  WHERE NOT EXISTS (
    SELECT 1
    FROM recommendations
    WHERE recommendations.id = NEW.recommendation_id
      AND recommendations.decision = 'paper_trade'
      AND recommendations.evidence_status = 'paper_trade_eligible'
      AND recommendations.evidence_gate = 'verified'
      AND recommendations.instrument_type = NEW.instrument_type
      AND recommendations.ticker = NEW.ticker
      AND recommendations.strategy_version_id = NEW.strategy_version_id
      AND recommendations.risk_decision = 'pass'
      AND recommendations.liquidity_decision = 'pass'
      AND recommendations.liquidity_score >= 70
      AND (
        length(coalesce(recommendations.backtest_run_id, '')) > 0
        OR length(coalesce(recommendations.paper_trade_evidence_id, '')) > 0
      )
      AND (
        length(coalesce(recommendations.backtest_run_id, '')) = 0
        OR EXISTS (
          SELECT 1
          FROM verified_backtest_ticker_evidence
          WHERE verified_backtest_ticker_evidence.backtest_run_id = recommendations.backtest_run_id
            AND verified_backtest_ticker_evidence.strategy_version_id = recommendations.strategy_version_id
            AND verified_backtest_ticker_evidence.instrument_type = recommendations.instrument_type
            AND verified_backtest_ticker_evidence.ticker = recommendations.ticker
        )
      )
      AND (
        length(coalesce(recommendations.paper_trade_evidence_id, '')) = 0
        OR EXISTS (
          SELECT 1
          FROM verified_paper_trade_evidence
          WHERE verified_paper_trade_evidence.paper_trade_id = recommendations.paper_trade_evidence_id
            AND verified_paper_trade_evidence.source_recommendation_id != recommendations.id
            AND verified_paper_trade_evidence.strategy_version_id = recommendations.strategy_version_id
            AND verified_paper_trade_evidence.instrument_type = recommendations.instrument_type
            AND verified_paper_trade_evidence.ticker = recommendations.ticker
        )
      )
  );
END;
