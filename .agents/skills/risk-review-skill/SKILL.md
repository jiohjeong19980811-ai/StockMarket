---
name: risk-review-skill
description: Review investment research, options ideas, scoring, paper trading, and platform changes for risk controls, no-trade rules, downside scenarios, position sizing, confidence, uncertainty, and live-trading prohibitions.
---

# Risk Review Skill

## Purpose

Enforce the platform's safety boundaries and ensure every research output shows risk, uncertainty, and downside.

## Inputs

- Recommendation or feature change.
- Risk score and confidence score.
- Liquidity and volatility checks.
- Position sizing framework.
- Backtest or paper-trade evidence.
- Operator workflow impact.

## Outputs

- Risk approval, warning, or block.
- Missing control list.
- No-trade rationale when appropriate.
- Required disclosure or audit fields.

## Required Checks

- Confirm no live trading is enabled.
- Confirm options risk is explicit.
- Confirm downside and invalidation conditions exist.
- Confirm no guaranteed-income language.
- Confirm source timestamps and data quality are visible.
- Confirm paper sizing does not imply real-money sizing.

## Failure Conditions

- Live trading path in MVP.
- Missing downside scenario.
- Missing risk or confidence score.
- Missing citations or timestamps.
- Options idea without max-loss or liquidity checks.

## Example Usage

`Use risk-review-skill to review this opportunity before it can become a paper-trade candidate.`
