---
name: backtesting-skill
description: Design, review, and validate backtests for stock, options, earnings, sentiment, and volatility strategies. Use when evaluating strategy evidence, assumptions, promotion gates, metrics, sample quality, or backtest failures.
---

# Backtesting Skill

## Purpose

Ensure strategies are evaluated with documented assumptions before they influence recommendations.

## Inputs

- Strategy definition and version.
- Universe and time range.
- Entry and exit rules.
- Data sources and timestamps.
- Slippage, spread, and fee assumptions.
- Liquidity filters.
- Historical trades and metrics.

## Outputs

- Backtest quality assessment.
- Required metrics summary.
- Assumption and bias review.
- Promotion gate decision.
- Data limitations and follow-up tests.

## Required Checks

- Check for lookahead bias.
- Check survivorship bias.
- Verify reproducibility.
- Report trade count and sample limits.
- Include win rate, average return, median return, max drawdown, profit factor, best/worst trade, and holding period.
- Compare performance by sector, regime, and earnings proximity when possible.

## Failure Conditions

- Missing strategy rules.
- Missing assumptions.
- Too few trades without warning.
- Proxy options data presented as real options fills.
- Backtest promoted as future certainty.

## Example Usage

`Use backtesting-skill to review whether the earnings drift strategy has enough evidence to generate paper-trade candidates.`
