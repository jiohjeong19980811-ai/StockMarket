# Milestone 3 Provider Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build provider adapter contracts, mock providers, normalized ingestion records, and first-pass data quality checks for price, news, earnings, and options data without adding paid-provider keys or broker execution paths.

**Architecture:** `packages/data` owns provider-neutral contracts, mock providers, normalization, content hashes, data quality decisions, and in-memory ingestion batch generation. `packages/db` owns persistent normalized ingestion tables and migration tests. No provider-specific code leaks into scoring, UI, or recommendations.

**Tech Stack:** TypeScript, Vitest, Drizzle schema declarations, committed SQLite/libSQL SQL migrations, npm workspaces.

---

## File Structure

- Create `packages/db/migrations/0001_normalized_ingestion_tables.sql`
  - Adds normalized price, news, earnings, and options quote tables linked to `provider_records`.
- Modify `packages/db/src/schema.ts`
  - Mirrors the new migration tables through Drizzle declarations and constraints.
- Modify `packages/db/test/migration.test.ts`
  - Adds migration tests for normalized table constraints and provider lineage foreign keys.
- Create `packages/data/src/types.ts`
  - Provider metadata, request types, normalized records, quality events, and ingestion batch types.
- Create `packages/data/src/providers.ts`
  - Provider interfaces for market data, news, earnings, and options chains.
- Create `packages/data/src/mock-providers.ts`
  - Deterministic mock provider for tests and local demos.
- Create `packages/data/src/quality.ts`
  - Data quality checks for timestamps, freshness, missing fields, duplicate news, and options liquidity.
- Create `packages/data/src/ingestion.ts`
  - Provider-neutral ingestion functions that produce auditable batches with hashes and quality events.
- Modify `packages/data/src/index.ts`
  - Exports the package API.
- Create `packages/data/test/ingestion.test.ts`
  - Verifies provider contracts, batch generation, quality checks, and no broker execution surface.
- Modify `docs/status/current-work.md`, `docs/status/work-items.json`, and `docs/status/validation-status.md`
  - Records Milestone 3 progress and validation.

## Task 1: Normalized Ingestion Tables

**Files:**
- Create: `packages/db/migrations/0001_normalized_ingestion_tables.sql`
- Modify: `packages/db/src/schema.ts`
- Test: `packages/db/test/migration.test.ts`

- [ ] **Step 1: Write failing DB tests**

Add tests that prove:

```ts
it("creates normalized ingestion tables with provider lineage", async () => {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  expect(tables.rows.map((row) => row.name)).toEqual(
    expect.arrayContaining(["price_bars", "news_articles", "earnings_events", "option_quotes"]),
  );
});
```

Also test that:

```ts
await expect(insertPriceBarWithoutProviderRecord()).rejects.toThrow();
await expect(insertOptionQuoteWithInvertedMarket()).rejects.toThrow();
await expect(insertDuplicateNewsArticle()).rejects.toThrow();
```

- [ ] **Step 2: Run the focused DB test and verify RED**

Run: `npm.cmd run test --workspace @stockmarket/db -- migration`

Expected: failure because `price_bars`, `news_articles`, `earnings_events`, and `option_quotes` do not exist.

- [ ] **Step 3: Add migration and Drizzle schema**

Add migration tables with these minimum rules:

```sql
CREATE TABLE price_bars (
  id TEXT PRIMARY KEY,
  provider_record_id TEXT NOT NULL REFERENCES provider_records(id),
  instrument_id TEXT REFERENCES instruments(id),
  symbol TEXT NOT NULL,
  bar_interval TEXT NOT NULL CHECK (bar_interval IN ('1d', '1h', '15m', '5m', '1m')),
  timestamp TEXT NOT NULL,
  open REAL NOT NULL CHECK (open > 0),
  high REAL NOT NULL CHECK (high >= open),
  low REAL NOT NULL CHECK (low > 0 AND low <= high),
  close REAL NOT NULL CHECK (close > 0),
  adjusted_close REAL CHECK (adjusted_close IS NULL OR adjusted_close > 0),
  volume INTEGER NOT NULL CHECK (volume >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  UNIQUE (symbol, bar_interval, timestamp, provider_record_id)
);
```

The news, earnings, and option tables must require provider lineage, timestamps, and nonempty source fields. Option quotes must reject `ask < bid`, negative volume/open interest, and missing IV.

- [ ] **Step 4: Run DB tests and verify GREEN**

Run: `npm.cmd run test --workspace @stockmarket/db -- migration`

Expected: all DB migration tests pass.

## Task 2: Provider Contracts And Mock Providers

**Files:**
- Create: `packages/data/src/types.ts`
- Create: `packages/data/src/providers.ts`
- Create: `packages/data/src/mock-providers.ts`
- Modify: `packages/data/src/index.ts`
- Test: `packages/data/test/ingestion.test.ts`

- [ ] **Step 1: Write failing provider contract tests**

Add tests that prove the mock provider returns timestamped, provider-neutral records:

```ts
const provider = createMockMarketDataProvider();
const bars = await provider.getPriceBars({ symbol: "MSFT", from: "2026-05-01", to: "2026-05-02" });
expect(bars[0].metadata.providerName).toBe("mock-market-data");
expect(bars[0].metadata.retrievedAt).toMatch(/T/);
expect(bars[0].symbol).toBe("MSFT");
```

Add a test that the exported provider interfaces contain no execution methods:

```ts
expect(Object.keys(provider).some((key) => /order|trade|position/i.test(key))).toBe(false);
```

- [ ] **Step 2: Run the focused data test and verify RED**

Run: `npm.cmd run test --workspace @stockmarket/data -- ingestion`

Expected: failure because the test file, mock providers, and provider contracts do not exist.

- [ ] **Step 3: Implement contracts and mocks**

Define provider interfaces:

```ts
export interface MarketDataProvider {
  readonly providerName: string;
  readonly adapterVersion: string;
  getPriceBars(request: PriceBarsRequest): Promise<ProviderPriceBar[]>;
}
```

Repeat the same provider-neutral shape for news, earnings, and options. Do not define broker, order, trade, position, or account methods.

- [ ] **Step 4: Run data tests and verify GREEN**

Run: `npm.cmd run test --workspace @stockmarket/data -- ingestion`

Expected: provider contract and mock-provider tests pass.

## Task 3: Ingestion Batches And Data Quality

**Files:**
- Create: `packages/data/src/quality.ts`
- Create: `packages/data/src/ingestion.ts`
- Modify: `packages/data/src/index.ts`
- Test: `packages/data/test/ingestion.test.ts`

- [ ] **Step 1: Write failing ingestion and quality tests**

Add tests that prove:

```ts
const batch = await ingestPriceBars(provider, request, fixedClock);
expect(batch.run.providerDataset).toBe("prices");
expect(batch.providerRecords[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
expect(batch.qualityEvents).toEqual([]);
```

Add failure-path tests for missing timestamps, stale provider data, duplicate news URLs, and inverted options bid/ask.

- [ ] **Step 2: Run focused data tests and verify RED**

Run: `npm.cmd run test --workspace @stockmarket/data -- ingestion`

Expected: failure because ingestion functions and quality checks do not exist.

- [ ] **Step 3: Implement ingestion and quality checks**

Implement pure functions:

```ts
export async function ingestPriceBars(
  provider: MarketDataProvider,
  request: PriceBarsRequest,
  clock: IngestionClock,
): Promise<IngestionBatch<ProviderPriceBar>>;
```

Each ingestion function must return:

- One `IngestionRunRecord`.
- One `ProviderRecordEnvelope` per normalized record.
- Dataset-specific normalized records.
- `DataQualityEventRecord[]` with missing timestamp, stale, duplicate, or liquidity failures.

- [ ] **Step 4: Run focused data tests and verify GREEN**

Run: `npm.cmd run test --workspace @stockmarket/data -- ingestion`

Expected: all data ingestion tests pass.

## Task 4: Status, Validation, And Release Gate

**Files:**
- Modify: `docs/status/current-work.md`
- Modify: `docs/status/work-items.json`
- Modify: `docs/status/validation-status.md`

- [ ] **Step 1: Update status docs**

Set current focus to Milestone 3 provider interfaces and mock ingestion. Mark `M3-001` as completed only after root CI and safety scans pass.

- [ ] **Step 2: Run validation**

Run:

```powershell
npm.cmd run ci
python -m json.tool docs/status/work-items.json
python -m json.tool .codex/hooks.json
git diff --check
```

Run changed-file secret scan and app/package live-trading surface scan. Expected result: no secrets, and live-trading matches only guardrails/tests.

- [ ] **Step 3: Commit**

Commit with:

```powershell
git add .
git commit -m "feat: add provider ingestion contracts"
```

## Self-Review

- Spec coverage: The plan covers provider interfaces, mock providers, price/news/earnings/options ingestion, data freshness checks, DB migration support, tests, status docs, and no broker execution paths.
- Placeholder scan: No placeholder markers are used.
- Type consistency: Provider names, request types, batch types, and quality-event terms are consistent across tasks.

