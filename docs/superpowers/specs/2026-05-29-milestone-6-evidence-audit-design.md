# Milestone 6 Evidence And Audit Inspection Design

## Purpose

Add the first durable evidence resolver and operator inspection surface for Milestone 6. The feature should make it clear whether a recommendation's evidence IDs resolve to safe paper-trade evidence, while also showing citations, freshness, downside, invalidation conditions, and audit events in the operator console.

## Scope

Build a narrow stock/paper-trading slice:

- Resolve recommendation evidence from existing DB tables.
- Verify `paper_trade_evidence_id` against a closed, paper-only, broker-disabled paper trade in the same ticker, instrument, and strategy version cohort.
- Mark `backtest_run_id` as unresolved until a durable backtest table exists.
- Return recommendation citation/freshness/risk context and audit rows.
- Add a mock API dry run that seeds an in-memory DB and returns the resolver output.
- Add an operator UI panel that is hidden when the API is offline.

Do not add live trading, broker integrations, paid-provider calls, options evidence promotion, or a full backtesting persistence model in this slice.

## Architecture

Create a focused DB read helper, `getRecommendationEvidenceDetail`, under `packages/db`. It should query `recommendations`, citation fields, optional extra `recommendation_citations`, `paper_trades`, and `audit_logs`, then return a safe read model with `notRecommendation: true`.

The API should expose `/paper-trading/mock-evidence-detail-dry-run` as an in-memory route. It should seed one closed evidence paper trade and one candidate recommendation that references that trade through `paper_trade_evidence_id`, then return the DB resolver result.

The web UI should fetch the new route alongside the existing mock paper-trading routes and render a compact "Evidence Detail" panel. The panel should show evidence gate status, citation source/timestamps, freshness, downside/invalidation, audit event labels, and disabled operator decision buttons.

## Safety Rules

- Evidence is validation context, not a recommendation.
- Paper-trade evidence is verified only if the referenced paper trade is closed, paper-only, broker-disabled, and cohort-matched.
- Backtest evidence remains unresolved until a future durable backtest resolver exists.
- The offline UI must not show stale evidence metrics or decision buttons.
- Operator decision buttons are display-only/disabled in this slice.

## Testing

- DB tests must fail first for missing resolver behavior, then pass after implementation.
- API tests must verify the route requires no provider keys, uses in-memory persistence, returns `notRecommendation`, and reports verified paper-trade evidence.
- Web tests must verify citation/freshness/audit/downside/invalidation and disabled decision controls are visible online and hidden offline.
- Root CI, smoke API, status JSON parse, whitespace, secret scan, live-trading scan, and local web smoke must pass before commit.

## Decisions

- Use existing tables instead of adding a new evidence table in this slice.
- Treat durable backtest evidence as future work.
- Keep the operator UI read-only until audit-log-backed decision actions are implemented.
