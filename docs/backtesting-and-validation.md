# Backtesting And Validation

## Purpose

Backtesting exists to prevent attractive narratives from becoming recommendations without evidence. It does not prove future returns. It estimates how a strategy behaved under documented assumptions.

## Research-Informed Approach

The MVP should start with a small, custom, auditable backtesting harness. Mature frameworks such as QuantConnect LEAN, vectorbt, Qlib, Backtrader, Zipline Reloaded, and QuantStats should be used as references or later comparison tools, not as the MVP's core dependency. This keeps evidence gates, assumptions, and audit records aligned with the product domain from day one.

## Strategy Types

The framework should support:

- Stock-only signals.
- Long call signals.
- Long put signals.
- Debit spread signals when options data supports it.
- Earnings run-up strategies.
- Post-earnings drift strategies.
- News sentiment strategies.
- Volatility mispricing strategies.

## Required Inputs

Each backtest must define:

- Strategy name and version.
- Universe selection.
- Data sources and timestamps.
- Entry rules.
- Exit rules.
- Holding period.
- Stop rules.
- Profit target rules.
- Slippage assumptions.
- Spread assumptions.
- Fee assumptions.
- Liquidity filters.
- Market regime labels if available.
- Survivorship-bias controls when possible.

## Required Metrics

Track:

- Win rate.
- Average return.
- Median return.
- Max drawdown.
- Sharpe-like metric when applicable.
- Profit factor.
- Number of trades.
- Average holding period.
- Worst trade.
- Best trade.
- Performance by sector.
- Performance by market regime.
- Performance around earnings.
- Slippage, spread, and fee sensitivity.

## Validation Gates

A strategy cannot produce `paper trade` candidates unless:

- The backtest run is stored and reproducible.
- The assumptions are visible.
- Trade count is large enough or the sample-size limitation is flagged.
- Liquidity filters match live recommendation filters.
- Results are not based on lookahead bias.
- Data freshness and source quality are acceptable.
- The risk manager does not block the strategy.

After MVP, selected strategies should be compared against at least one external framework or independent implementation to catch implementation-risk differences.

## Options Backtesting Notes

Options backtesting requires extra caution:

- Historical options chains may be expensive or incomplete.
- Midpoint fills can overstate performance.
- Wide spreads and low open interest must be modeled conservatively.
- Earnings IV crush and theta decay must be represented.
- Undefined max gain/loss structures must be avoided in MVP.

If historical options data is unavailable, label results as proxy analysis and require paper-trading evidence before ranking highly.

## Paper Trading Feedback Loop

Paper-trading outcomes should feed validation:

- Was the thesis correct?
- Did the entry trigger behave as expected?
- Was liquidity sufficient?
- Did the exit rule work?
- Was the downside scenario realistic?
- What did the system miss?

Lessons learned should be stored and visible on future recommendations from the same strategy.
