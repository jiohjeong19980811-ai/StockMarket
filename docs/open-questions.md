# Open Questions

## Product And Data

- Which paid market/options data provider plan should be selected after pricing, trial access, and terms review?
- Should the first paid market/options provider be Polygon.io/Massive, or should Tradier/Alpaca market data be evaluated first for cost and options-chain coverage while keeping broker order endpoints disabled?
- Which provider can supply reliable historical options-chain data for backtesting at an acceptable cost?
- Which historical options provider can supply point-in-time bid/ask, open interest, volume, IV, Greeks, and quote timestamps with licensing that allows local storage?
- Which provider supplies reliable point-in-time earnings estimates and analyst revisions?
- What should the first test universe be: S&P 1500, Russell 3000, or a custom liquidity-filtered universe?
- Should MVP paper trading be long-only for stocks until shorting, borrow, and margin assumptions are explicitly modeled?
- Which news provider licensing terms allow storing article metadata and summaries?
- Should the first database target be PostgreSQL only, or should local SQLite/DuckDB be supported for development?

## Architecture

- How should AI-generated research summaries be versioned and evaluated?
- What minimum trade count, out-of-sample period, and paper-trading sample should be required before a strategy becomes `paper trade` eligible?
- What exact stale-data thresholds should apply by strategy family?

## Operations

- Which GitHub issue workflow should be used once GitHub CLI or GitHub integration is authenticated?
- Which CI provider and secret scanning tools should be configured first?
- What exact operator approval process is required before any future paper broker integration?
- What review checklist is required before adding any paid provider key to local development?
- What initial paper portfolio capital base and sizing units should be used for reports and risk limits?
- Should public or exported reports require a separate compliance review for hypothetical performance language?
