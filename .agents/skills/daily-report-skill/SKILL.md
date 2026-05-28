---
name: daily-report-skill
description: Create daily research reports with ranked opportunities, no-good-trades outcomes, source citations, timestamps, risk, confidence, changes since prior run, paper-trade candidates, and operator actions.
---

# Daily Report Skill

## Purpose

Prepare the daily operator-facing research report from stored data, scores, risks, and paper-trading status.

## Inputs

- Daily pipeline run.
- Ranked opportunities.
- Source summaries and timestamps.
- Risk and confidence scores.
- Backtest and paper-trade evidence.
- Previous report or recommendation history.
- Data quality warnings.

## Outputs

- Executive summary.
- Top opportunities or `no good trades today`.
- Watchlist changes.
- Candidate details.
- Risk and uncertainty summary.
- Paper-trade updates.
- Data freshness and quality status.
- Operator action list.

## Required Checks

- Include citations and timestamps.
- Include why each idea might be wrong.
- Include final decision per idea.
- Explain changes since prior run.
- Flag missing data.
- Avoid financial-advice or guaranteed-income language.

## Failure Conditions

- No source citations.
- No downside cases.
- No data freshness status.
- Trade-like instructions without paper-trading framing.
- Missing no-trade explanation when all candidates fail.

## Example Usage

`Use daily-report-skill to draft today's operator report after the scoring pipeline completes.`
