ALTER TABLE recommendations
ADD COLUMN evidence_gate TEXT NOT NULL DEFAULT 'needs_more_data'
CHECK (evidence_gate IN ('verified', 'needs_more_data', 'blocked'));

CREATE TRIGGER recommendations_verified_evidence_gate_insert
BEFORE INSERT ON recommendations
WHEN NEW.decision = 'paper_trade' AND (
  NEW.evidence_gate != 'verified'
  OR (
    NOT EXISTS (
      SELECT 1
      FROM backtest_runs
      WHERE backtest_runs.id = NEW.backtest_run_id
        AND backtest_runs.strategy_version_id = NEW.strategy_version_id
        AND backtest_runs.instrument_type = NEW.instrument_type
        AND backtest_runs.promotion_gate = 'ready_for_review'
        AND backtest_runs.options_proxy = 0
        AND backtest_runs.not_recommendation = 1
        AND backtest_runs.freshness_status = 'fresh'
        AND julianday(backtest_runs.freshness_as_of) IS NOT NULL
        AND julianday(backtest_runs.period_end) IS NOT NULL
        AND julianday(backtest_runs.freshness_as_of) >= julianday(backtest_runs.period_end)
        AND json_valid(backtest_runs.reason_codes_json)
        AND json_array_length(backtest_runs.reason_codes_json) = 0
        AND json_valid(backtest_runs.metrics_json)
        AND abs(json_extract(backtest_runs.metrics_json, '$.tradeCount') - backtest_runs.trade_count) <= 0.0001
        AND abs(json_extract(backtest_runs.metrics_json, '$.winRatePct') - backtest_runs.win_rate_pct) <= 0.0001
        AND json_type(backtest_runs.metrics_json, '$.averageReturnPct') IN ('integer', 'real')
        AND json_type(backtest_runs.metrics_json, '$.medianReturnPct') IN ('integer', 'real')
        AND abs(json_extract(backtest_runs.metrics_json, '$.netReturnPct') - backtest_runs.net_return_pct) <= 0.0001
        AND abs(json_extract(backtest_runs.metrics_json, '$.maxDrawdownPct') - backtest_runs.max_drawdown_pct) <= 0.0001
        AND abs(json_extract(backtest_runs.metrics_json, '$.benchmarkRelativeReturnPct') - backtest_runs.benchmark_relative_return_pct) <= 0.0001
        AND json_type(backtest_runs.metrics_json, '$.bestTradeReturnPct') IN ('integer', 'real')
        AND json_type(backtest_runs.metrics_json, '$.worstTradeReturnPct') IN ('integer', 'real')
        AND json_type(backtest_runs.metrics_json, '$.averageHoldingDays') IN ('integer', 'real')
        AND json_type(backtest_runs.metrics_json, '$.grossReturnPct') IN ('integer', 'real')
        AND (
          json_type(backtest_runs.metrics_json, '$.profitFactor') IN ('integer', 'real')
          OR json_type(backtest_runs.metrics_json, '$.profitFactor') = 'null'
        )
        AND json_type(backtest_runs.metrics_json, '$.costSensitivity') = 'array'
        AND EXISTS (
          SELECT 1
          FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
          WHERE json_extract(stress.value, '$.multiplier') = 1
            AND json_type(stress.value, '$.netReturnPct') IN ('integer', 'real')
            AND json_type(stress.value, '$.averageReturnPct') IN ('integer', 'real')
            AND (
              json_type(stress.value, '$.profitFactor') IN ('integer', 'real')
              OR json_type(stress.value, '$.profitFactor') = 'null'
            )
        )
        AND EXISTS (
          SELECT 1
          FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
          WHERE json_extract(stress.value, '$.multiplier') = 2
            AND json_type(stress.value, '$.netReturnPct') IN ('integer', 'real')
            AND json_type(stress.value, '$.averageReturnPct') IN ('integer', 'real')
            AND (
              json_type(stress.value, '$.profitFactor') IN ('integer', 'real')
              OR json_type(stress.value, '$.profitFactor') = 'null'
            )
        )
        AND EXISTS (
          SELECT 1
          FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
          WHERE json_extract(stress.value, '$.multiplier') = 3
            AND json_type(stress.value, '$.netReturnPct') IN ('integer', 'real')
            AND json_type(stress.value, '$.averageReturnPct') IN ('integer', 'real')
            AND (
              json_type(stress.value, '$.profitFactor') IN ('integer', 'real')
              OR json_type(stress.value, '$.profitFactor') = 'null'
            )
        )
        AND json_valid(backtest_runs.assumptions_json)
        AND json_extract(backtest_runs.assumptions_json, '$.slippageBps') >= 0
        AND json_extract(backtest_runs.assumptions_json, '$.pointInTimeData') = 1
        AND json_extract(backtest_runs.assumptions_json, '$.survivorshipBiasControl') = 1
        AND json_extract(backtest_runs.assumptions_json, '$.lookaheadBiasControl') = 1
        AND json_extract(backtest_runs.assumptions_json, '$.spreadBps') > 0
        AND json_extract(backtest_runs.assumptions_json, '$.feePerTrade') >= 0
        AND json_extract(backtest_runs.assumptions_json, '$.minAverageDailyDollarVolume') > 0
        AND json_extract(backtest_runs.assumptions_json, '$.minTradesForReview') > 0
        AND json_extract(backtest_runs.assumptions_json, '$.minTradesForReview') =
          CAST(json_extract(backtest_runs.assumptions_json, '$.minTradesForReview') AS INTEGER)
        AND json_extract(backtest_runs.assumptions_json, '$.rejectedParameterSets') >= 0
        AND json_extract(backtest_runs.assumptions_json, '$.rejectedParameterSets') =
          CAST(json_extract(backtest_runs.assumptions_json, '$.rejectedParameterSets') AS INTEGER)
        AND json_type(backtest_runs.assumptions_json, '$.costStressMultipliers') = 'array'
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
          WHERE multiplier.type NOT IN ('integer', 'real') OR multiplier.value <= 0
        )
        AND json_type(backtest_runs.assumptions_json, '$.notes') = 'array'
        AND (
          SELECT COUNT(*)
          FROM backtest_run_trades
          WHERE backtest_run_trades.backtest_run_id = backtest_runs.id
            AND backtest_run_trades.ticker = NEW.ticker
        ) >= json_extract(backtest_runs.assumptions_json, '$.minTradesForReview')
    )
    AND NOT EXISTS (
      SELECT 1
      FROM paper_trades
      WHERE paper_trades.id = NEW.paper_trade_evidence_id
        AND paper_trades.mode = 'paper'
        AND paper_trades.status = 'closed'
        AND paper_trades.live_trading_enabled = 0
        AND paper_trades.broker_execution = 0
        AND paper_trades.ticker = NEW.ticker
        AND paper_trades.instrument_type = NEW.instrument_type
        AND paper_trades.strategy_version_id = NEW.strategy_version_id
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
    NOT EXISTS (
      SELECT 1
      FROM backtest_runs
      WHERE backtest_runs.id = NEW.backtest_run_id
        AND backtest_runs.strategy_version_id = NEW.strategy_version_id
        AND backtest_runs.instrument_type = NEW.instrument_type
        AND backtest_runs.promotion_gate = 'ready_for_review'
        AND backtest_runs.options_proxy = 0
        AND backtest_runs.not_recommendation = 1
        AND backtest_runs.freshness_status = 'fresh'
        AND julianday(backtest_runs.freshness_as_of) IS NOT NULL
        AND julianday(backtest_runs.period_end) IS NOT NULL
        AND julianday(backtest_runs.freshness_as_of) >= julianday(backtest_runs.period_end)
        AND json_valid(backtest_runs.reason_codes_json)
        AND json_array_length(backtest_runs.reason_codes_json) = 0
        AND json_valid(backtest_runs.metrics_json)
        AND abs(json_extract(backtest_runs.metrics_json, '$.tradeCount') - backtest_runs.trade_count) <= 0.0001
        AND abs(json_extract(backtest_runs.metrics_json, '$.winRatePct') - backtest_runs.win_rate_pct) <= 0.0001
        AND json_type(backtest_runs.metrics_json, '$.averageReturnPct') IN ('integer', 'real')
        AND json_type(backtest_runs.metrics_json, '$.medianReturnPct') IN ('integer', 'real')
        AND abs(json_extract(backtest_runs.metrics_json, '$.netReturnPct') - backtest_runs.net_return_pct) <= 0.0001
        AND abs(json_extract(backtest_runs.metrics_json, '$.maxDrawdownPct') - backtest_runs.max_drawdown_pct) <= 0.0001
        AND abs(json_extract(backtest_runs.metrics_json, '$.benchmarkRelativeReturnPct') - backtest_runs.benchmark_relative_return_pct) <= 0.0001
        AND json_type(backtest_runs.metrics_json, '$.bestTradeReturnPct') IN ('integer', 'real')
        AND json_type(backtest_runs.metrics_json, '$.worstTradeReturnPct') IN ('integer', 'real')
        AND json_type(backtest_runs.metrics_json, '$.averageHoldingDays') IN ('integer', 'real')
        AND json_type(backtest_runs.metrics_json, '$.grossReturnPct') IN ('integer', 'real')
        AND (
          json_type(backtest_runs.metrics_json, '$.profitFactor') IN ('integer', 'real')
          OR json_type(backtest_runs.metrics_json, '$.profitFactor') = 'null'
        )
        AND json_type(backtest_runs.metrics_json, '$.costSensitivity') = 'array'
        AND EXISTS (
          SELECT 1
          FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
          WHERE json_extract(stress.value, '$.multiplier') = 1
            AND json_type(stress.value, '$.netReturnPct') IN ('integer', 'real')
            AND json_type(stress.value, '$.averageReturnPct') IN ('integer', 'real')
            AND (
              json_type(stress.value, '$.profitFactor') IN ('integer', 'real')
              OR json_type(stress.value, '$.profitFactor') = 'null'
            )
        )
        AND EXISTS (
          SELECT 1
          FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
          WHERE json_extract(stress.value, '$.multiplier') = 2
            AND json_type(stress.value, '$.netReturnPct') IN ('integer', 'real')
            AND json_type(stress.value, '$.averageReturnPct') IN ('integer', 'real')
            AND (
              json_type(stress.value, '$.profitFactor') IN ('integer', 'real')
              OR json_type(stress.value, '$.profitFactor') = 'null'
            )
        )
        AND EXISTS (
          SELECT 1
          FROM json_each(backtest_runs.metrics_json, '$.costSensitivity') AS stress
          WHERE json_extract(stress.value, '$.multiplier') = 3
            AND json_type(stress.value, '$.netReturnPct') IN ('integer', 'real')
            AND json_type(stress.value, '$.averageReturnPct') IN ('integer', 'real')
            AND (
              json_type(stress.value, '$.profitFactor') IN ('integer', 'real')
              OR json_type(stress.value, '$.profitFactor') = 'null'
            )
        )
        AND json_valid(backtest_runs.assumptions_json)
        AND json_extract(backtest_runs.assumptions_json, '$.slippageBps') >= 0
        AND json_extract(backtest_runs.assumptions_json, '$.pointInTimeData') = 1
        AND json_extract(backtest_runs.assumptions_json, '$.survivorshipBiasControl') = 1
        AND json_extract(backtest_runs.assumptions_json, '$.lookaheadBiasControl') = 1
        AND json_extract(backtest_runs.assumptions_json, '$.spreadBps') > 0
        AND json_extract(backtest_runs.assumptions_json, '$.feePerTrade') >= 0
        AND json_extract(backtest_runs.assumptions_json, '$.minAverageDailyDollarVolume') > 0
        AND json_extract(backtest_runs.assumptions_json, '$.minTradesForReview') > 0
        AND json_extract(backtest_runs.assumptions_json, '$.minTradesForReview') =
          CAST(json_extract(backtest_runs.assumptions_json, '$.minTradesForReview') AS INTEGER)
        AND json_extract(backtest_runs.assumptions_json, '$.rejectedParameterSets') >= 0
        AND json_extract(backtest_runs.assumptions_json, '$.rejectedParameterSets') =
          CAST(json_extract(backtest_runs.assumptions_json, '$.rejectedParameterSets') AS INTEGER)
        AND json_type(backtest_runs.assumptions_json, '$.costStressMultipliers') = 'array'
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
          WHERE multiplier.type NOT IN ('integer', 'real') OR multiplier.value <= 0
        )
        AND json_type(backtest_runs.assumptions_json, '$.notes') = 'array'
        AND (
          SELECT COUNT(*)
          FROM backtest_run_trades
          WHERE backtest_run_trades.backtest_run_id = backtest_runs.id
            AND backtest_run_trades.ticker = NEW.ticker
        ) >= json_extract(backtest_runs.assumptions_json, '$.minTradesForReview')
    )
    AND NOT EXISTS (
      SELECT 1
      FROM paper_trades
      WHERE paper_trades.id = NEW.paper_trade_evidence_id
        AND paper_trades.mode = 'paper'
        AND paper_trades.status = 'closed'
        AND paper_trades.live_trading_enabled = 0
        AND paper_trades.broker_execution = 0
        AND paper_trades.ticker = NEW.ticker
        AND paper_trades.instrument_type = NEW.instrument_type
        AND paper_trades.strategy_version_id = NEW.strategy_version_id
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
  );
END;
