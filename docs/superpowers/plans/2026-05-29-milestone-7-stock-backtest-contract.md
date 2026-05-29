# Milestone 7 Stock Backtest Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first deterministic stock-only backtest evaluator and validation evidence contract.

**Architecture:** Implement a pure TypeScript package function in `packages/backtesting` that consumes closed stock trade observations plus explicit assumptions, then returns auditable metrics and conservative promotion gates. This slice stays package-only; DB persistence, API/UI, options, and strategy promotion automation remain future work.

**Tech Stack:** TypeScript, Vitest, npm workspaces, existing `@stockmarket/core` types.

---

### Task 1: Package Test Harness

**Files:**
- Modify: `packages/backtesting/package.json`
- Create: `packages/backtesting/vitest.config.ts`
- Create: `packages/backtesting/test/backtesting.test.ts`

- [ ] **Step 1: Add the package test script and Vitest config**

Add `"test": "vitest run"` to `packages/backtesting/package.json` and create `packages/backtesting/vitest.config.ts` with node environment and `test/**/*.test.ts` include.

- [ ] **Step 2: Write failing happy-path metrics test**

Create `packages/backtesting/test/backtesting.test.ts` and import `evaluateStockBacktest`. The first test should build a momentum stock run with four closed long trades, source citations, fresh data, point-in-time controls, slippage/spread/fee assumptions, and `minTradesForReview: 4`. Assert:

- `notRecommendation: true`
- `promotionGate: "ready_for_review"`
- `metrics.tradeCount: 4`
- `metrics.winRatePct: 75`
- `metrics.bestTradeReturnPct` is positive
- `metrics.worstTradeReturnPct` is negative
- `metrics.costSensitivity` includes baseline, 2x, and 3x cost scenarios

- [ ] **Step 3: Verify the test fails**

Run: `npm.cmd run test --workspace @stockmarket/backtesting`

Expected: fail because `evaluateStockBacktest` does not exist.

### Task 2: Stock Backtest Evaluator

**Files:**
- Modify: `packages/backtesting/src/index.ts`
- Test: `packages/backtesting/test/backtesting.test.ts`

- [ ] **Step 1: Implement types and evaluator**

Replace the placeholder export with:

- `BacktestPromotionGate`
- `BacktestReasonCode`
- `StockBacktestTrade`
- `BacktestAssumptions`
- `StockBacktestInput`
- `StockBacktestResult`
- `evaluateStockBacktest(input)`

The evaluator should:

- Reject non-stock instruments and options proxy runs as `blocked`.
- Require at least one citation and non-missing data freshness.
- Require point-in-time, survivorship-bias, and lookahead-bias controls.
- Compute net trade return after slippage, spread, and fees.
- Compute trade count, win rate, average/median return, max drawdown, profit factor, best/worst trade, average holding days, benchmark-relative return, and cost sensitivity at 1x, 2x, and 3x costs.
- Return `ready_for_review` only when all hard gates pass and trade count meets the configured minimum.

- [ ] **Step 2: Verify the happy path passes**

Run: `npm.cmd run test --workspace @stockmarket/backtesting`

Expected: the happy-path metrics test passes.

### Task 3: Negative Evidence Gates

**Files:**
- Modify: `packages/backtesting/test/backtesting.test.ts`
- Modify: `packages/backtesting/src/index.ts`

- [ ] **Step 1: Add failing negative tests**

Add tests for:

- Fewer trades than `minTradesForReview` returns `needs_more_data` with `insufficient_trade_count`.
- Missing point-in-time/lookahead/survivorship controls returns `blocked`.
- Missing citations or missing freshness returns `needs_more_data`.
- `instrumentType: "long_call"` or `optionsProxy: true` returns `blocked` with `options_backtest_not_supported`.
- Empty trades return `needs_more_data`.

- [ ] **Step 2: Implement missing gates**

Extend `evaluateStockBacktest` to produce stable reason codes for each negative test without throwing for expected validation failures.

- [ ] **Step 3: Verify negative tests pass**

Run: `npm.cmd run test --workspace @stockmarket/backtesting`

Expected: all backtesting package tests pass.

### Task 4: Docs, Status, And Validation

**Files:**
- Modify: `docs/backtesting-and-validation.md`
- Modify: `docs/architecture.md`
- Modify: `docs/product-roadmap.md`
- Modify: `docs/risk-and-compliance.md`
- Modify: `docs/decision-log.md`
- Modify: `docs/status/current-work.md`
- Modify: `docs/status/work-items.json`
- Modify: `docs/status/validation-status.md`

- [ ] **Step 1: Update docs**

Document that M7 starts with a pure package-level stock-only evaluator. Note that DB persistence, API/UI, and options backtesting are still deferred.

- [ ] **Step 2: Run focused and aggregate validation**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/backtesting
npm.cmd run ci
python -m json.tool docs/status/work-items.json > $null
git diff --check
rg -n --hidden -S "sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[0-9A-Za-z-]{10,}" --glob "!node_modules/**" --glob "!**/dist/**" .
```

Expected: focused tests, CI, JSON parse, whitespace check, and secret scan pass.

- [ ] **Step 3: Commit**

Commit message: `feat: add stock backtest evidence contract`

## Self-Review

- Spec coverage: The plan covers package setup, happy-path metrics, conservative negative gates, docs, status, and validation.
- Placeholder scan: No placeholder markers are used.
- Type consistency: The evaluator and result names are consistent across tasks.
