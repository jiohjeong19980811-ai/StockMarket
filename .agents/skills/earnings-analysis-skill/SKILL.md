---
name: earnings-analysis-skill
description: Analyze earnings events, historical surprises, post-earnings moves, run-up behavior, guidance changes, IV crush risk, and catalyst uncertainty. Use when reviewing earnings-driven stock or options setups.
---

# Earnings Analysis Skill

## Purpose

Assess whether earnings create a useful catalyst or unacceptable event risk for a stock or options idea.

## Inputs

- Upcoming earnings date and timestamp.
- Historical earnings dates.
- EPS and revenue surprises.
- Guidance changes.
- Historical pre- and post-earnings price moves.
- Options IV and expected move when available.

## Outputs

- Earnings catalyst summary.
- Historical reaction pattern.
- Surprise and guidance context.
- Expected move context.
- Event-risk assessment.
- Avoid/watch/paper-trade recommendation input.

## Required Checks

- Verify upcoming earnings date freshness.
- Separate confirmed earnings dates from estimates.
- Compare expected move with historical realized moves.
- Flag elevated IV and IV crush risk.
- Include downside scenario.

## Failure Conditions

- Earnings date is missing or stale.
- Historical reaction uses too few events without warning.
- Options idea ignores earnings proximity.
- Guidance or surprise claims lack sources.

## Example Usage

`Use earnings-analysis-skill to decide whether MSFT is an earnings run-up candidate or should be avoided until after the report.`
