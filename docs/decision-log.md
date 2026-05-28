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

## 2026-05-28: Main Codex Operator Responsibility

Decision: The main Codex agent owns final orchestration and decision-making for this repository. Subagents and skills provide scoped research, review, critique, and validation, but the main agent resolves conflicts and updates roadmap, architecture, risk, and status docs.

Reason: The project needs a single accountable operator to keep setup, research, risk controls, and implementation sequencing aligned while still benefiting from specialized agent review.

## 2026-05-28: Quant Strategy Research Priorities

Decision: Add `docs/research/quant-strategies.md` as a dedicated strategy research addendum. MVP testing starts with liquid stock/ETF strategies: PEAD, earnings surprise continuation, momentum, volatility-adjusted mean reversion, news-confirmed watchlist signals, value/quality context, and portfolio risk overlays. Options, sector rotation, pairs/stat-arb, ML, and crypto are deferred until their data, validation, and risk controls are strong enough.

Reason: Strategy research must understand proven categories, failure modes, backtesting traps, and risk controls without copying strategies or implying guaranteed returns. Options require historical chain data and realistic fills before they can generate paper-trade candidates.

## 2026-05-28: Milestone 1 Scaffold Stack

Decision: Use an npm-workspaces TypeScript monorepo for Milestone 1. Scaffold `apps/api` with Fastify, `apps/web` with Vite React, and shared packages under `packages/` for core, data, db, scoring, backtesting, paper trading, and agents.

Reason: npm is already available locally through `npm.cmd`, while `pnpm` is not installed. TypeScript supports the repo's type-safety requirement, Fastify provides a lightweight typed API surface, and Vite React matches the UI research direction without adding a full-stack framework or broker/trading surface.

## 2026-05-28: Milestone 1 Vitest Project Config

Decision: Use root `vitest.config.ts` with `test.projects` instead of `vitest.workspace.ts`.

Reason: The installed Vitest version marks workspace files as deprecated. A root project config keeps tests warning-free while still separating core, API, and web environments.

## 2026-05-28: Source Package Unignore

Decision: Keep generated/local market data ignored with `data/`, but explicitly unignore `packages/data/`.

Reason: The repo needs a source package named `packages/data` for provider contracts. The ignore rule should protect local datasets without hiding application source code.
