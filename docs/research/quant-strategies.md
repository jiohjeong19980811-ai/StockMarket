# Quant Strategy Research

Last updated: 2026-05-28T14:27:40-04:00

## Purpose

This is an addendum to the Milestone 0 external research phase. It expands the research from tools, APIs, MCP, architecture, and providers into quantitative trading strategy families. The goal is not to copy a strategy. The goal is to identify strategy hypotheses worth testing, the data required to test them, the common ways they fail, and the risk controls required before they can influence research or paper trading.

No strategy in this document is presented as guaranteed profitable or as personalized financial advice. Every strategy family remains a hypothesis until it has reproducible backtesting, documented assumptions, paper-trading evidence, risk review, source timestamps, and operator audit trails.

## Source Map

### Books

- [Ernie Chan, *Quantitative Trading*](https://books.google.com/books/about/Quantitative_Trading.html?id=NZlV0M5Ije4C): practical strategy research, backtesting, execution, and money/risk management.
- [Marcos Lopez de Prado, *Advances in Financial Machine Learning*](https://www.oreilly.com/library/view/advances-in-financial/9781119482086/): financial ML pitfalls, purged validation, labeling, and backtest skepticism.
- [John Hull, *Options, Futures, and Other Derivatives*](https://eu.pearson.com/products/9781787644274): derivatives theory, options pricing, Greeks, margins, and market conventions.
- [Sheldon Natenberg, *Option Volatility and Pricing*](https://books.google.com/books/about/Option_Volatility_Pricing_Advanced_Tradi.html?id=u_Fx7Mni17oC): options volatility, Greeks, pricing, and strategy mechanics.
- [Euan Sinclair, *Volatility Trading*](https://www.wiley-vch.de/en/areas-interest/finance-economics-law/finance-investments-13fi/trading-13fi4/volatility-trading-978-1-118-34713-3) and [*Positional Option Trading*](https://www.wiley-vch.de/en/areas-interest/finance-economics-law/finance-investments-13fi/trading-13fi4/positional-option-trading-978-1-119-58351-6): volatility estimation, options edge, and position-level risk.
- [Lawrence McMillan, *Options as a Strategic Investment*](https://www.randomhousebooks.com/books/310812): broad options strategy reference; useful for taxonomy, not MVP strategy copying.
- [Antti Ilmanen, *Expected Returns*](https://www.oreilly.com/library/view/expected-returns-an/9781119990772/): risk premia, expected-return sources, and portfolio context.
- [Larry Harris, *Trading and Exchanges*](https://academic.oup.com/book/52292): market microstructure, spreads, order types, and execution costs.
- [Robert Carver, *Systematic Trading*](https://harriman-house.com/authors/robert-carver/systematic-trading/9780857194459/): systematic process, position sizing, and risk management.

### Academic Papers And Durable Research

- [Jegadeesh and Titman, "Returns to Buying Winners and Selling Losers"](https://ideas.repec.org/a/bla/jfinan/v48y1993i1p65-91.html): classic price momentum evidence over 3- to 12-month horizons.
- [Bernard and Thomas, "Post-Earnings-Announcement Drift"](https://ideas.repec.org/a/bla/joares/v27y1989ip1-36.html): PEAD foundation.
- [Tetlock, "Giving Content to Investor Sentiment"](https://ideas.repec.org/a/bla/jfinan/v62y2007i3p1139-1168.html): media pessimism, volume, and return pressure.
- [De Bondt and Thaler, "Does the Stock Market Overreact?"](https://fac.comtech.depaul.edu/wdebondt/Publications/DoesStockM.pdf): long-horizon overreaction and mean reversion.
- [Gatev, Goetzmann, and Rouwenhorst, "Pairs Trading"](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1095996): relative-value pairs trading benchmark.
- [Frazzini and Pedersen, "Betting Against Beta"](https://pages.stern.nyu.edu/~afrazzin/pdf/Betting%20Against%20Beta%20-%20Frazzini%20and%20Pedersen.pdf): low-beta/low-volatility anomaly and leverage constraints.
- [Asness, Frazzini, Israel, and Moskowitz, "Fact, Fiction and Momentum Investing"](https://www.aqr.com/insights/research/journal-article/fact-fiction-and-momentum-investing): momentum evidence and misconceptions.
- [Bailey and Lopez de Prado, "The Deflated Sharpe Ratio"](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2460551): correcting Sharpe ratios for selection bias, non-normality, and overfitting.
- [Harvey, Liu, and Zhu, "...and the Cross-Section of Expected Returns"](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2249314): factor data-mining and multiple-testing concerns.
- [Qlib paper and repo](https://arxiv.org/abs/2009.11189): AI-oriented quant research workflows and ML platform design.

### Practitioner, Regulatory, And Framework References

- [QuantStart, "Should You Build Your Own Backtester?"](https://www.quantstart.com/articles/Should-You-Build-Your-Own-Backtester/) and [backtesting bias article](https://www.quantstart.com/articles/Successful-Backtesting-of-Algorithmic-Trading-Strategies-Part-I/): survivorship bias, lookahead bias, transaction costs, and auditability.
- [QuantConnect Lean](https://github.com/QuantConnect/Lean): mature event-driven algorithmic trading and backtesting engine; reference for reality modeling, not MVP foundation.
- [Microsoft Qlib](https://github.com/microsoft/qlib): ML quant research platform; future ML reference.
- [cvxportfolio](https://github.com/cvxgrp/cvxportfolio): portfolio optimization and backtesting with past-data-only policies.
- [PyPortfolioOpt](https://github.com/PyPortfolio/PyPortfolioOpt): portfolio optimization reference, especially covariance and allocation cautions.
- [QuantStats](https://github.com/ranaroussi/quantstats): performance-reporting reference.
- [Zipline Reloaded](https://github.com/stefan-jansen/zipline-reloaded): event-driven backtesting reference.
- [vectorbt](https://pypi.org/project/vectorbt/): fast strategy-sweep reference; license review required before direct use.
- [options_portfolio_backtester](https://github.com/lambdaclass/options_portfolio_backtester): options backtesting reference for Greeks, fills, and risk management.
- [optopsy](https://github.com/goldspanlabs/optopsy): options strategy research reference; AGPL means avoid direct dependency without legal review.
- [FINRA Options](https://www.finra.org/investors/investing/investment-products/options), [FINRA Regulatory Notice 22-08](https://www.finra.org/rules-guidance/notices/22-08?page=1), [OCC options disclosure](https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document), and [Cboe VIX education](https://www.cboe.com/tradable-products/vix): required options risk, expiration, IV, and disclosure context.
- [Options Industry Council strategy education](https://www.optionseducation.org/strategies/all-strategies): useful taxonomy for long calls, long puts, debit spreads, covered calls, and cash-secured puts. Use for education and risk framing, not as proof of edge.
- [SEC EDGAR APIs](https://www.sec.gov/edgar/sec-api-documentation): official filing source for auditable SEC catalyst research.
- [CFTC virtual currency risk guidance](https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html): crypto risk reference for future research-only phases.
- [Freqtrade](https://www.freqtrade.io/en/stable/) and [Hummingbot](https://github.com/hummingbot/hummingbot): future crypto research references only; no crypto trading in MVP.

## Cross-Cutting Research Lessons

- Backtests are evidence filters, not proof of future returns.
- The platform must record every tested strategy version, universe, parameter set, data provider, data timestamp, fee/slippage/spread assumption, and rejected variant.
- Results that only survive optimistic fills, midpoint options prices, stale data, or ignored transaction costs must be blocked.
- ML and event strategies require time-aware validation. Random cross-validation is unsafe when labels overlap or when features are revised after the trade date.
- Options strategies require contract-level historical chains, bid/ask, volume, open interest, IV, expiration, strike, and event timing. Underlying-only proxies can support research notes, but cannot justify options recommendations.
- "No good trades today" is a required system output, not a failure state.
- Initial documented liquidity defaults should be conservative and adjustable after validation: stocks above $5 with average daily dollar volume above $20M; options with open interest at least 500, volume at least 100, and bid/ask spread no wider than 10% of mid or an explicit dollar cap.
- Initial paper-only sizing defaults should be small enough to expose process failures without creating false confidence: max risk per idea around 0.25%-0.50% of paper equity, max single-name notional around 5%, max sector exposure around 20%, max correlated cluster around 15%, and max aggregate options premium at risk around 2%-3%.

## Strategy Category Evaluation

### 1. Earnings Strategies

- **Description:** Pre-earnings momentum, post-earnings announcement drift (PEAD), earnings surprise continuation, expected move versus realized move, guidance revision reaction, and no-trade rules around earnings.
- **Why it may work:** Earnings can reveal new information slowly absorbed by the market. PEAD research suggests delayed reaction after earnings surprises. High-volume earnings moves and guidance changes can also attract follow-through flows.
- **Why it may fail:** Earnings effects are crowded, regime-dependent, and sensitive to exact event timestamps. Price may gap beyond reasonable entry, guidance can contradict headline EPS, and survivorship or revised fundamental data can create false backtests.
- **Required data:** Point-in-time earnings dates and times, EPS/revenue estimates, actuals, surprise, guidance, transcript/news timestamps, price/volume, sector, options IV and expected move when options are considered.
- **Backtesting requirements:** Use event-time alignment, after-release availability rules, no same-bar leakage, market/sector adjustment, holding-period sensitivity, and separate pre-earnings versus post-earnings tests.
- **Options-specific considerations:** Earnings options face IV crush, wide spreads, fast repricing, and assignment/exercise edge cases. MVP should avoid short premium and avoid long premium when IV crush or expected-move data is missing.
- **Risk controls needed:** No-trade gate for missing earnings timestamp, stale estimates, wide options spreads, weak volume/OI, extreme gaps, or unclear guidance. Require downside scenario and invalidation after the event.
- **Example sources/books/articles/repos:** Bernard and Thomas PEAD, Lerman/Livnat/Mendenhall high-volume earnings research, Chan, QuantStart, Lean as later comparison.
- **Decision:** **Test now for stock-only PEAD and earnings surprise continuation. Test later for options around earnings after historical options chains exist. Avoid short-premium earnings trades in MVP.**
- **Implementation complexity:** Medium for stock-only; high for options because chain history and fill modeling are required.
- **Overfitting risk:** High because event windows, surprise thresholds, and holding periods are easy to tune after the fact.

### 2. Momentum Strategies

- **Description:** Price momentum, relative strength, sector momentum, breakout continuation, and news-confirmed momentum.
- **Why it may work:** Academic and practitioner research documents persistence in relative returns over intermediate horizons. Momentum may reflect underreaction, slow information diffusion, behavioral herding, or risk premia.
- **Why it may fail:** Momentum can crash during reversals, crowded positioning, high-volatility regimes, or sharp macro rotations. Turnover and slippage can erase returns.
- **Required data:** Adjusted OHLCV, point-in-time universe membership, sector/industry classification, corporate actions, benchmark/sector ETFs, news timestamps if used for confirmation.
- **Backtesting requirements:** Separate cross-sectional and time-series momentum, include turnover/costs, compare against SPY and sector benchmarks, stress reversal regimes, and track performance by volatility regime.
- **Options-specific considerations:** Long calls can express momentum but are vulnerable to high IV, theta decay, and poor contract liquidity. Debit spreads may cap cost and reduce theta/IV exposure when options data supports them.
- **Risk controls needed:** Max turnover, max single-name/sector exposure, volatility filter, gap-risk guard, liquidity floor, and no-trade gate when price move is too extended relative to ATR/realized volatility.
- **Example sources/books/articles/repos:** Jegadeesh and Titman, AQR momentum research, Chan, Qlib, ta, Lean, vectorbt as reference only.
- **Decision:** **Test now for liquid stock/ETF momentum and news-confirmed momentum as a scoring component. Test sector momentum later.**
- **Implementation complexity:** Low to medium for daily equity signals; medium for sector and options variants.
- **Overfitting risk:** Medium. Keep parameter grid small and document rejected variants.

### 3. Mean Reversion Strategies

- **Description:** Short-term overreaction, RSI-style mean reversion, gap-fill behavior, and volatility-adjusted pullbacks.
- **Why it may work:** Short-term dislocations can reflect temporary liquidity imbalance, bid/ask bounce, panic selling, or overreaction. Long-horizon contrarian effects are documented in overreaction literature.
- **Why it may fail:** Falling assets can keep falling due to real fundamental deterioration. Many mean-reversion strategies are implicitly short volatility and can suffer large losses during trend breaks.
- **Required data:** Clean OHLCV, spreads/liquidity, sector context, news/earnings filters, volatility measures, gap data, and delisting/corporate action handling.
- **Backtesting requirements:** Conservative entry timing, stop rules, holding-period limits, crisis-period stress tests, and separate tests for gap, RSI, and pullback variants.
- **Options-specific considerations:** Long calls/puts are usually a poor fit for small mean-reversion edges unless IV is low and expected move justifies premium. Options should generally be avoided for early mean-reversion tests.
- **Risk controls needed:** Tight invalidation, no averaging down by default, event/news block, max hold, liquidity floor, max drawdown guard, and stop rule sensitivity.
- **Example sources/books/articles/repos:** De Bondt and Thaler, Jegadeesh short-term reversal work, Chan, QuantStart, ta.
- **Decision:** **Test now only on large liquid stocks/ETFs with volatility-adjusted entries. Avoid illiquid, distressed, or news-driven reversals.**
- **Implementation complexity:** Low to medium.
- **Overfitting risk:** High for indicator thresholds and gap rules; use simple baselines first.

### 4. Volatility Strategies

- **Description:** Implied volatility versus realized volatility, IV rank/percentile, volatility expansion, volatility contraction, event volatility, and avoiding overpriced options.
- **Why it may work:** Options markets price expected uncertainty, and implied volatility can differ materially from subsequent realized volatility. Volatility regimes can also affect momentum, mean reversion, and position sizing.
- **Why it may fail:** Volatility risk premia are time-varying. Extreme events can overwhelm historical estimates. Short-volatility logic can look smooth in backtests and fail violently in stress.
- **Required data:** Historical realized volatility, options IV by strike/expiration, IV rank/percentile, term structure, bid/ask, event calendar, VIX or market volatility benchmarks.
- **Backtesting requirements:** Regime-specific analysis, event/non-event splits, cost stress tests, and no use of current IV history unavailable at decision time.
- **Options-specific considerations:** MVP may use IV/RV and IV rank as filters for long options and debit spreads. Short-volatility strategies are deferred because they introduce assignment, margin, and tail risk.
- **Risk controls needed:** Block long options when IV is extreme without a clear catalyst. Block short-volatility strategies in MVP. Require max loss, breakeven, theta, IV crush, and expected move display.
- **Example sources/books/articles/repos:** Hull, Natenberg, Sinclair, Cboe VIX materials, Schwab IV education, options_portfolio_backtester, optopsy as reference only.
- **Decision:** **Test now as a risk/filter layer. Test later as a standalone options/volatility strategy after paid historical options data is available. Avoid naked short volatility in MVP.**
- **Implementation complexity:** Medium for filters; high for true options volatility backtests.
- **Overfitting risk:** High because IV thresholds and event windows can be mined heavily.

### 5. Options Strategies

- **Description:** Long calls, long puts, debit spreads, covered calls and cash-secured puts for future consideration, liquidity-based filtering, spread width analysis, open interest/volume rules, expiration selection, strike selection, and theta management.
- **Why it may work:** Options can express directional or volatility views with defined max loss when long premium or debit spreads are used. Spreads can reduce premium paid and improve risk framing.
- **Why it may fail:** Options can expire worthless, spreads can be too wide, fills may be unrealistic, theta can overwhelm direction, and IV crush can offset correct underlying direction.
- **Required data:** Contract-level chains with bid, ask, last, volume, open interest, IV, Greeks, expiration, strike, multiplier, exercise style, underlying price, corporate actions, and source timestamps.
- **Backtesting requirements:** Contract selection must use only contracts visible at trade time. Model bid/ask, slippage, commissions, partial fills, expirations, early close, exercise/assignment risk notes, and delisted/expired contracts.
- **Options-specific considerations:** MVP allowed candidates are long calls, long puts, and debit spreads only. Covered calls and cash-secured puts require portfolio/cash modeling and are deferred. Naked short options are prohibited.
- **Risk controls needed:** Display max loss, premium at risk, breakeven, DTE, spread percentage, volume, OI, IV/RV, event risk, theta, and why the system might be wrong. Default to `avoid` when any required chain field is missing.
- **Example sources/books/articles/repos:** OCC, FINRA, Hull, Natenberg, Sinclair, McMillan, options_portfolio_backtester, optopsy as reference only, Lean later.
- **Decision:** **Test later for options recommendations until historical chain data exists. Use now for research-contract design and paper-only manual review. Avoid naked short options, 0DTE, and illiquid contracts.**
- **Implementation complexity:** High.
- **Overfitting risk:** Very high because strike, DTE, delta, IV, and exit rules create many degrees of freedom.

### 6. News And Sentiment Strategies

- **Description:** Breaking news momentum, sentiment trend changes, analyst upgrade/downgrade reaction, guidance revision reaction, SEC filing/news catalyst detection, and source-confirmed momentum.
- **Why it may work:** News can reveal new information before it is fully incorporated into price. Sentiment and attention can affect volume, liquidity, and follow-through.
- **Why it may fail:** Headlines can be stale, duplicated, misleading, paywalled, delayed, or already priced in. AI summaries can hallucinate if not grounded in stored source data.
- **Required data:** News source, publish timestamp, retrieval timestamp, ticker/entity mapping, source quality, article metadata, sentiment model version, analyst action timestamps, SEC filing accession/timestamp.
- **Backtesting requirements:** Use source publish time, not retrieval time alone. Deduplicate news, avoid revised sentiment labels leaking forward, compare to price reaction before and after publication, and include vendor latency assumptions.
- **Options-specific considerations:** Catalyst-driven options need event timing, expected move, IV, and liquidity. Missing any of those should produce `needs more data` or `avoid`.
- **Risk controls needed:** Citation requirement, prompt-injection safe processing, stale/duplicate filter, confidence haircut for low-quality sources, and explicit catalyst uncertainty.
- **Example sources/books/articles/repos:** Tetlock, SEC EDGAR APIs, provider news docs, Qlib for future ML workflow.
- **Decision:** **Use now as a watchlist/scoring component, not a standalone paper-trade strategy until source quality and timestamp behavior are validated.**
- **Implementation complexity:** Medium for deterministic metadata; high for robust NLP/AI scoring.
- **Overfitting risk:** High because source selection, sentiment thresholds, and timing windows are easy to mine.

### 7. Value And Quality Strategies

- **Description:** Undervalued stock candidates, earnings growth versus valuation, free cash flow, balance sheet quality, profitability, debt, and valuation re-rating opportunities.
- **Why it may work:** Value and quality factors have long-run evidence and can improve context for short-term catalysts. They may identify businesses where momentum or earnings catalysts have stronger support.
- **Why it may fail:** Value traps can stay cheap or deteriorate. Fundamentals are revised, released with delays, and highly sector-dependent. Short-term timing is weak.
- **Required data:** Point-in-time fundamentals, filing dates, fiscal periods, restatement handling, valuation multiples, free cash flow, balance sheet metrics, sector comparisons, analyst estimates if used.
- **Backtesting requirements:** Point-in-time fundamentals only, filing-lag rules, sector-neutral comparisons, long holding periods, and benchmark by factor/sector.
- **Options-specific considerations:** Fundamentals do not justify options alone; option ideas still need contract-level liquidity, IV, DTE, and catalyst timing.
- **Risk controls needed:** Value-trap warning, debt/liquidity screen, stale-fundamental block, and confidence haircut when recent guidance/news contradicts historical metrics.
- **Example sources/books/articles/repos:** Fama/French factor literature, Asness value/momentum research, Ilmanen, PyPortfolioOpt for portfolio context.
- **Decision:** **Use now as a context/scoring component. Test later as a standalone strategy after fundamentals ingestion is point-in-time.**
- **Implementation complexity:** Medium.
- **Overfitting risk:** Medium to high due to many factor definitions and lag assumptions.

### 8. Sector Rotation Strategies

- **Description:** Relative sector momentum, macro-aware sector rotation, defensive/risk-on rotation, volatility-adjusted sector allocation, and ETF-based rotation.
- **Why it may work:** Sector flows can persist when macro, rates, earnings cycles, and investor positioning favor one group over another.
- **Why it may fail:** Sector rotation can whipsaw, lag turning points, and become highly correlated during market stress. ETF histories and sector classifications can change.
- **Required data:** Sector ETF OHLCV, sector classification, macro data, rates/inflation/FRED series, earnings breadth, sector-level valuation, volatility regime.
- **Backtesting requirements:** Monthly/weekly rebalance tests, transaction costs, benchmark against SPY and equal-weight sectors, regime breakdown, and no lookahead in macro releases.
- **Options-specific considerations:** Sector ETF options may be used later only with chain history and liquidity checks. Not an MVP options focus.
- **Risk controls needed:** Max sector concentration, market-regime guard, rebalance turnover cap, correlation limit, and cash/no-trade state.
- **Example sources/books/articles/repos:** Faber tactical allocation, sector momentum research, FRED, PyPortfolioOpt/cvxportfolio later.
- **Decision:** **Test later, likely V1. Use sector context now for risk and explanation.**
- **Implementation complexity:** Medium.
- **Overfitting risk:** Medium due to rebalancing frequency and macro timing choices.

### 9. Pairs And Statistical Arbitrage

- **Description:** Pairs trading, cointegration, distance-based relative value, sector-relative spreads, and market-neutral/stat-arb baskets.
- **Why it may work:** Related securities can temporarily diverge from historical relationships due to liquidity shocks, flows, or temporary mispricing.
- **Why it may fail:** Cointegration relationships can break, borrow/shorting constraints matter, transaction costs are high, and market neutrality can fail in stress.
- **Required data:** Survivorship-bias-free universe, historical constituents, borrow/short availability if shorts are considered, spreads, sector pairs, corporate actions, and robust price histories.
- **Backtesting requirements:** Formation/test period split, re-selection schedule, borrow and short constraints, market/sector beta tracking, cost stress tests, and pair-break rules.
- **Options-specific considerations:** Options overlays add unnecessary complexity for MVP. Avoid.
- **Risk controls needed:** Pair relationship decay monitor, stop-loss/invalidation, max pair exposure, correlation/crowding checks, and no shorting/margin assumptions in MVP recommendations.
- **Example sources/books/articles/repos:** Gatev/Goetzmann/Rouwenhorst, Chan, Lean later, small GitHub replications as educational references only.
- **Decision:** **Defer. Research-only until the platform supports shorting assumptions, borrow constraints, and stronger portfolio risk controls.**
- **Implementation complexity:** High.
- **Overfitting risk:** Very high because pair selection can mine historical relationships.

### 10. Risk-Premium, Low-Volatility, And Anomaly Strategies

- **Description:** Low volatility, low beta, quality, value, momentum, volatility risk premium, carry-like effects, and anomaly combinations.
- **Why it may work:** Some premia may compensate investors for behavioral, funding, liquidity, crash, or leverage-constraint risks.
- **Why it may fail:** Factor performance decays, gets crowded, reverses under stress, or disappears after costs and data-mining corrections.
- **Required data:** Factor definitions, point-in-time fundamentals, betas, volatility, borrow/cash assumptions for long-short variants, benchmark factor returns.
- **Backtesting requirements:** Multiple-testing controls, factor exposure reporting, long-only versus long-short separation, regime analysis, and benchmark comparison.
- **Options-specific considerations:** Volatility risk premium often implies short-volatility exposure, which is not allowed in MVP.
- **Risk controls needed:** Max factor concentration, drawdown guard, no leverage assumptions, no short-volatility exposure in MVP, and data-mining skepticism.
- **Example sources/books/articles/repos:** Ilmanen, Frazzini/Pedersen, Harvey/Liu/Zhu, Bailey/Lopez de Prado, PyPortfolioOpt/cvxportfolio.
- **Decision:** **Use now for scoring vocabulary and risk context. Test later for long-only low-vol/quality screens. Avoid leveraged or short-volatility implementations in MVP.**
- **Implementation complexity:** Medium to high.
- **Overfitting risk:** Very high because the factor zoo is prone to data snooping.

### 11. ML-Based Trading Strategy Research

- **Description:** ML factor models, supervised return prediction, ranking models, sentiment models, meta-labeling, reinforcement learning, and adaptive regime models.
- **Why it may work:** ML can combine nonlinear signals across price, fundamentals, news, earnings, and volatility when data is rich and labels are well designed.
- **Why it may fail:** Financial data is noisy, non-stationary, low signal-to-noise, and vulnerable to leakage. Models can memorize tickers, future revisions, or regime artifacts.
- **Required data:** Large point-in-time datasets, feature lineage, label definitions, model/prompt versions, training windows, validation splits, data quality logs, and trial records.
- **Backtesting requirements:** Walk-forward or purged/embargoed CV, no random CV for time-series labels, trial accounting, out-of-sample degradation reporting, feature importance sanity checks, and paper-trade confirmation.
- **Options-specific considerations:** ML-generated options ideas are blocked until deterministic options filters and chain backtesting exist.
- **Risk controls needed:** Human review, confidence caps, explainability, no black-box final recommendations, overfitting metrics, and automatic `needs more data` when model evidence is weak.
- **Example sources/books/articles/repos:** Lopez de Prado, Qlib, FinRL, Bailey/Lopez de Prado, Harvey/Liu/Zhu.
- **Decision:** **Defer as a recommendation engine. Use now only for future architecture notes and possible NLP/sentiment experiments after deterministic baselines exist.**
- **Implementation complexity:** Very high.
- **Overfitting risk:** Extreme.

### 12. Crypto Strategy Research For Future Phases

- **Description:** Crypto momentum/reversal, cross-exchange arbitrage, market making, funding-rate/carry, volatility/liquidity patterns, and crypto sentiment.
- **Why it may work:** Crypto markets can have fragmentation, 24/7 trading, retail flows, exchange-specific liquidity, and changing efficiency.
- **Why it may fail:** Exchange risk, custody risk, wash trading, unstable liquidity, extreme volatility, API outages, regulatory uncertainty, and execution risk dominate.
- **Required data:** Exchange-specific OHLCV/order book/trades, fees, funding rates, liquidity, custody/exchange metadata, outage data, and tax/regulatory context.
- **Backtesting requirements:** Exchange-level data, 24/7 calendar handling, fees, latency, market impact, delisted tokens, and survivorship controls.
- **Options-specific considerations:** Crypto options are out of MVP scope.
- **Risk controls needed:** Research-only mode, no exchange credentials, no execution APIs, no custody, no leverage, and strong liquidity/counterparty risk flags.
- **Example sources/books/articles/repos:** Freqtrade, Hummingbot, crypto momentum/reversal academic work.
- **Decision:** **Future phase only. No crypto trading or exchange integration in MVP.**
- **Implementation complexity:** High.
- **Overfitting risk:** Very high due to fragmented data and regime instability.

### 13. Portfolio Construction, Position Sizing, And Risk Strategies

- **Description:** Position sizing, max daily loss, max portfolio exposure, sector concentration limits, correlation limits, drawdown controls, kill switch logic, paper-trading promotion criteria, and no-trade outcomes.
- **Why it may work:** Risk overlays do not create alpha, but they prevent fragile signals from dominating outcomes and keep paper trading interpretable.
- **Why it may fail:** Overly tight controls can block all trades, while overly loose controls can allow correlated losses. Position-sizing formulas can imply false precision if estimated edge is noisy.
- **Required data:** Recommendation scores, confidence, risk, liquidity, sector, correlation, portfolio exposure, paper-trade P/L, drawdowns, and current open paper positions.
- **Backtesting requirements:** Simulate portfolio-level exposure, sequential trades, overlapping positions, max drawdown, capacity, and stop/no-trade rules.
- **Options-specific considerations:** Options sizing should use premium/max loss, not notional alone. Debit spreads need max loss and width. Long options can go to zero.
- **Risk controls needed:** Conservative paper-size caps, max strategy exposure, max sector exposure, correlation guard, daily loss guard, drawdown stop, stale-data block, and operator approval/audit trail.
- **Example sources/books/articles/repos:** Carver, Harris, Chan, PyPortfolioOpt, cvxportfolio, QuantStats.
- **Decision:** **Build now as MVP foundation. Strategy signals cannot become paper-trade candidates without these controls.**
- **Implementation complexity:** Medium.
- **Overfitting risk:** Medium. The bigger risk is false precision in sizing from weak expected-return estimates.

## Backtesting And Validation Requirements

Every strategy test must store:

- Strategy name, family, version, and owner.
- Universe definition and survivorship-bias controls.
- Data providers, retrieval timestamps, provider timestamps, and data quality gaps.
- Entry rules, exit rules, rebalance timing, holding period, stop rules, and profit target rules.
- Slippage, spread, fee, fill, liquidity, and capacity assumptions.
- Parameter trials, rejected variants, and final selected parameters.
- Train/validation/test or walk-forward split.
- Metrics: trade count, win rate, average return, median return, best/worst trade, profit factor, Sharpe-like and Sortino-like metrics when applicable, max drawdown, turnover, average holding period, exposure, benchmark comparison, regime breakdown, sector breakdown, and earnings-event breakdown.
- Cost stress tests at baseline, 2x, and 3x estimated costs.
- Promotion decision: `research only`, `watchlist`, `paper trade eligible`, `avoid`, or `needs more data`.

Promotion blockers:

- Missing source timestamps or provider lineage.
- Underlying-only proxy used as if it were an options backtest.
- Midpoint options fills without conservative spread/fill sensitivity.
- Insufficient sample size without explicit warning.
- No out-of-sample or walk-forward test.
- Strategy selected from many variants without trial tracking or multiple-testing skepticism.
- Liquidity filters weaker than live recommendation filters.
- Any path that implies live trading, margin, broker execution, or naked options selling.

## CEO/CTO Decisions

### Test First In MVP

- Stock-only PEAD and earnings surprise continuation with strict event timestamp rules.
- Liquid equity/ETF momentum and relative strength with capped turnover.
- Volatility-adjusted mean reversion on large liquid stocks/ETFs only.
- News/sentiment as a catalyst and watchlist signal, not a standalone trade.
- Value/quality as context for conviction and risk, not as standalone short-term timing.
- Portfolio and risk overlays: max paper position size, max sector exposure, drawdown guard, stale-data gate, and no-trade outcomes.

### Test Later

- Options recommendations for long calls, long puts, and debit spreads after historical options chain data is available.
- Sector rotation after macro/sector data ingestion and portfolio risk views exist.
- Long-only low-volatility/quality screens after factor definitions are stable.
- Covered calls and cash-secured puts only after portfolio/cash accounting and assignment workflows exist.
- Pairs/stat-arb after shorting/borrow assumptions can be modeled for research without implying MVP live trading.
- ML-based strategy research after deterministic baselines, feature lineage, and validation gates exist.
- Crypto research after equities/options MVP is mature; crypto execution remains out of scope.

### Avoid In MVP

- Live trading, broker order placement, margin, leverage, autonomous execution, and crypto exchange execution.
- Naked short options, undefined-risk spreads, short straddles/strangles, 0DTE, market-making, HFT, and queue-position-sensitive scalping.
- Illiquid options, wide spreads, low open interest, stale chains, or missing IV/Greeks.
- Any strategy promoted from a backtest that ignores costs, slippage, spread, liquidity, or survivorship/lookahead bias.
- Any passive-income or guaranteed-return framing.

### Strategies Requiring Paid Or Historical Options Data

- Expected move versus realized move.
- IV rank/percentile and IV/RV mispricing.
- Earnings options and IV crush analysis.
- Strike/DTE/debit spread selection.
- Options liquidity and spread-width backtesting.
- Any paper-trade ranking that depends on historical options performance.

### Suitable For Paper Trading First

- All strategy families are paper-trading-first. No strategy graduates from research to paper-trade candidate without reproducible evidence and risk review.
- Early paper trades should favor stock-only strategies and defined-risk long premium/debit-spread options only after chain data is sufficient.

### Require Stronger Risk Controls Before Implementation

- Options, volatility, pairs/stat-arb, ML, crypto, and any strategy with shorting, leverage, or intraday execution assumptions.

### UI Research Categories

The operator UI should eventually expose strategy families as research categories:

- Earnings.
- Momentum.
- Mean Reversion.
- Volatility.
- Options.
- News / Sentiment.
- Value / Quality.
- Sector / Macro.
- Portfolio Risk.
- Avoid / Needs More Data.

Each category view should show strategy status, required data, evidence quality, risk gates, latest validation, paper-trade history, and why the system may be wrong.
