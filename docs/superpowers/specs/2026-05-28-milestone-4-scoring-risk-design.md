# Milestone 4 Scoring And Risk Design

## Purpose

Milestone 4 starts the scoring and risk layer without generating live recommendations or requiring real provider keys. The package should turn already-normalized research inputs into deterministic scores, risk-gate decisions, and explanations that downstream recommendation workflows can audit.

## Scope

Build the first `@stockmarket/scoring` slice:

- Component score contracts for momentum, mean reversion, earnings, news/sentiment, value/quality, volatility, and liquidity context.
- Deterministic score aggregation into the existing core `ScoreSet`.
- Hard risk gates for missing citations, stale or missing data, missing evidence, liquidity failure, options risk gaps, and paper exposure limits.
- A final research decision of `watchlist`, `paper_trade`, `avoid`, or `needs_more_data`.
- Explanation payloads listing score contributors, risk gate failures, assumptions, and why paper-trade promotion was blocked.

## Non-Goals

- No live trading, broker order placement, or broker credentials.
- No real provider network calls.
- No AI-generated trade thesis.
- No strategy backtest engine.
- No options recommendation promotion from underlying-only proxy data.
- No claim that any score is predictive or profitable.

## Decisions

- Treat all strategies as hypotheses. A high score is not a recommendation by itself.
- Use `paper_trade` only when evidence status is `paper_trade_eligible`, at least one evidence ID is present, all hard gates pass, and scores satisfy conservative thresholds.
- Keep options paper-trade promotion blocked unless contract-level risk details are present and liquidity passes.
- Define `scores.risk` as a risk-control quality score where higher means safer controls and fewer gate problems.
- Preserve `no good trades today` behavior by allowing every scored candidate to return `avoid` or `needs_more_data`.

## Data Flow

1. A caller supplies a `ScoringInput` built from normalized data, citations, freshness status, strategy family, evidence status, component signals, liquidity context, and paper exposure context.
2. `evaluateRiskGates(input)` returns pass/fail gates with severity, message, and recommendation impact.
3. `scoreOpportunity(input)` aggregates bounded component scores, applies evidence/data-quality haircuts, computes a core `ScoreSet`, and chooses a final decision.
4. The caller may use the result to build a future `Recommendation`, but the scoring package itself does not persist records or place trades.

## Testing

Use TDD in `packages/scoring/test/scoring.test.ts`.

Required behavior:

- Strong stock research with paper-trade evidence and passing gates can return `paper_trade`.
- Research-only evidence can return `watchlist` at most.
- Missing citations or stale/missing data returns `needs_more_data`.
- Exposure, liquidity, or options-risk failures return `avoid`.
- Scores are clamped to `0..100` and include explanations.

## Safety Review

This design keeps Milestone 4 inside the research-first and paper-trading-first boundary. It adds no credentials, no order placement, no broker integration, no paid-provider activation, and no guaranteed-profit language.
