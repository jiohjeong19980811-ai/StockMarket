# Milestone 2 Domain And Database Design

Last updated: 2026-05-28T17:22:33-04:00

## Goal

Define the first durable domain and persistence contracts for StockMarket so later ingestion, scoring, recommendations, paper trading, and backtesting can be audited from day one.

Milestone 2 must not add live trading, broker order placement, broker credentials, margin assumptions, naked options selling, or recommendation generation.

## Context

Milestone 1 established an npm-workspaces TypeScript monorepo with:

- `apps/api` for Fastify HTTP workflows and environment validation.
- `apps/web` for the operator console shell on strict port `3001`.
- `packages/core` for recommendation, risk, and strategy contracts.
- `packages/db` as a placeholder for persistence work.
- A root `ci` script covering typecheck, lint, format, unit tests, hook tests, dependency audit, build, and API smoke.

Subagent review for Milestone 2 produced two important constraints:

- Data engineering prefers Drizzle with committed migrations and Postgres-compatible schema discipline, because the persistence layer needs explicit constraints, auditability, point-in-time data, and ingestion idempotency.
- Security/compliance allows Milestone 2 only if it remains research/paper-only and if persisted `paper_trade` rows fail closed without citations, timestamps, evidence, audit linkage, risk fields, freshness, liquidity checks, and option-specific fields.

## Database Decision

Use Drizzle ORM for TypeScript-first schema definitions and committed hand-reviewed SQL migrations for Milestone 2.

Use SQLite through `@libsql/client` for the first local MVP implementation and CI migration tests.

Reasoning:

- Local SQLite/libSQL gives fast, deterministic migration validation without requiring a running database server.
- Drizzle keeps schema definitions in TypeScript while committed SQL migrations keep the first schema auditable.
- Drizzle Kit is deferred until an audit-clean install path is available; the current install path introduced moderate dev-dependency findings during implementation.
- The schema must avoid SQLite-only shortcuts where reasonable: stable text IDs, ISO timestamp strings, explicit check constraints, normalized tables, JSON stored as text only where the first MVP does not need relational querying.
- A future Postgres migration remains expected once ingestion volume, paid-provider licensing, deployment target, and operator workflows are clearer.

Rejected for this milestone:

- Prisma as the first ORM, because Milestone 2 needs explicit SQL constraints and small auditable migrations more than a generated client abstraction.
- A local Postgres dependency, because it adds operator setup and CI friction before the product has real ingestion.
- DuckDB as the primary store, because it is more attractive for analytics than for an append-only application/audit system.
- Drizzle Kit for this milestone, because dependency audit must stay clean before committing tooling.

## Scope

Implement the first persistence slice:

- Runtime domain schemas in `packages/core` using Zod.
- Options risk details expanded with bid/ask, volume, open interest, IV, breakeven, and liquidity pass/fail fields.
- Database schema and migration for:
  - `instruments`
  - `ingestion_runs`
  - `provider_records`
  - `data_quality_events`
  - `strategy_definitions`
  - `strategy_versions`
  - `audit_logs`
- `recommendations`
- `recommendation_citations`
- A migration runner that can apply committed SQL migrations to a clean local SQLite/libSQL database.
- Tests that prove migrations apply, constraints fail closed, duplicate provider records are rejected, and paper-trade recommendations require evidence/audit/risk fields.
- API environment guardrail expansion for common broker/execution prefixes before provider work begins.

Defer to later milestones:

- Full price bars, option chains, earnings events, news, fundamentals, backtest trades, paper trade ledger, watchlists, and operator settings.
- Raw provider payload storage until provider terms are reviewed.
- Postgres deployment configuration.
- Any paid provider integration.

## Domain Contract Requirements

`packages/core` remains the source of application-level domain contracts.

Recommendation contracts must continue to include:

- Source citations and source timestamps.
- Freshness status and data-quality notes.
- Thesis, bull case, bear case, downside scenario, invalidation, and why the system may be wrong.
- Risk, confidence, and liquidity scores in the `0` to `100` range.
- Strategy family, strategy version, and evidence status.
- Operator/audit decision record.
- Final decision of `watchlist`, `paper_trade`, `avoid`, or `needs_more_data`.

Options risk details must include, at minimum:

- Defined max loss.
- Expiration and strike logic.
- Bid, ask, mid, volume, open interest, implied volatility, and breakeven.
- Spread/liquidity risk, event risk, theta risk.
- Explicit liquidity pass/fail.
- Historical options evidence ID before options can be paper-trade eligible.

Runtime Zod schemas should validate these contracts so future API/db boundaries do not rely on TypeScript-only checks.

## Persistence Requirements

Every provider-derived normalized row should include lineage:

- Provider name.
- Provider dataset.
- Provider record ID or content hash.
- Provider/source timestamp.
- Retrieved, ingested, and normalized timestamps where applicable.
- Adapter and normalization version.
- Quality status, flags, notes, and stale reason.
- Entitlement/storage status.
- Ingestion run ID.

Every recommendation row should include or link to:

- Strategy version.
- Audit log.
- A required primary citation title, URL, source, published timestamp, and retrieved timestamp.
- Additional citations in a child table when more than one source supports the recommendation.
- Data freshness decision.
- Liquidity decision.
- Evidence ID or backtest ID when decision is `paper_trade`.
- Option risk/liquidity fields for non-stock instruments, with option `paper_trade` rows requiring historical options evidence.

Every audit log row should capture:

- Event type.
- Actor type and ID.
- Timestamp.
- Subject type and ID.
- Pipeline run ID when available.
- Strategy/scoring/risk-policy versions when available.
- Data provider and provider/source timestamps when available.
- Risk-manager decision and reasons.
- Operator decision and notes.
- AI model and prompt version when AI is used, without storing secret-bearing prompts.

## Safety Requirements

Milestone 2 must enforce these constraints in code and database tests:

- `paper_trade` recommendations fail without `paper_trade_eligible` evidence.
- `paper_trade` recommendations fail without a backtest or paper-trade evidence ID.
- Scores outside `0` to `100` fail.
- Options max loss must be positive and finite at the domain layer.
- Citation rows require URL, source, published timestamp, and retrieved timestamp.
- Provider records are idempotent by provider/dataset/provider-record ID or content hash.
- No schema stores API keys, tokens, `.env` contents, live account IDs, live balances, live positions, live order IDs, margin capacity, or raw provider auth headers.

## Testing Requirements

Milestone 2 validation must include:

- Core schema unit tests.
- Core paper-trade eligibility tests.
- API env guardrail tests.
- Migration apply test against a clean local DB.
- DB constraint tests for score bounds, evidence gates, primary citation requirements, option risk details, metadata guards, and provider idempotency.
- Existing hook tests.
- Root `npm.cmd run ci`.
- Status JSON parse, whitespace check, and secret-pattern scan.

## CEO/CTO Decisions

- Test first in Milestone 2: schema/audit foundations, not strategy logic.
- Use Drizzle + SQLite/libSQL now; keep Postgres as the likely production target later.
- Treat options `paper_trade` as blocked unless contract-level liquidity and historical options evidence exist.
- Keep provider raw payload retention unresolved until provider terms are reviewed.
- Use `paper-trade candidate`, not `recommended`, in product-facing contracts and UI language.
