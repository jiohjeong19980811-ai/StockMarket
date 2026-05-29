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
- Earnings surprise continuation strategies.
- Liquid equity/ETF momentum and relative strength strategies.
- Volatility-adjusted mean-reversion strategies.
- News sentiment strategies.
- Value and quality context signals.
- Sector and macro context strategies after MVP.
- Volatility mispricing strategies.
- Portfolio risk overlays and no-trade gates.

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
- Parameter grid and rejected variants.
- Data availability rules for event timestamps.
- Strategy family and strategy version.

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
- Benchmark-relative return.
- Turnover and exposure.
- Evidence quality status.

## Validation Gates

A strategy cannot produce `paper trade` candidates unless:

- The backtest run is stored and reproducible.
- The assumptions are visible.
- The parameter trials and rejected variants are recorded.
- Trade count is large enough or the sample-size limitation is flagged.
- Liquidity filters match live recommendation filters.
- Results are not based on lookahead bias.
- Point-in-time data is used for earnings, fundamentals, news, analyst revisions, and options chains.
- The strategy has out-of-sample or walk-forward validation when there is any tuning.
- Costs are stress-tested at baseline, 2x, and 3x estimated fees/spreads/slippage.
- Data freshness and source quality are acceptable.
- The risk manager does not block the strategy.

After MVP, selected strategies should be compared against at least one external framework or independent implementation to catch implementation-risk differences.

The scoring layer may surface a `watchlist`, `avoid`, or `needs_more_data` decision from research-only inputs, but it cannot promote an idea to `paper_trade` without eligible evidence IDs and passing risk gates. Scoring is an audit-friendly triage layer, not proof of edge.

Milestone 4 adds a strategy policy catalog to the scoring package. Backtesting promotion checks must respect the catalog:

- `test_now` families can be evaluated for MVP paper trading after reproducible evidence exists.
- `context_only` families can contribute explanatory signal components but should remain watchlist/context unless later validation changes policy.
- `test_later` families need stronger data, validation, and implementation review before they can become ordinary paper-trade candidates.
- `control_layer` families are portfolio/risk guardrails, not alpha hypotheses.

Promotion blockers:

- Missing source timestamps or provider lineage.
- Underlying-only proxy analysis presented as a real options backtest.
- Midpoint options fills without conservative bid/ask and failed-fill sensitivity.
- Strategy chosen from many variants without multiple-testing disclosure or Deflated-Sharpe/PBO-style skepticism.
- Insufficient trade count without a visible warning.
- Liquidity filters weaker than the production recommendation filters.
- Any assumption requiring live trading, margin, broker order placement, or naked options selling.

## Quant Strategy Validation Notes

- Earnings strategies must align trades to the first realistic tradable time after the announcement. Same-bar or revised-data leakage blocks promotion.
- Momentum strategies must include turnover, crash/reversal regime performance, sector concentration, and volatility-regime slices.
- Mean-reversion strategies must include stop/invalidation rules and crisis-period stress tests because losses can grow when the signal is really a trend break.
- News and sentiment strategies must use publish timestamps, retrieval timestamps, deduplication, source licensing, and model/prompt versions when AI is used.
- Value and quality strategies require filing-date and restatement handling; period-end dates alone are not enough.
- Sector rotation requires macro release timing rules, benchmark comparisons, and concentration caps.
- Pairs/stat-arb, ML strategies, and crypto strategies are research-only until stronger data, validation, and risk controls exist.

## Options Backtesting Notes

Options backtesting requires extra caution:

- Historical options chains may be expensive or incomplete.
- Midpoint fills can overstate performance.
- Wide spreads and low open interest must be modeled conservatively.
- Earnings IV crush and theta decay must be represented.
- Undefined max gain/loss structures must be avoided in MVP.

If historical options data is unavailable, label results as proxy analysis and require paper-trading evidence before ranking highly.

Options strategies cannot produce `paper trade` candidates from underlying-only proxy results. Contract-level historical chains must include bid, ask, volume, open interest, IV, expiration, strike, multiplier, underlying price, and source timestamps. Initial options research should stay limited to long calls, long puts, and debit spreads with defined max loss; naked short options, short volatility, credit spreads, and 0DTE are out of MVP scope.

## Paper Trading Feedback Loop

Paper-trading outcomes should feed validation:

- Was the thesis correct?
- Did the entry trigger behave as expected?
- Was liquidity sufficient?
- Did the exit rule work?
- Was the downside scenario realistic?
- What did the system miss?

Paper-trade entries must be durable before they are treated as validation evidence. The MVP ledger stores the thesis snapshot, numeric stop-loss, profit-target, time stop, audit references, and paper risk snapshots so later exits and lessons can be tied back to the original approved plan.

Paper-trade closes require timestamped exit price evidence, an exit reason, lessons learned, and an audit ID. P/L should be compared against the original thesis, stop, target, time stop, and downside scenario before feeding future strategy promotion decisions.

Lessons learned should be stored and visible on future recommendations from the same strategy.
