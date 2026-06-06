# Open Questions

## Product And Data

- Which paid market/options data provider plan should be selected after pricing, trial access, and terms review?
- Should the first paid market/options provider be Polygon.io/Massive, or should Tradier/Alpaca market data be evaluated first for cost and options-chain coverage while keeping broker order endpoints disabled?
- Which provider can supply reliable historical options-chain data for backtesting at an acceptable cost?
- Which historical options provider can supply point-in-time bid/ask, open interest, volume, IV, Greeks, and quote timestamps with licensing that allows local storage?
- Which provider supplies reliable point-in-time earnings estimates and analyst revisions?
- If LSEG plugin access becomes callable in Codex, what entitlements, storage rights, timestamps, quote/news licensing limits, and adapter requirements apply before its data can influence app recommendations, backtests, or UI displays?
- Which provider-specific keys should be enabled first after terms review: `POLYGON_API_KEY`, `FMP_API_KEY`, `FINNHUB_API_KEY`, another key, or none until more mock workflows are complete?
- What should the first test universe be: S&P 1500, Russell 3000, or a custom liquidity-filtered universe?
- Should MVP paper trading be long-only for stocks until shorting, borrow, and margin assumptions are explicitly modeled?
- Which news provider licensing terms allow storing article metadata and summaries?
- Should the first database target be PostgreSQL only, or should local SQLite/DuckDB be supported for development?

## Architecture

- How should AI-generated research summaries be versioned and evaluated?
- What minimum trade count, out-of-sample period, and paper-trading sample should be required before a strategy becomes `paper trade` eligible?
- What exact stale-data thresholds should apply by strategy family?
- What per-ticker sample depth, reproducibility hash, evaluator version metadata, and audit linkage should be required before stock backtest evidence can support strategy promotion beyond paper-trade review?
- Should ingestion run IDs add an additional request nonce or database-generated sequence to avoid same-request/same-clock collisions across future concurrent provider runs?

## Operations

- Should `.codex/rules/stockmarket.rules` be narrowed to auto-allow `git push`, `gh pr create`, and `gh pr merge` for this repository after the local validation gate passes, or should those actions continue to require operator approval?
- Should dependency security remediations, such as upgrading a vulnerable direct dev dependency to the npm audit fixed version, be auto-allowed after security review and successful validation?
- Which GitHub issue workflow should be used once GitHub CLI or GitHub integration is authenticated?
- Which CI provider and secret scanning tools should be configured first?
- Should third-party code-review tools such as CodeRabbit be allowed on all PRs after local secret scanning, or only on high-risk/significant branches?
- What approval process should be required before installing new Codex plugins, connectors, or skills that can access external data sources or transmit code?
- What exact operator approval process is required before any future paper broker integration?
- What review checklist is required before adding any paid provider key to local development?
- What initial paper portfolio capital base and sizing units should be used for reports and risk limits?
- What UI inspection depth is required for citations, freshness, downside, invalidation conditions, and audit events before Milestone 6 exits review?
- Should cancelled paper-trade states require a dedicated audit event and lessons-learned path before they are represented in the read model?
- Should public or exported reports require a separate compliance review for hypothetical performance language?
