# GitHub Repository Research

Last updated: 2026-05-28T13:38:53-04:00

## Evaluation Rules

- Prefer official or widely used repositories with active maintenance.
- Check license before recommending direct dependency or code reuse.
- Use AGPL, Commons Clause, or unclear licenses as reference-only unless a future legal review approves usage.
- Do not copy code from any repository into this project without license review.
- Do not adopt a live-trading engine in MVP.

## Top 10 Most Useful Repositories

| Rank | Repository | License note | Use decision | Why it matters |
| --- | --- | --- | --- | --- |
| 1 | [QuantConnect/Lean](https://github.com/QuantConnect/Lean) | Apache-2.0 | Consider later | Mature multi-asset algorithmic trading and backtesting engine. Useful reference for data models, reality modeling, risk controls, broker boundaries, and options support. Too large for MVP integration. |
| 2 | [microsoft/qlib](https://github.com/microsoft/qlib) | MIT | Consider later | AI-oriented quant research platform with workflow, model, data, and analysis concepts. Useful for future ML research, not MVP. |
| 3 | [openai/openai-agents-python](https://github.com/openai/openai-agents-python) | MIT | Consider later | Good reference for app-level agent orchestration, guardrails, handoffs, tracing, and evaluation if agents become runtime product features. Codex project setup remains repo-local for now. |
| 4 | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | MIT | Consider later | Useful reference for durable stateful agent workflows. Avoid adding orchestration complexity until the deterministic research pipeline is stable. |
| 5 | [tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts) | Apache-2.0 | Use later in UI | Purpose-built financial charts with small footprint. Strong candidate for ticker detail, price history, and options/volatility visuals. |
| 6 | [TanStack/table](https://github.com/TanStack/table) | MIT | Use later in UI | Headless table state for dense opportunity, watchlist, audit, and paper-trading grids. |
| 7 | [recharts/recharts](https://github.com/recharts/recharts) | MIT | Use later in UI | General dashboard charts for scoring breakdowns, paper-trade performance, and validation metrics. |
| 8 | [ranaroussi/quantstats](https://github.com/ranaroussi/quantstats) | Apache-2.0 | Consider later | Portfolio/backtest metrics reference. Useful for metrics parity, but core MVP metrics should be custom and auditable. |
| 9 | [bukosabino/ta](https://github.com/bukosabino/ta) | MIT | Consider later | Technical indicator library. Useful if the quant layer uses Python; otherwise implement a small audited indicator set first. |
| 10 | [stefan-jansen/zipline-reloaded](https://github.com/stefan-jansen/zipline-reloaded) | Apache-2.0 | Consider later | Event-driven backtesting reference. Integration adds Python runtime/data-bundle complexity, so not MVP. |

## Reference-Only Or Avoid For Direct Dependency

| Repository | License note | Decision | Rationale |
| --- | --- | --- | --- |
| [OpenBB-finance/OpenBB](https://github.com/OpenBB-finance/OpenBB) | AGPL-3.0 | Reference only | Strong financial data platform and analyst workflow reference, but AGPL is not a good direct dependency for this app without legal approval. |
| [polakowo/vectorbt](https://github.com/polakowo/vectorbt) | Apache-2.0 with Commons Clause | Reference only / legal review | Excellent vectorized backtesting ideas, but Commons Clause limits commercial use. Use docs for conceptual inspiration only unless legal approves. |
| [kernc/backtesting.py](https://github.com/kernc/backtesting.py) | AGPL-3.0 | Avoid direct dependency | Useful educational docs, but AGPL is not suitable for direct MVP inclusion without legal approval. |
| [ranaroussi/yfinance](https://github.com/ranaroussi/yfinance) | Apache-2.0 | Dev-only at most | Useful for prototypes, but Yahoo-derived data terms and reliability are not production-grade enough for the research pipeline. |

## CEO / CTO Decision

Use mature repositories as architecture references, not as the first product substrate. The MVP should custom-build narrow provider interfaces, scoring contracts, paper-trading ledger, and backtesting metrics so every decision is auditable. Adopt permissive UI libraries later. Defer heavyweight engines and ML platforms until the MVP has clean data, evidence tracking, and paper-trading history.
