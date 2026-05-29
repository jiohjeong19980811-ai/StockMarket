# Implementation Plan

## Milestone 0: Foundation Setup

Deliverables:

- Repo `AGENTS.md`.
- Codex project config, rules, agents, and skills.
- Codex lifecycle hooks with documentation and policy tests.
- Architecture, roadmap, risk, security, data source, validation, and operator workflow docs.
- `.gitignore` and `.env.example`.
- Lightweight status files under `docs/status/`.
- Structured external research docs under `docs/research/`.

Status: current phase.

## Milestone 0.1: Lifecycle Hooks

Tasks:

- Add `.codex/hooks.json`.
- Add hook scripts under `.codex/hooks/`.
- Add hook policy tests.
- Document hook trust and review workflow.
- Update operator, security, risk, and agent docs.

Proposed GitHub issues:

- `M0.1: Add Codex lifecycle hooks`
- `M0.1: Add hook policy tests`
- `M0.1: Document hook trust and operator workflow`

## Milestone 0.2: External Research

Tasks:

- Research GitHub repositories, articles, plugins, MCP servers, providers, backtesting tools, UI references, memory strategies, and security practices.
- Create `docs/research/*` files.
- Make CEO/CTO decisions on use now, defer, avoid, custom-build, and integrate.
- Update architecture, roadmap, agent, security, risk, and data-source docs.

Proposed GitHub issues:

- `M0.2: Complete external research phase`
- `M0.2: Decide MVP data and backtesting approach`
- `M0.2: Update architecture from research findings`

## Milestone 0.3: Lightweight Status Tracking

Tasks:

- Add `docs/status/current-work.md`.
- Add `docs/status/work-items.json`.
- Add `docs/status/research-progress.md`.
- Add `docs/status/validation-status.md`.
- Update architecture and roadmap docs so the future UI includes a Project Status / Roadmap dashboard.
- Keep lifecycle hooks limited to reminders, not automatic status mutation.

Proposed GitHub issues:

- `M0.3: Add lightweight project status files`
- `M0.3: Add future Project Status dashboard to roadmap`
- `M0.3: Add validation/status update reminders to hooks`

## Milestone 1: Project Scaffold

Tasks:

- Choose stack and create monorepo layout.
- Add package manager, lint, format, type check, and test commands.
- Add CI-ready validation scripts.
- Add environment validation.
- Add structured logging package.

Proposed GitHub issues:

- `M1: Scaffold monorepo with apps and packages`
- `M1: Add lint, typecheck, test, and build scripts`
- `M1: Add environment validation and secret-safe config`

## Milestone 2: Database And Domain Contracts

Tasks:

- Define core domain models.
- Add database package and migration tool.
- Create initial schema for tickers, prices, options, earnings, news, scores, recommendations, paper trades, backtests, audit logs, and data quality logs.
- Add migration validation.

Proposed GitHub issues:

- `M2: Define core research domain contracts`
- `M2: Add database schema and migrations`
- `M2: Add audit and data quality tables`

## Milestone 3: Provider Interfaces And Ingestion

Tasks:

- Create provider interfaces.
- Add mock providers for tests.
- Implement price ingestion.
- Implement news ingestion.
- Implement earnings ingestion.
- Implement options-chain ingestion.
- Add data freshness checks.

Proposed GitHub issues:

- `M3: Add provider adapter interfaces`
- `M3: Implement ticker and price ingestion`
- `M3: Implement news and earnings ingestion`
- `M3: Implement options-chain ingestion and liquidity normalization`

## Milestone 4: Scoring And Risk

Tasks:

- Add scoring component interfaces.
- Implement initial component scores.
- Add risk manager and no-trade filters.
- Store explanations and timestamps.
- Generate daily recommendations.

Proposed GitHub issues:

- `M4: Add explainable scoring engine skeleton`
- `M4: Add options liquidity and volatility checks`
- `M4: Add risk manager and no-trade rules`
- `M4: Generate daily opportunity report`

## Milestone 5: API And UI

Tasks:

- Add backend API.
- Add dashboard shell.
- Add opportunities page.
- Add ticker detail page.
- Add options summary page.
- Add system health and audit log pages.

Proposed GitHub issues:

- `M5: Add backend research API`
- `M5: Build dashboard and opportunities UI`
- `M5: Build ticker and options detail pages`
- `M5: Add data freshness and audit log views`

## Milestone 6: Paper Trading

Tasks:

- Add paper-trading ledger contracts.
- Add operator decisions.
- Track entries, exits, stops, targets, P/L, and lessons learned.
- Display active and closed paper trades.

Initial Milestone 6 scope is stock-only and simulated-only. Options paper trades remain deferred until options strategy policy is promoted and historical options chain validation exists.

Proposed GitHub issues:

- `M6: Add paper-trading module`
- `M6: Add operator decision workflow`
- `M6: Add paper-trade performance dashboard`

## Milestone 7: Backtesting

Tasks:

- Add backtesting framework.
- Add stock-only backtest.
- Add options proxy backtests where data supports it.
- Track required metrics and assumptions.
- Gate recommendations on evidence.

Proposed GitHub issues:

- `M7: Add backtesting framework`
- `M7: Add strategy metrics and assumption reporting`
- `M7: Enforce evidence gates for recommendations`

## Milestone 8: Hardening

Tasks:

- Add integration tests.
- Add UI smoke tests.
- Add secret scan.
- Add dependency audit.
- Add production build check.
- Review security and compliance docs.

Proposed GitHub issues:

- `M8: Add regression and smoke test suite`
- `M8: Add secret scan and dependency audit`
- `M8: Perform MVP security and risk review`

## GitHub Issue Creation

This repository is newly initialized and no authenticated GitHub issue workflow is configured in this local session. The proposed issue list above is ready to create once GitHub CLI or the GitHub integration is authenticated and approved by the operator.
