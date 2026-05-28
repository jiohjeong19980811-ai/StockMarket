# Data Provider Research

Last updated: 2026-05-28T13:38:53-04:00

## Provider Evaluation Criteria

- Data category coverage.
- Historical depth and timestamp quality.
- Options chain support, including bid, ask, volume, open interest, implied volatility, and greeks where available.
- Earnings and fundamentals coverage.
- Terms of use, redistribution limits, rate limits, and commercial constraints.
- Reliability and status visibility.
- Ability to cite source and retrieval timestamp.

## Recommended Providers

| Provider | Categories | Decision | Notes |
| --- | --- | --- | --- |
| [Massive / Polygon docs](https://polygon.io/docs) | Stocks, options, indices, forex, crypto, flat files | Use now if plan supports needs | Strong candidate for market and options data. Docs show REST, WebSocket, and flat-file access across asset classes. Use adapter abstraction, not direct coupling. |
| [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) | Filings, XBRL company facts, submissions | Use now | Official, no API key required, real-time filing updates and nightly bulk files. Use for fundamentals and filing evidence. |
| [FRED API](https://fred.stlouisfed.org/docs/api/fred/) | Macro series and releases | Use now | Official macro context source for rates, inflation, labor, recession proxies, and market regime context. |
| [Financial Modeling Prep docs](https://site.financialmodelingprep.com/developer/docs/dashboard) | Fundamentals, financial statements, earnings, analyst estimates, news | Consider for MVP | Broad coverage. Verify paid tier, redistribution, freshness, and data licensing before production reliance. |
| [Finnhub docs](https://finnhub.io/docs/api) | News, fundamentals, earnings, analyst data, market data | Consider for MVP | Useful broad API candidate. Verify exact endpoint limits and licensing. |
| [Benzinga API docs](https://docs.benzinga.com/introduction/introduction) | News, earnings, analyst ratings, transcripts, options activity | Consider later / paid | Strong event-data candidate, especially for catalysts. Likely paid and licensing-sensitive. |
| [NewsAPI Everything endpoint](https://newsapi.org/docs/endpoints/everything) | General news search | Consider as secondary | Useful for broad discovery, but not finance-specialized enough to be primary catalyst source. |
| [Tradier API docs](https://docs.tradier.com/docs) | Market data, options chains, paper/live brokerage | Defer broker use | Useful future paper-broker candidate. It also exposes live order placement, so keep broker modules disabled in MVP. |
| [Alpaca docs](https://docs.alpaca.markets/docs) | Market data, paper trading, live stocks/options/crypto | Defer broker use | Useful future paper-trading integration. Docs include trading and market data APIs; order paths must remain unavailable in MVP. |
| [CoinGecko API docs](https://docs.coingecko.com/) | Crypto market data | Future research only | Good crypto data candidate for V2 research module. No crypto trading in MVP. |

## Data Model Requirements

Every provider adapter must persist:

- Provider name and endpoint family.
- Retrieval timestamp.
- Provider timestamp if available.
- Input parameters.
- Normalized record.
- Raw response reference or raw snapshot where terms allow.
- Data quality status.
- Rate-limit and freshness metadata.

## Use Now

- Provider interfaces and adapter registry.
- Official SEC EDGAR adapter for filings/facts.
- FRED adapter for macro context.
- One paid-capable market/options provider adapter after operator chooses account and plan.
- Mock providers for tests and local development.

## Consider Later

- Benzinga for higher-quality catalysts, analyst changes, earnings, transcripts, and unusual options activity.
- Broker paper-trading provider integration through Alpaca or Tradier only after internal paper-trading ledger is stable.
- CoinGecko crypto data after stock/options MVP proves out.

## Avoid

- Direct provider calls scattered through the app.
- Provider responses without timestamps and source attribution.
- Data vendors whose terms do not permit the intended storage, display, or analysis.
- Unofficial scraped data in production.
- Broker or exchange APIs in MVP.
