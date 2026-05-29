# Provider Configuration

## Current Decision

Not having a local `.env` file is not a blocker right now.

The current Milestone 3 implementation runs with mock providers, fixtures, provider interfaces, and committed tests. Real provider HTTP adapters are intentionally deferred until provider terms, pricing, historical coverage, storage rights, and data quality are reviewed.

## Finalized Provider Decisions

| Provider | Status | Current use |
| --- | --- | --- |
| Mock providers | Finalized for current development | Tests, local demos, mock ingestion, data-quality validation |
| Polygon.io / Massive | Candidate stub only | Price bars and options quotes after terms/API review |
| Financial Modeling Prep | Candidate stub only | News and earnings after terms/API review |
| Finnhub | Candidate stub only | News and earnings after terms/API review |
| SEC EDGAR | Future official-source adapter | Filings and company facts after adapter design |
| FRED | Future official-source adapter | Macro context after adapter design |

No paid provider has been finalized as the required MVP data vendor.

## Required Environment Variables Now

None.

The app, tests, CI, mock ingestion, database migrations, API health route, and current UI all run without a local `.env`.

## Optional Placeholder Variables

These are placeholders in `.env.example`; do not add real values unless a future task explicitly enables the relevant provider workflow:

| Variable | Provider | Status |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI | Optional future summarization/agent workflow key |
| `POLYGON_API_KEY` | Polygon.io / Massive | Placeholder for deferred market/options adapter |
| `FMP_API_KEY` | Financial Modeling Prep | Placeholder for deferred news/earnings/fundamentals adapter |
| `FINNHUB_API_KEY` | Finnhub | Placeholder for deferred news/earnings adapter |
| `FRED_API_KEY` | FRED | Placeholder for future macro adapter if needed |
| `SEC_EDGAR_USER_AGENT` | SEC EDGAR | Placeholder for future SEC request identity |

Do not use generic names such as `NEWS_API_KEY`, `MARKET_DATA_API_KEY`, or `OPTIONS_DATA_API_KEY` unless the architecture later introduces a provider router that documents exactly which selected provider each key maps to.

## Variables Prohibited In MVP

Broker, live-account, order, margin, and trading credentials remain prohibited. The API startup guard rejects broker credential-shaped variables such as Alpaca, Tradier, IBKR, Schwab, order, and trading prefixes.

`LIVE_TRADING_ENABLED` must remain `false`.

## What Can Continue Without Real Keys

- Provider interfaces.
- Mock provider fixtures.
- Data-quality checks.
- Normalized ingestion tables.
- Transactional DB ingestion sink.
- API and UI development.
- Scoring/risk contracts using mocked or fixture data.
- Backtesting harness design with fixture data.
- Documentation, validation, and review.

