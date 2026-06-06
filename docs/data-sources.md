# Data Sources

## Provider Strategy

Use provider interfaces and adapters. Do not spread vendor-specific code across scoring, UI, or backtesting modules. Store provider, retrieval timestamp, provider timestamp, raw reference IDs, and data quality status for every dataset.

## Required Data Categories

| Category | Used For | Example Providers |
| --- | --- | --- |
| Price history | Returns, volatility, momentum, mean reversion, backtests | Polygon, Tiingo, Alpha Vantage, IEX Cloud, Yahoo-compatible data |
| Options chains | Strike, expiration, bid/ask, IV, open interest, volume | Polygon, Tradier, ORATS, Cboe DataShop, broker paper APIs |
| Earnings calendar | Upcoming catalysts and timing risk | Nasdaq Data Link, Finnhub, Financial Modeling Prep, provider calendars |
| Earnings history and surprises | Earnings reaction analysis and event backtests | Financial Modeling Prep, Finnhub, Nasdaq Data Link, Alpha Vantage |
| Fundamentals | Valuation, quality, balance sheet, sector comparison | Financial Modeling Prep, Intrinio, FactSet, Nasdaq Data Link |
| News articles | Company news, macro context, source citations | NewsAPI, Benzinga, Finnhub, Alpha Vantage news, RSS sources |
| Sentiment signals | News sentiment and trend changes | Provider sentiment APIs, internal NLP over licensed news |
| Analyst revisions | Upgrades, downgrades, estimates, price-target changes | Finnhub, Benzinga, Financial Modeling Prep, premium providers |
| Insider/institutional ownership | Ownership and positioning context | SEC EDGAR, Nasdaq, premium data vendors |
| Macro and sector context | Market regime and sector alignment | FRED, index ETFs, sector ETF data, economic calendars |
| Crypto prices | Future research expansion | Coinbase, Kraken, CoinGecko, CoinMarketCap |
| Broker paper trading | Future simulated order routing | Alpaca paper, Tradier sandbox, Interactive Brokers paper |

## Quant Strategy Data Requirements

Strategy research requires point-in-time data discipline:

- Price history must include adjusted and, when needed, unadjusted OHLCV, corporate actions, delistings, universe membership, volume, liquidity, and split/dividend handling.
- Earnings data must include announcement date, announcement time, after-hours/pre-market flag, actuals, estimates, surprise, guidance, and provider/source timestamp.
- Fundamentals must include fiscal period, filing date, acceptance timestamp when available, restatement/amendment handling, and SEC EDGAR links where possible.
- News and sentiment must include source URL, publisher, published timestamp, retrieval timestamp, licensing/storage status, duplicate detection, and model/version metadata when AI is used.
- Options chains must include point-in-time bid, ask, last, mark/mid, volume, open interest, IV, Greeks when available, strike, expiration, style, multiplier, deliverable, underlying price, quote timestamp, and stale/inverted quote flags.
- Strategy backtests must record data provider, retrieval timestamp, provider timestamp, normalization version, quality gaps, and whether the dataset is survivorship-bias-free.

## Provider Interface Requirements

Each adapter must define:

- Provider name and version.
- Authentication method via environment variables.
- Rate-limit behavior.
- Data freshness expectations.
- Normalized output schema.
- Error model.
- Retry policy.
- Terms or licensing notes.
- Test fixtures with no secrets.

## Data Quality Checks

The ingestion layer must flag:

- Missing timestamps.
- Future-dated retrieval, provider, or source timestamps that could introduce lookahead bias.
- Stale data.
- Empty or partial responses.
- Suspicious or structurally invalid price bars, including invalid timestamps, nonpositive OHLC values, broken high/low bounds, negative volume, or price jumps not explained by splits.
- Options contracts with missing bid, ask, IV, open interest, or volume.
- Provider disagreement beyond configured tolerances.
- Duplicate news articles.
- Unparseable earnings dates.
- Survivorship-bias risks in backtesting datasets.

Initial provider-neutral freshness windows:

| Dataset | Freshness window | Rationale |
| --- | --- | --- |
| Intraday prices | 30 minutes | Intraday signals should not rely on stale market snapshots. |
| Daily prices | 4 days | Daily bars need weekend and market-holiday tolerance while still catching stale feeds. |
| Options quotes | 60 minutes | Options are spread-sensitive; stale chains should block confidence and paper-trade promotion. |
| News | 48 hours | Catalyst and sentiment signals decay quickly and duplicate/stale headlines should be downgraded. |
| Earnings calendar/events | 7 days | Calendar data updates more slowly, but stale event records must still be flagged before scoring. |

## Storage Rules

- Store normalized data for queries and backtests.
- Preserve raw provider references or raw snapshots only when licensing allows it.
- Do not store provider API keys or secrets.
- Mark data with entitlement and redistribution restrictions when known.
- Use migrations for schema changes.

## Initial MVP Provider Approach

Start with a low-cost or free development provider only after the provider contract is implemented. The app should support mocked ingestion so the MVP can run tests without paid data access.

No local `.env` file is required for the current mock-provider workflow. Provider-specific keys remain optional placeholders until a provider is selected and that adapter is explicitly enabled. See `docs/provider-configuration.md`.

Provider selection scoring is tracked in `packages/data/src/provider-selection.ts`. The scoring catalog is deterministic, local, and policy-oriented; it does not make network calls or finalize a paid vendor.

## Research-Informed Provider Shortlist

| Provider | Primary use | Timing | Notes |
| --- | --- | --- | --- |
| Polygon.io / Massive | Equities, options chains, market/news data | First paid-provider candidate | Confirm current branding, plan coverage, historical options depth, rate limits, and redistribution/storage terms. |
| LSEG | Equities, company intelligence, market data, and news through the desktop/plugin surface | Evaluate later | Potentially valuable for public-equity research, but do not treat plugin output as app data until entitlements, storage rights, source timestamps, and backend adapter behavior are reviewed. No callable LSEG tool is visible in the current Codex session. |
| Financial Modeling Prep | Fundamentals, earnings, ratios, market news | Evaluate for MVP | Confirm endpoint quality, licensing, and paid-plan limits. |
| Finnhub | Company news, fundamentals, earnings, analyst signals, sentiment/social data | Evaluate for MVP | Validate data quality and licensing before production use. |
| SEC EDGAR | Official filings and XBRL company facts | Use for verification | Official source; no key required for public APIs, but respect SEC access guidance. |
| FRED | Macro and economic context | Use after key setup | Official macro source for rates, inflation, labor, and market regime features. |
| Tradier | Options data and future sandbox broker paper flow | Defer | Do not use order endpoints in MVP. |
| Alpaca | Market data and future broker paper flow | Defer | Do not use order endpoints in MVP. |
| Cboe DataShop | Historical options, Greeks, volatility analytics | Defer | Likely useful for serious options validation, but cost/licensing may be high. |
| CoinGecko | Crypto market data | Future research only | No crypto execution in MVP. |

## Production Data Rules

- Provider terms must be reviewed before storing, displaying, summarizing, or redistributing provider data.
- Mock providers must exist so tests and demos do not require paid keys.
- Any provider that cannot supply timestamps or data lineage should lower confidence or be excluded from recommendations.
- Broker APIs must be modeled separately from market data APIs so order-placement capability cannot accidentally appear in MVP.
- Missing or unusable provider records must preserve ingestion-run, provider-record, and data-quality audit trails while being quarantined from normalized strategy datasets.
- Provider-like plugins or connectors must follow the same adapter, timestamp, freshness, citation, entitlement, and storage-review rules as direct API providers. They are not allowed to populate recommendations, backtests, or paper-trading evidence by bypassing the backend data layer.
