---
name: options-analysis-skill
description: Analyze options candidates, option chains, strike and expiration logic, implied volatility, realized volatility, liquidity, spreads, theta risk, event risk, max loss, and defined-risk alternatives. Use when reviewing calls, puts, spreads, or options no-trade decisions.
---

# Options Analysis Skill

## Purpose

Evaluate whether an options setup is suitable for research or paper trading. Default to avoid when liquidity, volatility, pricing, or event risk is not acceptable.

## Inputs

- Option chain snapshot with timestamp.
- Underlying price and price history.
- Realized volatility and implied volatility.
- Earnings and catalyst calendar.
- Volume, open interest, bid, ask, and spread.
- Strategy objective and holding period.

## Outputs

- Suggested instrument type or no-trade decision.
- Expiration range.
- Strike-selection logic.
- Liquidity assessment.
- IV versus realized volatility view.
- Expected move and breakeven.
- Max loss and max gain where applicable.
- Theta and event-risk notes.
- Why a spread may be safer than a naked long option.

## Required Checks

- Reject contracts with wide spreads, weak volume, or weak open interest.
- Check earnings proximity and IV crush risk.
- Show max loss.
- Include why the setup may be wrong.
- Cite data timestamps.
- Avoid naked options selling in early versions.

## Failure Conditions

- Missing bid/ask, volume, open interest, or IV.
- No max-loss explanation.
- Ignoring earnings or catalyst timing.
- Recommending illiquid contracts.

## Example Usage

`Use options-analysis-skill to evaluate AAPL call candidates for the next 30 to 60 days and decide whether to paper trade or avoid.`
