# Decision Log

## 2026-05-28: Research-First MVP Boundary

Decision: The MVP is limited to research signals, explainable recommendations, and paper trading. Real-money trading, live broker order placement, margin assumptions, and naked options selling are prohibited until a future explicitly approved phase.

Reason: The system must establish data quality, backtesting, paper-trading evidence, risk controls, audit logs, and operator review before any live execution path exists.

## 2026-05-28: Codex Setup Pattern

Decision: Use repo-level `AGENTS.md`, project `.codex/config.toml`, `.codex/hooks.json`, `.codex/agents`, `.agents/skills`, and documentation under `docs/` as the durable setup.

Reason: This matches current Codex project guidance while keeping configuration, skills, hooks, and agent roles auditable in the repository.

## 2026-05-28: Hook Representation

Decision: Use `.codex/hooks.json` rather than inline hooks in `.codex/config.toml`.

Reason: Official Codex docs recommend one hook representation per config layer to avoid duplicate or confusing hook loading. A JSON file keeps hook registration separate from permission profile configuration.

## 2026-05-28: Lightweight Status Tracking

Decision: Track current work, roadmap items, research progress, and validation status in simple files under `docs/status/` before building any UI.

Reason: The project needs visibility now, but a full roadmap UI would distract from foundation, research, and MVP risk controls.

## 2026-05-28: External Research Decisions

Decision: Custom-build the MVP core contracts, provider adapters, scoring, risk gates, paper-trading ledger, audit logs, and initial backtesting harness. Use mature finance and agent repositories as references or later benchmark integrations, not as the MVP foundation.

Reason: The product needs a narrow, auditable research workflow before adding heavy quant engines, runtime agent orchestration, broker integrations, or crypto execution.

## 2026-05-28: Provider Shortlist

Decision: Evaluate Polygon.io first for market/options data, Financial Modeling Prep or Finnhub for fundamentals/news/earnings, SEC EDGAR for official filings, and FRED for macro context. Defer Tradier/Alpaca broker capabilities until internal paper trading is stable.

Reason: Provider adapters preserve swapability, while broker order endpoints create unacceptable MVP risk.

## 2026-05-28: Backtesting Approach

Decision: Build a small auditable MVP backtesting harness before integrating a mature external backtesting engine.

Reason: The MVP requires explainable evidence gates and stored assumptions more than breadth. External engines can later serve as validation benchmarks.

## 2026-05-28: Minimal Session Startup Context

Decision: New Codex sessions should load only `AGENTS.md`, current status files, open questions, decision log when relevant, and task-specific files. Broad repo scans are opt-in only.

Reason: The project needs continuity without wasting context on unrelated docs, app directories, generated files, or future packages.
