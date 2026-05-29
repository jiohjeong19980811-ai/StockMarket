# Milestone 7 Backtest Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist stock-only backtest evaluator results and resolve stored backtest evidence IDs for recommendation evidence detail.

**Architecture:** Add SQLite persistence in `packages/db` for backtest runs and run trades. Keep the `@stockmarket/backtesting` evaluator as the source of metrics and gates, and have the DB helper persist the evaluator input/result pair without recalculating strategy performance. Extend the existing recommendation evidence resolver to verify stored backtest evidence only when the run is stock-only, `notRecommendation`, cohort-compatible, and `ready_for_review`.

**Tech Stack:** TypeScript, Vitest, SQLite/libSQL, existing migration runner, `@stockmarket/backtesting`, `@stockmarket/core` types.

---

### Task 1: Migration And Schema

**Files:**
- Create: `packages/db/migrations/0004_backtest_runs.sql`
- Modify: `packages/db/src/schema.ts`
- Modify: `packages/db/test/migration.test.ts`

- [x] **Step 1: Write failing migration tests**

Add tests to `packages/db/test/migration.test.ts` that assert:

```ts
expect(result.rows.map((row) => row.name)).toEqual(
  expect.arrayContaining(["backtest_runs", "backtest_run_trades"]),
);
```

Also insert one valid stock backtest run with JSON arrays/objects and one trade, then assert:

```ts
await expect(insertBacktestRun({ not_recommendation: 0 })).rejects.toThrow();
await expect(insertBacktestRun({ instrument_type: "long_call" })).rejects.toThrow();
await expect(insertBacktestRun({ options_proxy: 1 })).rejects.toThrow();
await expect(insertBacktestRun({ reason_codes_json: "not-json" })).rejects.toThrow();
```

- [x] **Step 2: Run migration tests and confirm failure**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/db -- migration
```

Expected: failure because `0004_backtest_runs.sql` and schema exports do not exist.

- [x] **Step 3: Add the migration**

Create `packages/db/migrations/0004_backtest_runs.sql` with:

```sql
CREATE TABLE backtest_runs (
  id TEXT PRIMARY KEY,
  strategy_version_id TEXT NOT NULL REFERENCES strategy_versions(id),
  strategy_family TEXT NOT NULL,
  strategy_version_label TEXT NOT NULL,
  instrument_type TEXT NOT NULL CHECK (instrument_type = 'stock'),
  universe TEXT NOT NULL CHECK (length(universe) > 0),
  period_start TEXT NOT NULL CHECK (length(period_start) > 0),
  period_end TEXT NOT NULL CHECK (length(period_end) > 0),
  benchmark_return_pct REAL NOT NULL,
  promotion_gate TEXT NOT NULL CHECK (promotion_gate IN ('ready_for_review', 'needs_more_data', 'blocked')),
  reason_codes_json TEXT NOT NULL CHECK (json_valid(reason_codes_json) AND json_type(reason_codes_json) = 'array'),
  metrics_json TEXT NOT NULL CHECK (json_valid(metrics_json) AND json_type(metrics_json) = 'object'),
  assumptions_json TEXT NOT NULL CHECK (json_valid(assumptions_json) AND json_type(assumptions_json) = 'object'),
  source_citations_json TEXT NOT NULL CHECK (json_valid(source_citations_json) AND json_type(source_citations_json) = 'array' AND json_array_length(source_citations_json) > 0),
  freshness_status TEXT NOT NULL CHECK (freshness_status IN ('fresh', 'stale', 'partial', 'missing')),
  freshness_as_of TEXT NOT NULL CHECK (length(freshness_as_of) > 0),
  freshness_notes_json TEXT NOT NULL CHECK (json_valid(freshness_notes_json) AND json_type(freshness_notes_json) = 'array'),
  trade_count INTEGER NOT NULL CHECK (trade_count >= 0),
  win_rate_pct REAL NOT NULL CHECK (win_rate_pct >= 0 AND win_rate_pct <= 100),
  max_drawdown_pct REAL NOT NULL CHECK (max_drawdown_pct >= 0),
  net_return_pct REAL NOT NULL,
  benchmark_relative_return_pct REAL NOT NULL,
  options_proxy INTEGER NOT NULL DEFAULT 0 CHECK (options_proxy = 0),
  not_recommendation INTEGER NOT NULL DEFAULT 1 CHECK (not_recommendation = 1),
  created_at TEXT NOT NULL CHECK (length(created_at) > 0),
  updated_at TEXT NOT NULL CHECK (length(updated_at) > 0)
);

CREATE INDEX backtest_runs_strategy_version_idx ON backtest_runs(strategy_version_id);
CREATE INDEX backtest_runs_gate_idx ON backtest_runs(promotion_gate);

CREATE TABLE backtest_run_trades (
  id TEXT PRIMARY KEY,
  backtest_run_id TEXT NOT NULL REFERENCES backtest_runs(id) ON DELETE CASCADE,
  source_trade_id TEXT NOT NULL CHECK (length(source_trade_id) > 0),
  ticker TEXT NOT NULL CHECK (length(ticker) > 0),
  net_return_pct REAL NOT NULL,
  gross_return_pct REAL NOT NULL,
  holding_days REAL NOT NULL CHECK (holding_days >= 0),
  exit_order INTEGER NOT NULL CHECK (exit_order >= 0),
  created_at TEXT NOT NULL CHECK (length(created_at) > 0),
  UNIQUE(backtest_run_id, source_trade_id)
);

CREATE INDEX backtest_run_trades_run_idx ON backtest_run_trades(backtest_run_id, exit_order);
```

- [x] **Step 4: Add Drizzle schema exports**

Add `backtestRuns` and `backtestRunTrades` to `packages/db/src/schema.ts` with fields matching the migration. Use `check`, `index`, and `uniqueIndex` in the same style as `paperTrades`.

- [x] **Step 5: Verify migration tests pass**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/db -- migration
```

Expected: migration tests pass and the migration list includes `0004_backtest_runs.sql`.

### Task 2: Persistence Helper

**Files:**
- Create: `packages/db/src/backtest-run-ledger.ts`
- Create: `packages/db/test/backtest-run-ledger.test.ts`
- Modify: `packages/db/src/index.ts`
- Modify: `packages/db/package.json`
- Modify: `packages/db/tsconfig.json`
- Modify: `package-lock.json`

- [x] **Step 1: Add failing persistence tests**

Create `packages/db/test/backtest-run-ledger.test.ts`. Seed a strategy version, build a `StockBacktestInput`, call `evaluateStockBacktest(input)`, and assert:

```ts
const persisted = await persistStockBacktestRun(client, input, result, "2026-05-29T18:00:00.000Z");
expect(persisted.notRecommendation).toBe(true);
expect(persisted.promotionGate).toBe("ready_for_review");
expect(persisted.metrics.tradeCount).toBe(4);
expect(persisted.trades.map((trade) => trade.id)).toEqual(["trade-1", "trade-2", "trade-3", "trade-4"]);
```

Add rejection tests:

```ts
await expect(persistStockBacktestRun(client, { ...input, instrumentType: "long_call" }, result, now)).rejects.toThrow(/stock-only/i);
await expect(persistStockBacktestRun(client, { ...input, optionsProxy: true }, result, now)).rejects.toThrow(/options proxy/i);
await expect(persistStockBacktestRun(client, input, { ...result, notRecommendation: false as true }, now)).rejects.toThrow(/notRecommendation/i);
```

- [x] **Step 2: Run the helper test and confirm failure**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/db -- backtest-run-ledger
```

Expected: failure because `persistStockBacktestRun` does not exist.

- [x] **Step 3: Add DB package dependency and references**

Add `"@stockmarket/backtesting": "0.1.0"` to `packages/db/package.json`, add `{ "path": "../backtesting" }` to `packages/db/tsconfig.json`, and update `package-lock.json` using the repo package-lock workflow.

- [x] **Step 4: Implement the helper**

Create `packages/db/src/backtest-run-ledger.ts` with:

```ts
import type { Client } from "@libsql/client";
import type { StockBacktestInput, StockBacktestResult } from "@stockmarket/backtesting";

function json(value: unknown): string {
  return JSON.stringify(value);
}

export async function persistStockBacktestRun(
  client: Client,
  input: StockBacktestInput,
  result: StockBacktestResult,
  persistedAt: string,
): Promise<StockBacktestResult> {
  if (input.instrumentType !== "stock" || result.instrumentType !== "stock") {
    throw new Error("Only stock backtests can be persisted in MVP.");
  }
  if (input.optionsProxy === true || input.strategyFamily === "options") {
    throw new Error("Options proxy backtests cannot be persisted as stock evidence.");
  }
  if (result.notRecommendation !== true) {
    throw new Error("Backtest persistence requires notRecommendation evidence.");
  }

  const runArgs = [
    result.id,
    input.strategyVersionId,
    input.strategyFamily,
    result.strategyVersionId,
    result.instrumentType,
    input.universe,
    input.period.start,
    input.period.end,
    input.benchmarkReturnPct,
    result.promotionGate,
    json(result.reasonCodes),
    json(result.metrics),
    json(result.assumptions),
    json(result.sourceCitations),
    result.dataFreshness.status,
    result.dataFreshness.asOf,
    json(result.dataFreshness.notes),
    result.metrics.tradeCount,
    result.metrics.winRatePct,
    result.metrics.maxDrawdownPct,
    result.metrics.netReturnPct,
    result.metrics.benchmarkRelativeReturnPct,
    0,
    1,
    persistedAt,
    persistedAt,
  ];

  await client.batch(
    [
      {
        sql: `INSERT INTO backtest_runs (
          id, strategy_version_id, strategy_family, strategy_version_label,
          instrument_type, universe, period_start, period_end,
          benchmark_return_pct, promotion_gate, reason_codes_json,
          metrics_json, assumptions_json, source_citations_json,
          freshness_status, freshness_as_of, freshness_notes_json,
          trade_count, win_rate_pct, max_drawdown_pct, net_return_pct,
          benchmark_relative_return_pct, options_proxy, not_recommendation,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: runArgs,
      },
      ...result.trades.map((trade, index) => ({
        sql: `INSERT INTO backtest_run_trades (
          id, backtest_run_id, source_trade_id, ticker,
          net_return_pct, gross_return_pct, holding_days, exit_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `${result.id}_${trade.id}`,
          result.id,
          trade.id,
          trade.ticker,
          trade.netReturnPct,
          trade.grossReturnPct,
          trade.holdingDays,
          index,
          persistedAt,
        ],
      })),
    ],
    "write",
  );

  return result;
}
```

Store `result.metrics`, `result.assumptions`, `result.sourceCitations`, `result.reasonCodes`, and `result.dataFreshness.notes` as JSON strings. The implementation may add small helper functions for ID normalization if tests show the raw trade ID is not safe as part of a SQLite primary key.

- [x] **Step 5: Export and verify**

Export the helper from `packages/db/src/index.ts`, then run:

```powershell
npm.cmd run test --workspace @stockmarket/db -- backtest-run-ledger
```

Expected: persistence helper tests pass.

### Task 3: Evidence Resolver Backtest Support

**Files:**
- Modify: `packages/db/src/evidence-resolver.ts`
- Modify: `packages/db/test/evidence-resolver.test.ts`

- [x] **Step 1: Add failing resolver tests**

In `packages/db/test/evidence-resolver.test.ts`, persist a ready stock backtest run and create a recommendation whose `backtest_run_id` points at it. Assert:

```ts
expect(detail.evidenceGate).toBe("verified");
expect(detail.evidence[0]).toMatchObject({
  kind: "backtest_run",
  status: "verified",
  reasonCodes: [],
  ticker: "MSFT",
  instrumentType: "stock",
  strategyVersionId: "momentum-v0",
});
```

Add tests for:

```ts
// missing run
expect(detail.reasonCodes).toContain("backtest_evidence_missing");

// needs_more_data run
expect(detail.reasonCodes).toContain("backtest_evidence_needs_more_data");

// blocked run or cohort mismatch
expect(detail.reasonCodes).toContain("backtest_evidence_cohort_mismatch");
```

- [x] **Step 2: Run resolver tests and confirm failure**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/db -- evidence-resolver
```

Expected: failure because backtest IDs are still returned as `backtest_resolver_not_available`.

- [x] **Step 3: Extend reason codes and item fields**

Replace the backtest placeholder reason with:

```ts
| "backtest_evidence_missing"
| "backtest_evidence_not_ready"
| "backtest_evidence_needs_more_data"
| "backtest_evidence_cohort_mismatch"
| "backtest_evidence_unsafe"
```

Add optional backtest metrics fields to `RecommendationEvidenceItem`:

```ts
promotionGate?: string;
tradeCount?: number;
netReturnPct?: number;
maxDrawdownPct?: number;
benchmarkRelativeReturnPct?: number;
```

- [x] **Step 4: Implement backtest resolution**

Add `resolveBacktestEvidence(client, evidenceId, recommendation)` that loads `backtest_runs`, checks:

```ts
not_recommendation === 1
instrument_type === recommendation.instrumentType
strategy_version_id === recommendation.strategyVersionId
promotion_gate === "ready_for_review"
options_proxy === 0
```

Then return a verified item with metrics, or blocked/unresolved item with stable reason codes. Until per-ticker backtest membership is modeled, require at least one `backtest_run_trades.ticker` row matching the recommendation ticker.

- [x] **Step 5: Verify resolver tests pass**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/db -- evidence-resolver
```

Expected: resolver tests pass and backtest evidence no longer returns the resolver-not-available reason for persisted runs.

### Task 4: Docs, Status, And Validation

**Files:**
- Modify: `docs/backtesting-and-validation.md`
- Modify: `docs/architecture.md`
- Modify: `docs/risk-and-compliance.md`
- Modify: `docs/product-roadmap.md`
- Modify: `docs/status/current-work.md`
- Modify: `docs/status/work-items.json`
- Modify: `docs/status/validation-status.md`

- [ ] **Step 1: Update docs**

Document that M7-002 adds durable stock backtest-run persistence and recommendation evidence resolver support, while API/UI, options backtests, and strategy promotion automation remain deferred.

- [ ] **Step 2: Run validation**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/db -- migration
npm.cmd run test --workspace @stockmarket/db -- backtest-run-ledger
npm.cmd run test --workspace @stockmarket/db -- evidence-resolver
npm.cmd run ci
python -m json.tool docs/status/work-items.json > $null
git diff --check
rg -n --hidden -S "sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[0-9A-Za-z-]{10,}" --glob "!node_modules/**" --glob "!**/dist/**" .
```

Expected: focused DB tests, root CI, JSON parse, whitespace check, and secret scan pass.

- [ ] **Step 3: Request focused review**

Request quant, risk, QA, and architecture review for:

- DB migration constraints.
- Persistence helper semantics.
- Evidence resolver gate correctness.
- No live-trading, broker, options-proxy, or recommendation-promotion surface.

## Self-Review

- Spec coverage: The plan covers migration, schema, persistence helper, evidence resolver, docs, status, validation, and review.
- Placeholder scan: No placeholder markers are used; object spread in tests is intentional TypeScript syntax.
- Type consistency: Plan names use `persistStockBacktestRun`, `backtest_runs`, `backtest_run_trades`, and existing `StockBacktestInput` / `StockBacktestResult` types consistently.
