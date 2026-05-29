# Milestone 6 Evidence And Audit Inspection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a durable recommendation evidence resolver and show evidence/citation/audit inspection in the operator console.

**Architecture:** Add a focused DB read helper in `packages/db/src/evidence-resolver.ts`, export it, expose it through one in-memory API dry-run route, and render it in the existing React operator console. The resolver verifies paper-trade evidence against durable `paper_trades` rows while leaving backtest evidence unresolved until a backtest table exists.

**Tech Stack:** TypeScript, libSQL local client, Fastify, Vite React, Vitest, npm workspaces.

---

### Task 1: DB Evidence Resolver

**Files:**
- Create: `packages/db/src/evidence-resolver.ts`
- Modify: `packages/db/src/index.ts`
- Test: `packages/db/test/evidence-resolver.test.ts`

- [x] **Step 1: Write failing DB tests**

Add tests that seed a candidate recommendation with `paper_trade_evidence_id`, a closed paper trade from the same ticker/instrument/strategy cohort, recommendation citations, and audit logs. Assert `getRecommendationEvidenceDetail(client, "rec_candidate_1")` returns `evidenceGate: "verified"`, one verified paper-trade evidence item, citation/freshness/downside/invalidation fields, and labeled audit events. Add a second test that changes the paper-trade ticker and expects `evidenceGate: "blocked"` with reason `paper_trade_evidence_cohort_mismatch`.

- [x] **Step 2: Verify DB tests fail**

Run: `npm.cmd run test --workspace @stockmarket/db -- evidence-resolver`

Expected: fail because `evidence-resolver.ts` and `getRecommendationEvidenceDetail` do not exist.

- [x] **Step 3: Implement DB resolver**

Implement `getRecommendationEvidenceDetail(client, recommendationId)` with:

- Recommendation lookup from `recommendations`.
- Primary citation plus rows from `recommendation_citations`.
- Paper evidence lookup from `paper_trades` when `paper_trade_evidence_id` exists.
- Audit rows for recommendation and verified paper-trade evidence.
- `evidenceGate` values `verified`, `needs_more_data`, or `blocked`.
- `notRecommendation: true`.

- [x] **Step 4: Verify DB tests pass**

Run: `npm.cmd run test --workspace @stockmarket/db -- evidence-resolver`

Expected: pass.

### Task 2: Mock API Evidence Detail Route

**Files:**
- Modify: `apps/api/src/server.ts`
- Modify: `apps/api/test/paper-trading.test.ts`
- Modify: `scripts/smoke-api.mjs`

- [x] **Step 1: Write failing API/smoke expectations**

Add an API test for `GET /paper-trading/mock-evidence-detail-dry-run`. Assert it returns no provider keys, `notRecommendation: true`, in-memory persistence, `evidenceDetail.evidenceGate: "verified"`, a verified `paper_trade` evidence item, citation source/timestamps, freshness, downside, invalidation conditions, and approval/entry/close audit events.

- [x] **Step 2: Verify API test fails**

Run: `npm.cmd run test --workspace @stockmarket/api -- paper-trading`

Expected: fail with route not found.

- [x] **Step 3: Implement route**

Seed an in-memory DB with one closed evidence paper trade and one candidate recommendation referencing that paper trade through `paper_trade_evidence_id`. Return `getRecommendationEvidenceDetail`.

- [x] **Step 4: Update smoke API**

Extend `scripts/smoke-api.mjs` to call the new route and assert the verified evidence gate and paper-only broker-disabled evidence item.

- [x] **Step 5: Verify API tests pass**

Run: `npm.cmd run test --workspace @stockmarket/api -- paper-trading`

Expected: pass.

### Task 3: Operator Evidence Inspection UI

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/test/App.test.tsx`

- [x] **Step 1: Write failing web expectations**

Update the online dashboard test to mock the new API response and assert the UI shows `Evidence Detail`, `Verified Evidence`, the citation source, published/retrieved timestamps, freshness as-of, downside, invalidation condition, audit event labels, and disabled decision buttons.

- [x] **Step 2: Verify web test fails**

Run: `npm.cmd run test --workspace @stockmarket/web -- App`

Expected: fail because the UI does not fetch or render evidence detail.

- [x] **Step 3: Implement UI panel**

Add the new fetch, response type, fallback object, derived labels, and a panel rendered only when online. Keep action buttons disabled in this slice.

- [x] **Step 4: Verify web tests pass**

Run: `npm.cmd run test --workspace @stockmarket/web -- App`

Expected: pass.

### Task 4: Docs, Validation, And Commit

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/backtesting-and-validation.md`
- Modify: `docs/risk-and-compliance.md`
- Modify: `docs/product-roadmap.md`
- Modify: `docs/decision-log.md`
- Modify: `docs/status/current-work.md`
- Modify: `docs/status/work-items.json`
- Modify: `docs/status/validation-status.md`

- [x] **Step 1: Update status docs**

Mark M6-017 in progress/completed as validation advances. Record the resolver decision and remaining backtest evidence-table deferral.

- [x] **Step 2: Run aggregate validation**

Run: `npm.cmd run ci`

Expected: typecheck, lint, format check, tests, hooks, dependency audit, build, and API smoke pass.

- [x] **Step 3: Run release scans**

Run:

```powershell
python -m json.tool docs/status/work-items.json > $null
git diff --check
rg -n --hidden -S "sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[0-9A-Za-z-]{10,}" --glob "!node_modules/**" --glob "!**/dist/**" .
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3001
```

Expected: JSON parses, whitespace check has no errors, secret scan has no matches, and local web smoke returns HTTP 200.

- [x] **Step 4: Commit**

Commit message: `feat: add paper trade evidence detail resolver`

## Self-Review

- Spec coverage: The plan covers DB resolver, API route, UI panel, docs, validation, and commit.
- Placeholder scan: No placeholder markers are used.
- Type consistency: `getRecommendationEvidenceDetail`, `evidenceGate`, and `paper_trade` evidence naming are consistent across tasks.
