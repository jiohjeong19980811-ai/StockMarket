# Milestone 7 Backtest Persistence Design

## Goal

Persist deterministic stock-only backtest evidence so recommendation evidence resolution can verify stored backtest IDs instead of treating them as unresolved placeholders.

## Scope

- Add durable SQLite tables for stock backtest runs and run trades.
- Add a DB helper that persists an `@stockmarket/backtesting` evaluator input/result pair.
- Keep the persisted contract stock-only, `notRecommendation`, no-provider-key, and no-broker-execution.
- Resolve stored backtest evidence in the recommendation evidence detail helper.
- Do not add API routes, UI surfaces, strategy promotion automation, options backtests, or external backtesting engines in this slice.

## Data Shape

Backtest runs should store:

- Strategy version ID and strategy family.
- Instrument type, stock-only for this MVP slice.
- Universe and period start/end.
- Benchmark return.
- Promotion gate and reason codes.
- Data freshness status, timestamp, and notes.
- Source citations.
- Assumptions.
- Metrics, including trade count, win rate, drawdown, net return, benchmark-relative return, and cost sensitivity.
- Audit metadata and timestamps.
- A hard `not_recommendation = 1` flag.

Backtest run trades should store:

- Parent run ID.
- Source trade ID from the evaluator result.
- Ticker.
- Net return, gross return, and holding days.
- Exit ordering for reproducible review.

## Guardrails

- Only stock backtests can persist in this slice.
- `notRecommendation` must remain true.
- Options-family, options proxy, or non-stock runs must not persist.
- A run with blocked promotion gate may persist as evidence history, but evidence resolution should return it as blocked rather than verified.
- A run with `needs_more_data` may persist, but evidence resolution should return needs-more-data/unresolved semantics, not verified.
- A verified backtest evidence item requires same ticker/instrument/strategy version cohort as the recommendation and a `ready_for_review` stored run.
- No live trading, broker execution, broker credentials, or order-placement fields are introduced.

## Acceptance Criteria

- Migration tests verify the new tables exist, enforce stock-only/not-recommendation constraints, validate JSON fields, and cascade/delete or reject unsafe rows appropriately.
- DB helper tests persist a valid evaluator result and read it back with metrics/trades intact.
- Evidence resolver tests verify a matching ready run, block cohort mismatches, block unsafe or unsupported runs, and downgrade `needs_more_data` runs.
- Root CI passes.
