# StockMarket Codex Operating Guide

## Mission

Build StockMarket as a research-first, paper-trading-first investing research platform. The product may analyze stocks, options, market history, news, earnings, fundamentals, volatility, sentiment, and catalysts, but it must never present output as guaranteed income or personalized financial advice.

## Non-Negotiable Safety Boundaries

- Do not implement real-money trading in the MVP.
- Do not add broker live-trading credentials, live order placement, margin assumptions, or naked options selling.
- Treat every output as a research signal with uncertainty, assumptions, risk, confidence, citations, and data timestamps.
- Every opportunity must include a downside scenario, invalidation conditions, liquidity checks, and a final decision of `watchlist`, `paper trade`, `avoid`, or `needs more data`.
- The system must be able to say `no good trades today`.
- Options are high risk and can expire worthless. Show max loss, spread/liquidity risk, event risk, theta risk, and why an option should be avoided when data is weak.
- No strategy can be promoted to `recommended` without documented backtesting or paper-trading evidence.

## Required Phase Order

- Finish repo and Codex setup before application code.
- Configure, document, and test Codex lifecycle hooks before application code.
- Maintain lightweight project status under `docs/status/` during foundation work.
- Complete the external research phase in `docs/research/` before application code.
- Update architecture, roadmap, security, risk, agent, and data-source docs from research before application code.

## Repository Workflow

- Work inside this repository only.
- Create or use a feature branch for all changes.
- Inspect existing files before editing. Preserve user changes and do not revert unrelated work.
- Keep changes scoped to the requested task.
- Do not commit secrets, tokens, API keys, broker credentials, local database dumps, `.env` files, or generated private data.
- Use `.env.example` for placeholder environment variables only.

## Target Architecture

Prefer the modular monorepo shape documented in `docs/architecture.md`:

- `apps/web` for the operator UI.
- `apps/api` for backend HTTP/API workflows.
- `packages/core` for shared domain models and research contracts.
- `packages/data` for provider interfaces and adapters.
- `packages/db` for schema and migrations.
- `packages/scoring` for explainable signal scoring.
- `packages/backtesting` for validation and historical simulation.
- `packages/paper-trading` for simulated positions and performance.
- `packages/agents` for prompts, workflows, and agent handoff contracts.

Adapt this structure if future repo code establishes a stronger local convention.

Research-informed defaults:

- Custom-build the MVP domain contracts, provider interfaces, scoring, risk gates, paper-trading ledger, audit logs, and initial backtesting harness.
- Treat QuantConnect LEAN, Qlib, vectorbt, Zipline Reloaded, OpenBB, and similar projects as references or later integrations, not MVP foundations.
- Avoid direct AGPL or unclear-license dependencies until license obligations are reviewed.
- Keep broker, order-placement, and crypto exchange integrations deferred.
- If the frontend stack is React, prefer TradingView Lightweight Charts for financial charts, TanStack Table for dense tables, shadcn/Radix-style components for UI primitives, and Recharts for summary charts.

## Data And Recommendation Contract

Every stored recommendation must include:

- Source citations and source timestamps.
- Data freshness status and known data quality gaps.
- Thesis, instrument type, expiration/strike logic when options are considered, and market context.
- Bull case, bear case, why the system might be wrong, and downside scenario.
- Risk score, confidence score, liquidity score, and no-trade filters.
- Backtest or paper-trade evidence when available.
- Operator decision and audit trail.

## Engineering Standards

- Use type-safe code where the chosen stack supports it.
- Keep provider access behind adapter interfaces. Do not hardcode one data vendor throughout the app.
- Use database migrations for schema changes.
- Validate environment variables at startup.
- Use structured logging and audit logs for pipeline decisions.
- Write focused tests for scoring, risk controls, provider contracts, backtests, and paper trading.
- Add UI smoke tests when building operator-facing screens.
- Prefer deterministic validation scripts over manual-only checks.

## Validation Expectations

Before marking implementation tasks complete, run the relevant checks and report any that cannot run:

- Type check.
- Lint and formatting check.
- Unit tests.
- Integration tests for API, ingestion, and database workflows.
- Migration validation.
- UI smoke tests for changed pages.
- Backtesting sanity checks.
- Data ingestion dry run with mocked or sandbox data.
- Secret scan.
- Production build verification.

## Codex Usage

- Use this `AGENTS.md` as durable project guidance.
- Use `docs/research/recommendation-summary.md` as the current CEO/CTO decision summary from external research.
- Use `docs/status/` for current work, roadmap item status, research progress, and validation status.
- Use repo skills in `.agents/skills` for repeatable research, risk, validation, and review workflows.
- Use project-scoped custom agents in `.codex/agents` only for explicit subagent workflows.
- Use lifecycle hooks in `.codex/hooks.json` and `.codex/hooks/` for safety, validation, memory reminders, and workflow guardrails.
- Use the OpenAI developer documentation MCP server for Codex/OpenAI documentation questions.
- Keep MCP access least-privilege. Do not configure broker, trading, or broad filesystem MCP servers without explicit approval.
- Project-local `.codex/config.toml` is conservative by default and should remain focused on workspace-scoped access.

## Main Codex Operator Responsibility

The main Codex agent is the primary operator and final decision-maker for this repository. It acts as founding CTO, lead architect, principal engineer, product manager, security reviewer, quantitative research lead, operator workflow owner, and team orchestrator.

Subagents and skills are specialized contributors, not independent decision-makers. The main Codex agent is responsible for choosing subagents/skills, defining scope, preventing duplicate work, reviewing handoffs, resolving conflicts, making final architecture/product/risk decisions, updating roadmap and status files, and keeping all work inside project safety boundaries.

The main Codex agent may make autonomous project decisions as long as the non-negotiable safety boundaries are respected. Do not wait for operator approval unless a boundary is reached, an action is destructive, credentials or external access are involved, or the task explicitly asks for approval.

## Session Startup Context Policy

At the start of a new Codex session, use minimal context loading. Do not read or summarize the whole repository by default.

Read only:

- `AGENTS.md`.
- `docs/status/current-work.md`.
- `docs/status/work-items.json` if it exists.
- `docs/open-questions.md`.
- `docs/decision-log.md` only when the current task depends on prior architecture, product, risk, provider, or workflow decisions.
- Files directly relevant to the current task.

Do not recursively read all files under `docs/`, `apps/`, `packages/`, `.codex/`, or the repository root unless the operator explicitly asks for a broad review. Use targeted search instead of broad reading. For each task, first identify the smallest file set needed; if more context is needed, explain which file is needed and why before reading a large file or directory.

At the end of a meaningful session, update:

- `docs/status/current-work.md`.
- `docs/status/work-items.json`.
- `docs/open-questions.md` if new questions were discovered.
- `docs/decision-log.md` if new decisions were made.

## Review Stance

For reviews, lead with serious bugs, financial-risk failures, security issues, missing auditability, and missing tests. In this repository, a change that enables live trading, hides risk, omits timestamps, skips citations, or weakens secret handling is a high-priority issue.
