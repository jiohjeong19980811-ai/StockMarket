# Milestone 2 Domain And Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first runtime domain schemas, option-risk contract hardening, database schema, migrations, migration tests, and safety guardrail updates for StockMarket.

**Architecture:** `packages/core` owns runtime domain validation and eligibility rules. `packages/db` owns Drizzle schema definitions, committed SQL migrations, a local libSQL migration runner, and DB constraint tests. `apps/api` keeps environment safety gates and receives expanded broker/execution-prefix blocking.

**Tech Stack:** TypeScript, Zod, Drizzle ORM, committed SQL migrations, `@libsql/client`, Vitest, Fastify, npm workspaces.

---

## File Structure

- Modify `packages/core/package.json` to add `zod`.
- Modify `packages/core/src/recommendation.ts` to add option liquidity fields and stricter eligibility checks.
- Create `packages/core/src/schemas.ts` for Zod runtime schemas.
- Modify `packages/core/src/index.ts` to export schemas.
- Modify `packages/core/test/recommendation.test.ts` for options field coverage.
- Create `packages/core/test/schemas.test.ts` for runtime contract validation.
- Modify `packages/db/package.json` to add Drizzle/libSQL dependencies and test/migration scripts.
- Create `packages/db/src/schema.ts` for Drizzle table definitions.
- Create `packages/db/src/migrate.ts` for local SQL migration execution.
- Modify `packages/db/src/index.ts` to export schema/migration helpers.
- Create `packages/db/migrations/0000_initial_research_schema.sql`.
- Create `packages/db/test/migration.test.ts`.
- Modify `apps/api/src/env.ts` and `apps/api/test/env.test.ts` to broaden broker/execution env blocking.
- Modify root `package.json` if a workspace DB migration script is useful.
- Update `docs/status/current-work.md`, `docs/status/work-items.json`, `docs/status/validation-status.md`, `docs/decision-log.md`, and `docs/risk-and-compliance.md`.

### Task 1: Install Database And Runtime Schema Dependencies

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/db/package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add dependencies**

Run:

```powershell
npm.cmd install zod --workspace @stockmarket/core
npm.cmd install drizzle-orm @libsql/client --workspace @stockmarket/db
```

Expected: `package-lock.json`, `packages/core/package.json`, and `packages/db/package.json` update without adding broker/trading packages. Do not keep Drizzle Kit in this milestone unless `npm.cmd run audit:deps` remains clean.

- [ ] **Step 2: Verify dependency audit**

Run:

```powershell
npm.cmd run audit:deps
```

Expected: `found 0 vulnerabilities`.

### Task 2: Harden Core Recommendation Contracts

**Files:**
- Modify: `packages/core/src/recommendation.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/core/src/schemas.ts`
- Modify: `packages/core/test/recommendation.test.ts`
- Create: `packages/core/test/schemas.test.ts`

- [ ] **Step 1: Write failing tests for options liquidity fields**

Add tests asserting that options `paper_trade` eligibility fails without bid/ask, volume, open interest, IV, breakeven, liquidity pass, and historical options evidence.

Run:

```powershell
npm.cmd run test --workspace @stockmarket/core -- recommendation
```

Expected before implementation: tests fail because the contract does not yet require all fields.

- [ ] **Step 2: Expand `OptionsRiskDetails`**

Add these fields:

```ts
bid: number;
ask: number;
mid: number;
volume: number;
openInterest: number;
impliedVolatility: number;
breakeven: number;
liquidityPass: boolean;
```

Update `hasValidOptionsRiskDetails` to require finite positive `maxLoss`, `bid`, `ask`, `mid`, `impliedVolatility`, and `breakeven`; non-negative integer-like `volume` and `openInterest`; `ask >= bid`; `liquidityPass === true`; and `historicalOptionsEvidenceId`.

- [ ] **Step 3: Add runtime Zod schemas**

Create `packages/core/src/schemas.ts` exporting:

```ts
recommendationSchema;
sourceCitationSchema;
optionsRiskDetailsSchema;
operatorDecisionRecordSchema;
scoreSetSchema;
dataFreshnessSchema;
```

Schemas must enforce score ranges, nonempty narratives, citation URL/timestamps, finite positive max loss, option liquidity fields, and known enum values.

- [ ] **Step 4: Verify core tests**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/core
```

Expected: all core tests pass.

### Task 3: Add Initial DB Schema And Migrations

**Files:**
- Modify: `packages/db/package.json`
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/migrate.ts`
- Modify: `packages/db/src/index.ts`
- Create: `packages/db/migrations/0000_initial_research_schema.sql`
- Create: `packages/db/test/migration.test.ts`

- [ ] **Step 1: Write failing migration tests**

Create tests that:

- Apply all migrations to a clean local DB.
- Insert one valid instrument.
- Reject duplicate provider records for the same provider/dataset/provider record ID.
- Reject recommendations with scores outside `0` to `100`.
- Reject `paper_trade` recommendations without evidence ID.
- Reject a recommendation without required primary citation timestamps.
- Reject an options paper-trade recommendation without option risk details.
- Accept a no-trade options recommendation with failed liquidity documented.
- Reject metadata that looks like raw payloads or secret-bearing auth material.
- Accept a watchlist recommendation with audit linkage and citation.

Run:

```powershell
npm.cmd run test --workspace @stockmarket/db
```

Expected before implementation: tests fail because schema and migration helpers do not exist.

- [ ] **Step 2: Add Drizzle schema definitions**

Define Drizzle tables for:

```text
instruments
ingestion_runs
provider_records
data_quality_events
strategy_definitions
strategy_versions
audit_logs
recommendations
recommendation_citations
```

Use text IDs, ISO timestamp text fields, explicit enum-like text fields, score integer columns with checks, and JSON metadata stored as text.

- [ ] **Step 3: Add committed SQL migration**

Create `packages/db/migrations/0000_initial_research_schema.sql` with the same tables and constraints. Include foreign keys, unique constraints for provider idempotency, and recommendation checks that fail closed for `paper_trade`.

- [ ] **Step 4: Add migration runner**

Create a migration helper that:

- Reads `.sql` files from `packages/db/migrations` in lexical order.
- Applies them with `@libsql/client`.
- Enables foreign keys with `PRAGMA foreign_keys = ON`.
- Does not read `.env` files.

- [ ] **Step 5: Verify DB tests**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/db
```

Expected: DB migration and constraint tests pass.

### Task 4: Broaden API Broker/Execution Env Guardrails

**Files:**
- Modify: `apps/api/src/env.ts`
- Modify: `apps/api/test/env.test.ts`

- [ ] **Step 1: Write failing env tests**

Add tests that populated `APCA_API_KEY_ID`, `TWS_ACCOUNT_ID`, `SCHWAB_CLIENT_SECRET`, `ORDER_API_KEY`, and `TRADING_API_KEY` are rejected without printing values.

Run:

```powershell
npm.cmd run test --workspace @stockmarket/api -- env
```

Expected before implementation: tests fail for newly blocked prefixes.

- [ ] **Step 2: Implement prefix expansion**

Expand the broker credential key pattern to include:

```text
APCA_
TWS_
SCHWAB_
ORDER_
TRADING_
```

The thrown error must list only key names.

- [ ] **Step 3: Verify API tests**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/api -- env
```

Expected: API env tests pass.

### Task 5: Update Status And Decisions

**Files:**
- Modify: `docs/decision-log.md`
- Modify: `docs/risk-and-compliance.md`
- Modify: `docs/status/current-work.md`
- Modify: `docs/status/work-items.json`
- Modify: `docs/status/validation-status.md`

- [ ] **Step 1: Record decisions**

Add decision-log entries for Drizzle/libSQL local MVP persistence, Postgres as likely future system of record, runtime Zod schema validation, and no raw provider payload retention without license review.

- [ ] **Step 2: Clean compliance wording**

Replace product-facing `recommended paper-trade candidate` wording with `paper-trade candidate`.

- [ ] **Step 3: Update status docs**

Set `M2-001` to `In Progress` during implementation, then `Needs Review` after validation passes.

### Task 6: Full Validation And Commit

**Files:**
- Validate all changed files.

- [ ] **Step 1: Run focused tests**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/core
npm.cmd run test --workspace @stockmarket/db
npm.cmd run test --workspace @stockmarket/api -- env
```

Expected: all focused tests pass.

- [ ] **Step 2: Run full CI**

Run:

```powershell
npm.cmd run ci
python -m json.tool docs/status/work-items.json
git diff --check
```

Also run the repository's standard secret-pattern and broker-key assignment scans from `docs/status/validation-status.md` without embedding literal secret or broker key patterns in this plan.

Expected: CI passes, status JSON parses, no whitespace errors beyond Windows line-ending warnings, and no secret-shaped matches.

- [ ] **Step 3: Commit**

Run:

```powershell
git add -A
git commit -m "feat: add domain database contracts"
git push
```

Expected: branch pushed with Milestone 2 implementation.

## Self-Review

- Spec coverage: The plan covers runtime schemas, option-risk hardening, migrations, DB constraints, API env guardrails, status docs, and validation.
- Safety check: The plan adds no live trading, broker order placement, margin, naked options selling, crypto execution, or paid-provider secrets.
- Scope check: Full provider ingestion, backtesting, paper-trade ledger, and operator UI are deferred to later milestones.
