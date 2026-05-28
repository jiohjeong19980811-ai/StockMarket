# Backtesting Framework Research

Last updated: 2026-05-28T13:38:53-04:00

## Evaluation Criteria

- License compatibility.
- Support for event-driven and vectorized testing.
- Ability to model slippage, bid/ask spreads, fees, liquidity, options expiry, assignment risk, and event timing.
- Auditability and reproducibility.
- Integration complexity.
- Suitability for stock-only and options strategies.

## Frameworks Reviewed

| Framework | License note | Decision | Notes |
| --- | --- | --- | --- |
| [QuantConnect Lean](https://www.quantconnect.com/docs/v2/writing-algorithms/key-concepts/algorithm-engine) | Apache-2.0 | Consider later | Very mature engine with options, reality modeling, broker models, and datasets. Integration is too heavy for MVP, but architecture is worth studying. |
| [Qlib](https://qlib.readthedocs.io/en/latest/introduction/introduction.html) | MIT | Consider later | Strong for AI quant workflows and ML experiments. Not needed before deterministic scoring/backtesting is stable. |
| [VectorBT](https://vectorbt.dev/) | Apache-2.0 with Commons Clause | Reference only / legal review | Excellent vectorized strategy-sweep ideas. License limits direct commercial use, so do not depend on it without legal approval. |
| [Backtesting.py](https://kernc.github.io/backtesting.py/) | AGPL-3.0 | Avoid direct dependency | Lightweight and educational, but AGPL is not a good direct dependency without legal review. |
| [Zipline Reloaded](https://zipline.ml4trading.io/) | Apache-2.0 | Consider later | Event-driven backtesting reference with PyData ecosystem fit. Adds data bundle and Python runtime complexity. |
| [QuantStats](https://github.com/ranaroussi/quantstats) | Apache-2.0 | Consider later | Useful for performance analytics and metrics vocabulary. MVP should implement a small audited metric set first. |

## MVP Backtesting Decision

Custom-build a narrow, auditable MVP backtesting package first:

- Stock-only signal replay.
- Long-call and long-put proxy testing where historical options data exists.
- Debit-spread testing only after options chain snapshots are available.
- Explicit assumptions for slippage, spreads, fees, fill timing, and holding periods.
- Stored backtest run configuration and deterministic versioned results.
- No strategy can be promoted to `recommended` without documented backtest or paper-trading evidence.

## Required Metrics

- Win rate.
- Average and median return.
- Max drawdown.
- Sharpe-like metric with clear assumptions.
- Profit factor.
- Number of trades.
- Average holding period.
- Worst trade.
- Best trade.
- Performance by sector.
- Performance by market regime.
- Performance around earnings.
- Slippage, spread, and fee assumptions.

## Things To Avoid

- Optimizing strategies without out-of-sample checks.
- Treating backtest performance as a guarantee.
- Comparing options strategies without liquidity and spread assumptions.
- Ignoring survivorship bias, lookahead bias, stale data, and corporate actions.
- Letting AI invent performance statistics.

## Later Path

After MVP, evaluate whether to integrate Lean or a Python backtesting service for more realistic options modeling. Keep the app-level recommendation contract independent so backtesting engines can be swapped.
