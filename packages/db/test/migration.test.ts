import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createLocalClient, runMigrations } from "../src/index.js";
import type { Client } from "@libsql/client";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const now = "2026-05-01T12:00:00Z";

let client: Client;

async function execute(sql: string, args: unknown[] = []) {
  return client.execute({ sql, args });
}

async function seedRecommendationDependencies() {
  await execute(
    `INSERT INTO strategy_definitions
      (id, family, name, description, allowed_instrument_types_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    ["strategy_earnings", "earnings", "PEAD", "Post-earnings drift research.", '["stock"]', now],
  );
  await execute(
    `INSERT INTO strategy_versions
      (id, strategy_definition_id, version, validation_status, promotion_state, required_data_json, risk_policy_version, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "strategy_earnings_v0",
      "strategy_earnings",
      "v0",
      "paper_trade_eligible",
      "paper_trade_eligible",
      '["prices","earnings"]',
      "risk-v0",
      now,
    ],
  );
  await execute(
    `INSERT INTO audit_logs
      (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id, risk_decision, operator_decision)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "audit_recommendation_1",
      "operator_decision",
      "operator",
      "operator:test",
      now,
      "recommendation",
      "rec_1",
      "pass",
      "paper_trade",
    ],
  );
}

async function seedProviderRecord(dataset = "prices", suffix = "1") {
  const ingestionRunId = `ingest_${dataset}_${suffix}`;
  const providerRecordId = `provider_record_${dataset}_${suffix}`;
  await execute(
    `INSERT INTO ingestion_runs
      (id, provider_name, provider_dataset, adapter_version, status, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ingestionRunId, "mock-provider", dataset, "adapter-v0", "completed", now, now],
  );
  await execute(
    `INSERT INTO provider_records
      (id, ingestion_run_id, provider_name, provider_dataset, provider_record_id, content_hash,
       provider_timestamp, source_published_at, retrieved_at, ingested_at, normalized_at,
       adapter_version, normalization_version, quality_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      providerRecordId,
      ingestionRunId,
      "mock-provider",
      dataset,
      `${dataset}-record-${suffix}`,
      `hash_${dataset}_${suffix}`,
      now,
      now,
      now,
      now,
      now,
      "adapter-v0",
      "normalize-v0",
      "fresh",
    ],
  );

  return providerRecordId;
}

async function insertRecommendation(overrides: Record<string, unknown> = {}) {
  const row = {
    id: "rec_1",
    ticker: "MSFT",
    instrument_type: "stock",
    strategy_version_id: "strategy_earnings_v0",
    decision: "watchlist",
    evidence_status: "watchlist_eligible",
    thesis: "Positive earnings surprise research candidate.",
    bull_case: "Liquidity and surprise support follow-through research.",
    bear_case: "Move may be exhausted.",
    downside_scenario: "Shares reverse below the event gap.",
    invalidation_conditions_json: '["Close below event low"]',
    why_system_might_be_wrong: "Guidance may matter more than surprise.",
    primary_citation_title: "Example earnings release",
    primary_citation_url: "https://example.com/earnings",
    primary_citation_source: "example",
    primary_citation_published_at: now,
    primary_citation_retrieved_at: now,
    freshness_status: "fresh",
    freshness_as_of: now,
    freshness_notes_json: "[]",
    risk_score: 45,
    confidence_score: 62,
    liquidity_score: 88,
    liquidity_decision: "pass",
    risk_decision: "pass",
    backtest_run_id: null,
    paper_trade_evidence_id: null,
    option_max_loss: null,
    option_expiration: null,
    option_strike_logic: null,
    option_bid: null,
    option_ask: null,
    option_mid: null,
    option_volume: null,
    option_open_interest: null,
    option_implied_volatility: null,
    option_breakeven: null,
    option_liquidity_pass: null,
    option_spread_risk: null,
    option_event_risk: null,
    option_theta_risk: null,
    option_historical_options_evidence_id: null,
    operator_audit_log_id: "audit_recommendation_1",
    created_at: now,
    updated_at: now,
    ...overrides,
  };

  const columns = Object.keys(row);
  const placeholders = columns.map(() => "?").join(", ");
  await execute(
    `INSERT INTO recommendations (${columns.join(", ")}) VALUES (${placeholders})`,
    Object.values(row),
  );
}

async function seedPaperTradeDependencies() {
  await seedRecommendationDependencies();
  await insertRecommendation({
    decision: "paper_trade",
    evidence_status: "paper_trade_eligible",
    backtest_run_id: "bt_123",
  });
  await execute(
    `INSERT INTO audit_logs
      (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id, risk_decision, operator_decision)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "audit_paper_trade_approval_1",
      "operator_decision",
      "operator",
      "operator:test",
      now,
      "paper_trade",
      "paper_trade_1",
      "pass",
      "paper_trade",
    ],
  );
  await execute(
    `INSERT INTO audit_logs
      (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id, risk_decision, operator_decision)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "audit_paper_trade_entry_1",
      "paper_trade_opened",
      "system",
      "paper-trading",
      now,
      "paper_trade",
      "paper_trade_1",
      "pass",
      "paper_trade",
    ],
  );
}

async function insertPaperTrade(overrides: Record<string, unknown> = {}) {
  const row = {
    id: "paper_trade_1",
    recommendation_id: "rec_1",
    account_id: "paper_account_default",
    mode: "paper",
    status: "open",
    ticker: "MSFT",
    instrument_type: "stock",
    strategy_version_id: "strategy_earnings_v0",
    operator_approval_audit_log_id: "audit_paper_trade_approval_1",
    entry_audit_log_id: "audit_paper_trade_entry_1",
    thesis_snapshot: "Positive earnings surprise research candidate.",
    entry_reason: "Operator approved a simulated long-stock paper trade after risk gates passed.",
    downside_scenario: "Shares reverse below the event gap.",
    invalidation_conditions_json: '["Close below event low"]',
    entry_type: "market",
    requested_entry_price: 410,
    simulated_entry_price: 410,
    quantity: 2,
    entered_at: now,
    stop_loss: 395,
    profit_target: 435,
    time_stop_at: "2026-05-15T20:00:00Z",
    max_loss_amount: 300,
    risk_pct_of_equity: 0.3,
    account_equity_at_entry: 100000,
    single_name_exposure_pct: 0.82,
    sector_exposure_pct: 8,
    correlated_exposure_pct: 10,
    daily_loss_pct_at_entry: 0.4,
    live_trading_enabled: 0,
    broker_execution: 0,
    closed_at: null,
    exit_price: null,
    exit_reason: null,
    lessons_learned: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };

  const columns = Object.keys(row);
  const placeholders = columns.map(() => "?").join(", ");
  await execute(
    `INSERT INTO paper_trades (${columns.join(", ")}) VALUES (${placeholders})`,
    Object.values(row),
  );
}

describe("database migrations", () => {
  beforeEach(async () => {
    client = await createLocalClient();
    await runMigrations(client);
  });

  afterEach(() => {
    client.close();
  });

  it("applies all migrations to a clean local database", async () => {
    const result = await client.execute(
      "SELECT name, checksum FROM schema_migrations ORDER BY name",
    );
    expect(result.rows.map((row) => row.name)).toEqual([
      "0000_initial_research_schema.sql",
      "0001_normalized_ingestion_tables.sql",
      "0002_paper_trades.sql",
    ]);
    for (const row of result.rows) {
      expect(row.checksum).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
    }
  });

  it("rejects modified migration files after they have been applied", async () => {
    const migrationDirectory = await mkdtemp(join(tmpdir(), "stockmarket-migrations-"));
    const migrationPath = join(migrationDirectory, "0000_test.sql");
    const migrationClient = await createLocalClient();

    try {
      await writeFile(
        migrationPath,
        "CREATE TABLE checksum_test (id TEXT PRIMARY KEY, value TEXT NOT NULL);",
      );
      await runMigrations(migrationClient, migrationDirectory);

      await writeFile(
        migrationPath,
        "CREATE TABLE checksum_test (id TEXT PRIMARY KEY, value TEXT NOT NULL, extra TEXT);",
      );

      await expect(runMigrations(migrationClient, migrationDirectory)).rejects.toThrow(
        /checksum mismatch/i,
      );
    } finally {
      migrationClient.close();
      await rm(migrationDirectory, { recursive: true, force: true });
    }
  });

  it("rolls back a migration when one statement fails", async () => {
    const migrationDirectory = await mkdtemp(join(tmpdir(), "stockmarket-migrations-"));
    const migrationPath = join(migrationDirectory, "0000_test.sql");
    const migrationClient = await createLocalClient();

    try {
      await writeFile(
        migrationPath,
        [
          "CREATE TABLE rollback_test (id TEXT PRIMARY KEY);",
          "CREATE TABLE rollback_test (id TEXT PRIMARY KEY);",
        ].join("\n"),
      );

      await expect(runMigrations(migrationClient, migrationDirectory)).rejects.toThrow();
      const result = await migrationClient.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'rollback_test'",
      );
      expect(result.rows).toHaveLength(0);
    } finally {
      migrationClient.close();
      await rm(migrationDirectory, { recursive: true, force: true });
    }
  });

  it("stores instruments with symbol and exchange uniqueness", async () => {
    await execute(
      `INSERT INTO instruments
        (id, symbol, name, instrument_type, exchange, currency, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["instrument_msft", "MSFT", "Microsoft Corporation", "stock", "NASDAQ", "USD", now, now],
    );

    await expect(
      execute(
        `INSERT INTO instruments
          (id, symbol, name, instrument_type, exchange, currency, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "instrument_msft_duplicate",
          "MSFT",
          "Microsoft Corporation",
          "stock",
          "NASDAQ",
          "USD",
          now,
          now,
        ],
      ),
    ).rejects.toThrow();
  });

  it("rejects duplicate provider records for idempotent ingestion", async () => {
    await execute(
      `INSERT INTO ingestion_runs
        (id, provider_name, provider_dataset, adapter_version, status, started_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["ingest_1", "polygon", "prices", "adapter-v0", "completed", now, now],
    );
    await execute(
      `INSERT INTO provider_records
        (id, ingestion_run_id, provider_name, provider_dataset, provider_record_id, content_hash,
         retrieved_at, ingested_at, normalized_at, adapter_version, normalization_version, quality_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "provider_record_1",
        "ingest_1",
        "polygon",
        "prices",
        "MSFT-2026-05-01",
        "hash_1",
        now,
        now,
        now,
        "adapter-v0",
        "normalize-v0",
        "fresh",
      ],
    );

    await expect(
      execute(
        `INSERT INTO provider_records
          (id, ingestion_run_id, provider_name, provider_dataset, provider_record_id, content_hash,
           retrieved_at, ingested_at, normalized_at, adapter_version, normalization_version, quality_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "provider_record_2",
          "ingest_1",
          "polygon",
          "prices",
          "MSFT-2026-05-01",
          "hash_2",
          now,
          now,
          now,
          "adapter-v0",
          "normalize-v0",
          "fresh",
        ],
      ),
    ).rejects.toThrow();
  });

  it("does not expose generic metadata columns for raw payload storage", async () => {
    const ingestionColumns = await client.execute("PRAGMA table_info(ingestion_runs)");
    const auditColumns = await client.execute("PRAGMA table_info(audit_logs)");

    expect(ingestionColumns.rows.map((row) => row.name)).not.toContain("metadata_json");
    expect(auditColumns.rows.map((row) => row.name)).not.toContain("metadata_json");
  });

  it("creates normalized ingestion tables with provider lineage", async () => {
    const result = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );

    expect(result.rows.map((row) => row.name)).toEqual(
      expect.arrayContaining(["price_bars", "news_articles", "earnings_events", "option_quotes"]),
    );
  });

  it("accepts normalized ingestion rows linked to provider records", async () => {
    const priceProviderRecordId = await seedProviderRecord("prices");
    const newsProviderRecordId = await seedProviderRecord("news");
    const earningsProviderRecordId = await seedProviderRecord("earnings");
    const optionsProviderRecordId = await seedProviderRecord("options");

    await execute(
      `INSERT INTO price_bars
        (id, provider_record_id, provider_name, symbol, bar_interval, timestamp, open, high, low, close,
         adjusted_close, volume, currency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "price_bar_1",
        priceProviderRecordId,
        "mock-provider",
        "MSFT",
        "1d",
        now,
        100,
        105,
        99,
        104,
        104,
        1200000,
        "USD",
      ],
    );
    await execute(
      `INSERT INTO news_articles
        (id, provider_record_id, provider_name, symbol, title, url, source, published_at, retrieved_at,
         duplicate_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "news_1",
        newsProviderRecordId,
        "mock-provider",
        "MSFT",
        "Microsoft announces example update",
        "https://example.com/msft-news",
        "example",
        now,
        now,
        "example-msft-news",
      ],
    );
    await execute(
      `INSERT INTO earnings_events
        (id, provider_record_id, provider_name, symbol, fiscal_period, announcement_date, announcement_timing,
         eps_estimate, eps_actual, eps_surprise, source_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "earnings_1",
        earningsProviderRecordId,
        "mock-provider",
        "MSFT",
        "2026-Q3",
        "2026-05-01",
        "after_market",
        2.1,
        2.3,
        0.2,
        "https://example.com/msft-earnings",
      ],
    );
    await execute(
      `INSERT INTO option_quotes
        (id, provider_record_id, provider_name, underlying_symbol, contract_symbol, expiration, strike,
         option_type, quote_timestamp, bid, ask, mid, volume, open_interest,
         implied_volatility, underlying_price, liquidity_flags_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "option_quote_1",
        optionsProviderRecordId,
        "mock-provider",
        "MSFT",
        "MSFT260619C00100000",
        "2026-06-19",
        100,
        "call",
        now,
        2.4,
        2.6,
        2.5,
        150,
        1200,
        0.42,
        101.1,
        "[]",
      ],
    );

    const result = await client.execute("SELECT COUNT(*) AS count FROM option_quotes");
    expect(result.rows[0]?.count).toBe(1);
  });

  it("rejects normalized ingestion rows without provider lineage", async () => {
    await expect(
      execute(
        `INSERT INTO price_bars
          (id, provider_record_id, provider_name, symbol, bar_interval, timestamp, open, high, low, close, volume)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "price_bar_no_lineage",
          "missing_provider_record",
          "mock-provider",
          "MSFT",
          "1d",
          now,
          100,
          105,
          99,
          104,
          100,
        ],
      ),
    ).rejects.toThrow();
  });

  it("rejects normalized ingestion rows with the wrong provider dataset lineage", async () => {
    const newsProviderRecordId = await seedProviderRecord("news", "wrong_dataset");

    await expect(
      execute(
        `INSERT INTO price_bars
          (id, provider_record_id, provider_name, symbol, bar_interval, timestamp, open, high, low, close, volume)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "price_bar_wrong_dataset",
          newsProviderRecordId,
          "mock-provider",
          "MSFT",
          "1d",
          now,
          100,
          105,
          99,
          104,
          100,
        ],
      ),
    ).rejects.toThrow();
  });

  it("deduplicates normalized price bars by provider and market-data natural key", async () => {
    const firstProviderRecordId = await seedProviderRecord("prices", "natural_1");
    const secondProviderRecordId = await seedProviderRecord("prices", "natural_2");

    await execute(
      `INSERT INTO price_bars
        (id, provider_record_id, provider_name, symbol, bar_interval, timestamp, open, high, low, close, volume)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "price_bar_natural_1",
        firstProviderRecordId,
        "mock-provider",
        "MSFT",
        "1d",
        now,
        100,
        105,
        99,
        104,
        100,
      ],
    );

    await expect(
      execute(
        `INSERT INTO price_bars
          (id, provider_record_id, provider_name, symbol, bar_interval, timestamp, open, high, low, close, volume)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "price_bar_natural_2",
          secondProviderRecordId,
          "mock-provider",
          "MSFT",
          "1d",
          now,
          101,
          106,
          100,
          105,
          200,
        ],
      ),
    ).rejects.toThrow();
  });

  it("rejects normalized ingestion rows with unsafe market data", async () => {
    const priceProviderRecordId = await seedProviderRecord("prices");
    const newsProviderRecordId = await seedProviderRecord("news");
    const optionsProviderRecordId = await seedProviderRecord("options");

    await execute(
      `INSERT INTO news_articles
        (id, provider_record_id, provider_name, symbol, title, url, source, published_at, retrieved_at,
         duplicate_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "news_duplicate_1",
        newsProviderRecordId,
        "mock-provider",
        "MSFT",
        "Microsoft announces example update",
        "https://example.com/msft-news",
        "example",
        now,
        now,
        "example-msft-news",
      ],
    );

    await expect(
      execute(
        `INSERT INTO price_bars
          (id, provider_record_id, provider_name, symbol, bar_interval, timestamp, open, high, low, close, volume)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "price_bar_invalid",
          priceProviderRecordId,
          "mock-provider",
          "MSFT",
          "1d",
          now,
          100,
          98,
          99,
          104,
          100,
        ],
      ),
    ).rejects.toThrow();
    await expect(
      execute(
        `INSERT INTO news_articles
          (id, provider_record_id, provider_name, symbol, title, url, source, published_at, retrieved_at,
           duplicate_key)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "news_duplicate_2",
          newsProviderRecordId,
          "mock-provider",
          "MSFT",
          "Duplicate Microsoft update",
          "https://example.com/msft-news-copy",
          "example",
          now,
          now,
          "example-msft-news",
        ],
      ),
    ).rejects.toThrow();
    await expect(
      execute(
        `INSERT INTO option_quotes
          (id, provider_record_id, provider_name, underlying_symbol, contract_symbol, expiration, strike,
           option_type, quote_timestamp, bid, ask, mid, volume, open_interest,
           implied_volatility, underlying_price, liquidity_flags_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "option_quote_invalid",
          optionsProviderRecordId,
          "mock-provider",
          "MSFT",
          "MSFT260619C00100000",
          "2026-06-19",
          100,
          "call",
          now,
          2.7,
          2.4,
          2.55,
          150,
          1200,
          0.42,
          101.1,
          "[]",
        ],
      ),
    ).rejects.toThrow();
  });

  it("rejects recommendations with out-of-range scores", async () => {
    await seedRecommendationDependencies();

    await expect(insertRecommendation({ confidence_score: 101 })).rejects.toThrow();
  });

  it("rejects recommendations without a primary citation timestamp", async () => {
    await seedRecommendationDependencies();

    await expect(insertRecommendation({ primary_citation_retrieved_at: "" })).rejects.toThrow();
  });

  it("rejects paper-trade recommendations without evidence", async () => {
    await seedRecommendationDependencies();

    await expect(
      insertRecommendation({
        decision: "paper_trade",
        evidence_status: "paper_trade_eligible",
      }),
    ).rejects.toThrow();
  });

  it("rejects paper-trade recommendations with empty evidence IDs", async () => {
    await seedRecommendationDependencies();

    await expect(
      insertRecommendation({
        decision: "paper_trade",
        evidence_status: "paper_trade_eligible",
        backtest_run_id: "",
        paper_trade_evidence_id: "",
      }),
    ).rejects.toThrow();
  });

  it("rejects paper-trade recommendations below the liquidity score threshold", async () => {
    await seedRecommendationDependencies();

    await expect(
      insertRecommendation({
        decision: "paper_trade",
        evidence_status: "paper_trade_eligible",
        backtest_run_id: "bt_123",
        liquidity_score: 69,
        liquidity_decision: "pass",
      }),
    ).rejects.toThrow();
  });

  it("rejects recommendations without valid non-empty invalidation conditions", async () => {
    await seedRecommendationDependencies();

    for (const invalidationConditionsJson of ["[]", "", "not-json"]) {
      await expect(
        insertRecommendation({
          id: `rec_invalidations_${invalidationConditionsJson.length}`,
          decision: "paper_trade",
          evidence_status: "paper_trade_eligible",
          backtest_run_id: "bt_123",
          invalidation_conditions_json: invalidationConditionsJson,
        }),
      ).rejects.toThrow();
    }
  });

  it("rejects options paper trades without option risk details", async () => {
    await seedRecommendationDependencies();

    await expect(
      insertRecommendation({
        instrument_type: "long_call",
        decision: "paper_trade",
        evidence_status: "paper_trade_eligible",
        backtest_run_id: "bt_123",
      }),
    ).rejects.toThrow();
  });

  it("rejects options paper trades with partial null option details", async () => {
    await seedRecommendationDependencies();

    await expect(
      insertRecommendation({
        instrument_type: "long_call",
        decision: "paper_trade",
        evidence_status: "paper_trade_eligible",
        backtest_run_id: "bt_123",
        option_max_loss: 250,
        option_expiration: "2026-06-19",
        option_strike_logic: "Delta-targeted long call research candidate.",
        option_bid: null,
        option_ask: 2.55,
        option_mid: 2.475,
        option_volume: 150,
        option_open_interest: 1200,
        option_implied_volatility: 0.42,
        option_breakeven: 102.5,
        option_liquidity_pass: 1,
        option_spread_risk: "Bid/ask spread inside target threshold.",
        option_event_risk: "No earnings event before expiration.",
        option_theta_risk: "Theta decay reviewed before entry.",
        option_historical_options_evidence_id: "options_bt_123",
      }),
    ).rejects.toThrow();
  });

  it("accepts avoid options recommendations with failed liquidity documented", async () => {
    await seedRecommendationDependencies();

    await insertRecommendation({
      id: "rec_option_avoid_1",
      instrument_type: "long_call",
      decision: "avoid",
      evidence_status: "avoid",
      liquidity_decision: "fail",
      option_max_loss: 250,
      option_expiration: "2026-06-19",
      option_strike_logic: "Delta-targeted long call research candidate.",
      option_bid: 2.4,
      option_ask: 2.55,
      option_mid: 2.475,
      option_volume: 10,
      option_open_interest: 75,
      option_implied_volatility: 0.42,
      option_breakeven: 102.5,
      option_liquidity_pass: 0,
      option_spread_risk: "Open interest and volume are below the options liquidity threshold.",
      option_event_risk: "No earnings event before expiration.",
      option_theta_risk: "Theta decay reviewed before entry.",
    });

    const result = await client.execute("SELECT COUNT(*) AS count FROM recommendations");
    expect(result.rows[0]?.count).toBe(1);
  });

  it("accepts a watchlist recommendation with audit linkage and citation", async () => {
    await seedRecommendationDependencies();
    await insertRecommendation();
    await execute(
      `INSERT INTO recommendation_citations
        (id, recommendation_id, title, url, source, published_at, retrieved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "citation_1",
        "rec_1",
        "Example earnings release",
        "https://example.com/earnings",
        "example",
        now,
        now,
      ],
    );

    const result = await client.execute("SELECT COUNT(*) AS count FROM recommendations");
    expect(result.rows[0]?.count).toBe(1);
  });

  it("accepts a stock paper trade with operator approval, entry rules, and risk snapshots", async () => {
    await seedPaperTradeDependencies();

    await insertPaperTrade();

    const result = await client.execute(
      "SELECT mode, status, live_trading_enabled, broker_execution FROM paper_trades",
    );
    expect(result.rows[0]).toMatchObject({
      mode: "paper",
      status: "open",
      live_trading_enabled: 0,
      broker_execution: 0,
    });
  });

  it("rejects paper trades for recommendations that are not paper-trade eligible", async () => {
    await seedRecommendationDependencies();
    await insertRecommendation();
    await execute(
      `INSERT INTO audit_logs
        (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id, risk_decision, operator_decision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "audit_paper_trade_approval_1",
        "operator_decision",
        "operator",
        "operator:test",
        now,
        "paper_trade",
        "paper_trade_1",
        "pass",
        "paper_trade",
      ],
    );
    await execute(
      `INSERT INTO audit_logs
        (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id, risk_decision, operator_decision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "audit_paper_trade_entry_1",
        "paper_trade_opened",
        "system",
        "paper-trading",
        now,
        "paper_trade",
        "paper_trade_1",
        "pass",
        "paper_trade",
      ],
    );

    await expect(insertPaperTrade()).rejects.toThrow();
  });

  it("rejects paper trades that try to persist live trading or broker execution flags", async () => {
    await seedPaperTradeDependencies();

    await expect(insertPaperTrade({ live_trading_enabled: 1 })).rejects.toThrow();
    await expect(insertPaperTrade({ id: "paper_trade_2", broker_execution: 1 })).rejects.toThrow();
  });

  it("rejects paper trades with inconsistent risk percent snapshots", async () => {
    await seedPaperTradeDependencies();

    await expect(insertPaperTrade({ risk_pct_of_equity: 0.1 })).rejects.toThrow();
  });

  it("rejects options paper trades until the options strategy policy is promoted", async () => {
    await seedPaperTradeDependencies();

    await expect(insertPaperTrade({ instrument_type: "long_call" })).rejects.toThrow();
  });

  it("rejects stock paper trades without explicit stop, target, and time-stop rules", async () => {
    await seedPaperTradeDependencies();

    await expect(insertPaperTrade({ stop_loss: null })).rejects.toThrow();
    await expect(insertPaperTrade({ id: "paper_trade_2", profit_target: null })).rejects.toThrow();
    await expect(insertPaperTrade({ id: "paper_trade_3", time_stop_at: "" })).rejects.toThrow();
  });
});
