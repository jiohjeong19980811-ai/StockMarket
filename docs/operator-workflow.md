# Operator Workflow

## Daily Flow

1. Run the daily research pipeline manually in the MVP.
2. Review data freshness and data quality warnings.
3. Open the dashboard.
4. Review ranked opportunities and any `no good trades today` result.
5. Inspect each candidate detail page.
6. Check source citations, timestamps, risk panel, confidence, and downside case.
7. Choose `watch`, `paper trade`, `reject`, or `needs review`.
8. Review active paper trades and pending exit rules.
9. Review what changed since the previous run.

## Candidate Review Checklist

Before accepting a paper trade:

- Ticker and instrument type are clear.
- News summary cites stored sources.
- Earnings risk is visible.
- Historical behavior supports the thesis or the weakness is flagged.
- Options contract passes spread, volume, open interest, IV, and expiration checks.
- Risk and confidence scores are explained.
- Bull and bear cases are credible.
- Invalidation conditions are explicit.
- Position sizing is for paper trading only.
- The system explains why this idea is better than alternatives.
- The system explains why it might be wrong.

## Operator Decisions

### Watch

Use when the idea is interesting but needs confirmation, better data, or a cleaner entry.

### Paper Trade

Use when the idea passes risk checks and has enough evidence to simulate.

### Reject

Use when the thesis is weak, risk is excessive, liquidity is poor, or data is unreliable.

### Needs Review

Use when a human follow-up is needed before a decision, such as checking an unusual catalyst or provider conflict.

## Paper Trade Review

For every paper trade, track:

- Entry thesis.
- Entry timestamp and price.
- Contract details when applicable.
- Exit rule.
- Stop rule.
- Profit target.
- Current P/L.
- Closed P/L.
- Exit reason.
- Whether the thesis was correct.
- Lessons learned.

## End-Of-Day Review

The operator should review:

- New recommendations.
- Rejected ideas and why they failed.
- Active paper trades.
- Data quality warnings.
- Backtest or paper-trade performance changes.
- Audit-log anomalies.

No daily pick should be treated as accepted without operator review and paper-trade tracking.

## Codex Session Workflow

At the start of Codex work, project hooks surface the core repo guidance and check that decision, lesson, and open-question files exist. During a turn, hooks guard against secrets, destructive commands, live-trading requests, and out-of-repo work. At the end of a turn, hooks remind Codex to report validation and update:

- `docs/decision-log.md`
- `docs/lessons-learned.md`
- `docs/open-questions.md`
- `docs/status/current-work.md`
- `docs/status/work-items.json`
- `docs/status/research-progress.md`
- `docs/status/validation-status.md`

Hooks are guardrails, not a replacement for human review.

## Project Status Review

During foundation work, the operator can inspect `docs/status/` to see the current phase, active task, owner/agent, blockers, next step, research progress, and validation state. A future UI should expose these as a lightweight Project Status / Roadmap dashboard after the core research and paper-trading workflow exists.
