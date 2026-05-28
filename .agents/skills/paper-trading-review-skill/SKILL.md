---
name: paper-trading-review-skill
description: Review simulated trades, entries, exits, P/L, thesis quality, stop rules, profit targets, lessons learned, and paper-trade auditability. Use when evaluating paper trades or operator decisions.
---

# Paper Trading Review Skill

## Purpose

Review paper trades as evidence, not as proof of future returns.

## Inputs

- Recommendation and thesis.
- Entry price and timestamp.
- Contract details when applicable.
- Stop rule and exit rule.
- Profit target.
- Current and closed P/L.
- Exit reason and lessons learned.

## Outputs

- Paper-trade status review.
- Thesis correctness assessment.
- Risk-control compliance check.
- Lessons learned.
- Follow-up action: continue, exit, reject strategy, or needs review.

## Required Checks

- Confirm the entry matched the original thesis.
- Confirm exit rules are explicit.
- Check whether risk limits were respected.
- Record whether the thesis was right or wrong.
- Preserve timestamps and audit references.

## Failure Conditions

- Missing entry thesis.
- Missing exit or stop rule.
- P/L without timestamped prices.
- Lessons learned omitted after close.

## Example Usage

`Use paper-trading-review-skill to review all open paper trades from today's recommendations and flag stale theses.`
