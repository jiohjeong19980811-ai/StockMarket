# Milestone 4 Scoring And Risk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first deterministic scoring and risk-gate skeleton for mock/provider-normalized research inputs.

**Architecture:** `packages/scoring` owns score inputs, risk gates, score aggregation, and final research decisions. It imports core recommendation/risk/strategy types, but does not persist data, call providers, call brokers, or create executable orders.

**Tech Stack:** TypeScript, Vitest, existing npm workspaces, existing `@stockmarket/core` contracts.

---

### Task 1: Add Scoring Package Test Harness

**Files:**

- Modify: `packages/scoring/package.json`
- Create: `packages/scoring/test/scoring.test.ts`

- [ ] **Step 1: Add a package test script**

Update `packages/scoring/package.json` scripts to include:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write the first failing paper-trade scoring test**

Create `packages/scoring/test/scoring.test.ts` with a test that imports `scoreOpportunity` from `../src/index.js` and expects a strong stock candidate with paper-trade evidence, fresh data, citations, passing liquidity, and conservative exposure to return:

```ts
expect(result.decision).toBe("paper_trade");
expect(result.scores.confidence).toBeGreaterThanOrEqual(70);
expect(result.scores.liquidity).toBeGreaterThanOrEqual(70);
expect(result.gates.every((gate) => gate.passed)).toBe(true);
```

- [ ] **Step 3: Verify the test fails for the missing export**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/scoring -- scoring
```

Expected: FAIL because `scoreOpportunity` does not exist yet.

### Task 2: Implement Scoring Contracts And Passing Stock Path

**Files:**

- Modify: `packages/scoring/package.json`
- Modify: `packages/scoring/tsconfig.json`
- Replace: `packages/scoring/src/index.ts`
- Modify: `package-lock.json`

- [ ] **Step 1: Add `@stockmarket/core` as a scoring dependency**

Add:

```json
"dependencies": {
  "@stockmarket/core": "0.1.0"
}
```

- [ ] **Step 2: Add a TypeScript project reference**

Add `../core` to `packages/scoring/tsconfig.json` references.

- [ ] **Step 3: Implement minimal exports**

Implement these exported items in `packages/scoring/src/index.ts`:

- `ScoringInput`
- `ComponentSignal`
- `RiskGateResult`
- `ScoringResult`
- `scoreOpportunity(input: ScoringInput): ScoringResult`
- `evaluateRiskGates(input: ScoringInput): RiskGateResult[]`

The first implementation should support the passing stock paper-trade path and clamp scores to `0..100`.

- [ ] **Step 4: Verify the first test passes**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/scoring -- scoring
```

Expected: PASS for the first scoring test.

### Task 3: Add No-Trade And Watchlist Gates

**Files:**

- Modify: `packages/scoring/test/scoring.test.ts`
- Modify: `packages/scoring/src/index.ts`

- [ ] **Step 1: Write failing tests for blocked promotion**

Add tests that verify:

- `research_only` evidence returns `watchlist` at most.
- Missing citations return `needs_more_data`.
- Stale or missing data freshness returns `needs_more_data`.
- Sector, single-name, correlated-cluster, daily-loss, or position-risk exposure breaches return `avoid`.

- [ ] **Step 2: Verify the tests fail**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/scoring -- scoring
```

Expected: FAIL on at least one unimplemented gate.

- [ ] **Step 3: Implement the gate logic**

Add hard gates for citations, freshness, evidence, minimum liquidity score, and exposure limits from `docs/risk-and-compliance.md`.

- [ ] **Step 4: Verify the tests pass**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/scoring -- scoring
```

Expected: PASS for the expanded scoring tests.

### Task 4: Add Options Risk Blocking

**Files:**

- Modify: `packages/scoring/test/scoring.test.ts`
- Modify: `packages/scoring/src/index.ts`

- [ ] **Step 1: Write failing options tests**

Add tests that verify:

- Long calls, long puts, and debit spreads return `avoid` when options risk details are missing.
- Options return `avoid` when liquidity fails.
- Options cannot return `paper_trade` without `historicalOptionsEvidenceId`.

- [ ] **Step 2: Verify the tests fail**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/scoring -- scoring
```

Expected: FAIL on unimplemented options gates.

- [ ] **Step 3: Implement options gates**

Require max loss, bid, ask, mid, volume, open interest, IV, breakeven, expiration, strike logic, event/theta/spread risk text, liquidity pass, and historical options evidence before options can pass paper-trade gates.

- [ ] **Step 4: Verify the tests pass**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/scoring -- scoring
```

Expected: PASS for stock and options scoring tests.

### Task 5: Update Documentation And Status

**Files:**

- Modify: `docs/risk-and-compliance.md`
- Modify: `docs/backtesting-and-validation.md`
- Modify: `docs/status/current-work.md`
- Modify: `docs/status/work-items.json`
- Modify: `docs/status/validation-status.md`
- Modify: `docs/decision-log.md`

- [ ] **Step 1: Document scoring semantics**

Record that `scores.risk` means risk-control quality where higher is safer, and that scoring cannot bypass evidence gates.

- [ ] **Step 2: Update status files**

Add a Milestone 4 work item for the scoring/risk skeleton and mark it completed after validation.

- [ ] **Step 3: Validate docs and code**

Run:

```powershell
npm.cmd run ci
python -m json.tool docs/status/work-items.json | Out-Null
git diff --check
```

Expected: CI passes, JSON parses, and no whitespace errors are reported.

### Task 6: Commit Milestone 4 Slice

**Files:**

- All changed Milestone 4 files.

- [ ] **Step 1: Review changed files**

Run:

```powershell
git status --short
git diff --stat
```

- [ ] **Step 2: Commit**

Run:

```powershell
git add packages/scoring package-lock.json docs/risk-and-compliance.md docs/backtesting-and-validation.md docs/status/current-work.md docs/status/work-items.json docs/status/validation-status.md docs/decision-log.md docs/superpowers/specs/2026-05-28-milestone-4-scoring-risk-design.md docs/superpowers/plans/2026-05-28-milestone-4-scoring-risk.md
git commit -m "feat: add scoring risk gates"
```

Expected: A focused Milestone 4 commit on the feature branch.
