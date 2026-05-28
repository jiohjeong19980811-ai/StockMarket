# Open Questions

## Product And Data

- Which paid market/options data provider plan should be selected after pricing, trial access, and terms review?
- Should the first paid market/options provider be Polygon.io/Massive, or should Tradier/Alpaca market data be evaluated first for cost and options-chain coverage while keeping broker order endpoints disabled?
- Which provider can supply reliable historical options-chain data for backtesting at an acceptable cost?
- Which news provider licensing terms allow storing article metadata and summaries?
- Should the first database target be PostgreSQL only, or should local SQLite/DuckDB be supported for development?

## Architecture

- Which TypeScript/Node framework should power `apps/api`?
- Which web framework should power `apps/web`?
- Which migration tool should be adopted?
- How should AI-generated research summaries be versioned and evaluated?

## Operations

- Which GitHub issue workflow should be used once GitHub CLI or GitHub integration is authenticated?
- Which CI provider and secret scanning tools should be configured first?
- What exact operator approval process is required before any future paper broker integration?
- What review checklist is required before adding any paid provider key to local development?
