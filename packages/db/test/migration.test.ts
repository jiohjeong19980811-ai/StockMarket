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
    expect(result.rows.map((row) => row.name)).toEqual(["0000_initial_research_schema.sql"]);
    expect(result.rows[0]?.checksum).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
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
});
