# Backtesting And Validation

## Purpose

Backtesting exists to prevent attractive narratives from becoming recommendations without evidence. It does not prove future returns. It estimates how a strategy behaved under documented assumptions.

## Research-Informed Approach

The MVP should start with a small, custom, auditable backtesting harness. Mature frameworks such as QuantConnect LEAN, vectorbt, Qlib, Backtrader, Zipline Reloaded, and QuantStats should be used as references or later comparison tools, not as the MVP's core dependency. This keeps evidence gates, assumptions, and audit records aligned with the product domain from day one.

Milestone 7 starts with a pure package-level stock backtest evaluator in `@stockmarket/backtesting`. It consumes closed long-stock trade observations, source citations, freshness state, and explicit assumptions, then returns metrics and conservative evidence gates. M7-002 adds durable DB persistence for stock-only backtest runs, snapshot-coherence checks against a fresh evaluator run, and conservative recommendation evidence resolution for stored backtest IDs. The milestone still does not fetch provider data, expose API routes, optimize parameters, evaluate options, automate strategy promotion, or make performance claims.

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

Paper-trade entries must not understate risk. Max loss has to be at least the stop-based loss floor, entry and approval timestamps must be valid and ordered, and broker/order-shaped fields must be rejected even when they appear inside nested payloads.

Paper-trade closes require timestamped exit price evidence, an exit reason, lessons learned, and an audit ID. P/L should be compared against the original thesis, stop, target, time stop, and downside scenario before feeding future strategy promotion decisions.

Persisted closes must include close audit linkage and cannot be written twice for the same open paper trade. Approval, entry, and close audit IDs must point to semantically correct paper-trade audit events. This preserves a one-entry, one-exit evidence chain for later strategy review.

Backtesting and validation consumers should use the durable paper-trade read model rather than raw SQL rows. The read model exposes parsed invalidation conditions, entry risk snapshots, audit IDs, and computed simulated outcomes while keeping live trading and broker execution disabled in the returned contract.

Paper-trade evidence summaries should aggregate only closed paper trades for performance metrics while counting open trades separately. Summaries must remain `notRecommendation`, block broker/live-shaped records, reject mixed ticker/instrument/strategy/version cohorts, and require backtest plus operator review before any strategy promotion decision.

Durable paper-trade evidence verification now starts in the DB package through the recommendation evidence resolver. Backtesting consumers should resolve recommendation evidence IDs through this helper before trusting a paper-trade evidence reference. A paper-trade evidence item is verified only when it resolves to a closed persisted paper trade, remains paper-only, has broker execution disabled, matches the recommendation ticker, instrument type, and strategy version, does not point back to the same recommendation as circular self-evidence, and traces back to a source recommendation with verified backtest backing in the same cohort as the paper trade.

Stock backtest evidence gates must match resolver semantics instead of SQLite convenience parsing. The SQL gate and resolver reject numeric strings, non-finite JSON numeric values, non-string citations, Julian-only timestamp strings, timezone-naive timestamp text, whitespace/control-character variants, and calendar-invalid UTC text by requiring strict, component-matching UTC timestamps before chronology checks.

Durable stock backtest evidence verification is now also handled by the DB evidence resolver. A stored backtest evidence item is verified only when the referenced run is stock-only, marked `notRecommendation`, has `options_proxy = 0`, reaches `ready_for_review`, has clean stored reason codes, fresh data, reviewable assumptions with real JSON booleans/numbers/string arrays, coherent metrics, exact-set 1x/2x/3x cost sensitivity with no extra or duplicate stress rows, valid citation strings and chronology, a persisted trade-row count that matches the stored run count, matches the recommendation ticker/instrument/strategy cohort, and includes enough persisted trade rows for that recommendation ticker to satisfy the run's minimum trade-count assumption. Missing, `needs_more_data`, blocked, unsafe, thin-sample, or cohort-mismatched runs downgrade or block the evidence gate and cannot by themselves make a recommendation operational.

Lessons learned should be stored and visible on future recommendations from the same strategy.

## Milestone 7 Stock Backtest Contract

The first backtesting package slice returns `notRecommendation: true` and one of three promotion gates:

- `ready_for_review` when the stock-only run has enough trades, citations, freshness, and anti-bias controls.
- `needs_more_data` when the run is missing citations, freshness, trades, or minimum sample size.
- `blocked` when the run is non-stock, options proxy, missing point-in-time controls, missing survivorship-bias controls, missing lookahead-bias controls, or has invalid trade records.

The evaluator reports trade count, win rate, average return, median return, equity-curve max drawdown from chronologically sorted exits, profit factor, best/worst trade, average holding period, period-level net return, benchmark-relative return, and cost sensitivity at required 1x/2x/3x assumptions. These metrics are validation evidence only and do not override scoring, risk, or operator review gates.

Review hardening blocks options-family stock proxies, invalid source/freshness/period timestamps, freshness timestamps that precede the period end, citations retrieved before publication, out-of-period trades, duplicate trade IDs or observations, invalid cost assumptions, missing required stress scenarios, failed stock liquidity floors, invalid trade rows, and missing anti-bias controls. Heavy parameter searches downgrade to `needs_more_data` until the search process is reviewed.

Returned stock backtest metrics and trade rows are computed only from eligible shape-valid, unique, in-period observations. Duplicate or out-of-period rows still block the run, but they are excluded from reported evidence metrics so sample-size and return figures cannot be inflated by rejected rows.

## Milestone 7 Backtest Persistence

M7-002 persists stock backtest evaluator output in the DB package only after recomputing the evaluator result from the supplied input and confirming the stored result matches that snapshot. The `backtest_runs` table stores strategy version, family, stock-only instrument type, universe, period, benchmark return, promotion gate, reason codes, metrics, assumptions, citations, freshness, safety flags, and timestamps. The `backtest_run_trades` table stores the eligible trade rows tied to the run.

Persistence remains stock-only for MVP. The helper rejects non-stock inputs, options-family proxies, `optionsProxy: true`, any result that is not explicitly `notRecommendation`, and any result snapshot that does not match a fresh evaluation of the supplied input. Persisted backtest evidence can support recommendation evidence detail and later operator review, but it does not promote strategies automatically and does not replace paper trading, risk review, or out-of-sample validation.

Paper-trade eligibility now requires a resolved evidence gate of `verified`; a raw `backtestRunId` or `paperTradeEvidenceId` is not enough. In the core contract, the recommendation must carry a resolver-backed evidence review whose evidence IDs exactly match the referenced backtest or paper-trade evidence. In the DB, paper-trade recommendations and persisted paper-trade rows are blocked unless `evidence_gate = verified` and every referenced evidence row is coherent, fresh, reviewable, cohort-compatible, source-verified, and non-circular, so a valid backtest cannot mask a missing or unsafe paper-trade evidence reference.

Deferred follow-up work:

- API/read endpoints for durable backtest runs.
- Operator UI surfaces for backtest evidence detail.
- Strategy promotion automation.
- Options backtests with contract-level historical chain data.
- External framework comparison and walk-forward validation surfaces.
