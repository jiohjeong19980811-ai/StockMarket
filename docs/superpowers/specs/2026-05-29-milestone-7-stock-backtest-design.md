# Milestone 7 Stock Backtest Contract Design

## Purpose

Start Milestone 7 with a small, deterministic stock-only backtesting contract. The first slice should turn a set of historical closed trades and documented assumptions into validation metrics, quality gates, and an evidence status that can later be stored and linked to recommendations.

## Scope

Build only the package-level backtesting contract in `packages/backtesting`:

- Stock-only long trade evaluation.
- Explicit assumptions for slippage, spreads, fees, point-in-time controls, survivorship-bias controls, lookahead-bias controls, and minimum sample size.
- Required source citations and data freshness.
- Metrics for trade count, win rate, average return, median return, max drawdown, profit factor, best/worst trade, average holding period, benchmark-relative return, and cost sensitivity.
- Promotion gate values `ready_for_review`, `needs_more_data`, and `blocked`.
- `notRecommendation: true` on every result.

Do not add options backtests, parameter optimization, provider calls, database persistence, API routes, UI, live trading, broker execution, or strategy promotion automation in this slice.

## Architecture

Replace the placeholder `packages/backtesting/src/index.ts` export with typed contracts and a pure function:

- `evaluateStockBacktest(input)` validates the run shape, computes trade-level net returns after conservative costs, aggregates metrics, and returns a read model.
- Trade inputs are already closed simulated/historical observations. The function does not fetch data or infer fills.
- Evidence gates are conservative: missing source/freshness/assumption controls or non-stock instruments block or downgrade the result.

The first package tests should cover a valid run, insufficient sample size, missing anti-bias controls, missing citations/freshness, and blocked non-stock/options-proxy input.

## Safety Rules

- Backtests are validation evidence, not future-return promises.
- Backtest results cannot directly promote a strategy to recommended.
- Missing point-in-time, survivorship, or lookahead controls must block the result.
- Too few trades must produce `needs_more_data`.
- Options proxy analysis must be blocked from stock backtest promotion.
- Costs must be visible at baseline, 2x, and 3x assumptions.

## Follow-Ups

- Add DB persistence for `backtest_runs`.
- Add recommendation evidence resolver support for durable backtest IDs.
- Add API and operator UI views for backtest evidence.
- Add event-study helpers for earnings/news strategies.
- Add options backtesting only after historical options chain data is available.
