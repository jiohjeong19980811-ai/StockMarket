import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createMockMarketDataProvider,
  createMockNewsProvider,
  createMockOptionsProvider,
  ingestNewsArticles,
  ingestOptionQuotes,
  ingestPriceBars,
  type IngestionClock,
} from "@stockmarket/data";
import { createLocalClient, persistIngestionBatch, runMigrations } from "../src/index.js";
import type { Client } from "@libsql/client";

const fixedClock: IngestionClock = {
  now: () => "2026-05-28T14:30:00.000Z",
};

let client: Client;

async function countRows(tableName: string): Promise<number> {
  const result = await client.execute(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(result.rows[0]?.count ?? 0);
}

describe("database ingestion sink", () => {
  beforeEach(async () => {
    client = await createLocalClient();
    await runMigrations(client);
  });

  afterEach(() => {
    client.close();
  });

  it("persists a price ingestion batch with provider lineage", async () => {
    const provider = createMockMarketDataProvider();
    const batch = await ingestPriceBars(
      provider,
      { symbol: "MSFT", from: "2026-05-01", to: "2026-05-02", interval: "1d" },
      fixedClock,
    );

    await persistIngestionBatch(client, batch);

    expect(await countRows("ingestion_runs")).toBe(1);
    expect(await countRows("provider_records")).toBe(2);
    expect(await countRows("price_bars")).toBe(2);

    const result = await client.execute(
      `SELECT provider_records.provider_dataset, price_bars.symbol
       FROM price_bars
       INNER JOIN provider_records ON provider_records.id = price_bars.provider_record_id
       ORDER BY price_bars.timestamp
       LIMIT 1`,
    );
    expect(result.rows[0]).toMatchObject({ provider_dataset: "prices", symbol: "MSFT" });
  });

  it("persists data quality events emitted by ingestion", async () => {
    const provider = createMockMarketDataProvider({
      priceBars: [
        {
          metadata: {
            providerName: "mock-market-data",
            providerRecordId: "missing-timestamp",
            retrievedAt: "",
            qualityStatus: "fresh",
          },
          symbol: "MSFT",
          timestamp: "2026-05-01T20:00:00.000Z",
          open: 100,
          high: 105,
          low: 99,
          close: 104,
          adjustedClose: 104,
          volume: 1200000,
          currency: "USD",
        },
      ],
    });
    const batch = await ingestPriceBars(
      provider,
      { symbol: "MSFT", from: "2026-05-01", to: "2026-05-02", interval: "1d" },
      fixedClock,
    );

    await persistIngestionBatch(client, batch);

    const result = await client.execute(
      "SELECT severity, quality_status, message FROM data_quality_events",
    );
    expect(result.rows).toEqual([
      {
        severity: "error",
        quality_status: "missing",
        message: "Missing provider or retrieval timestamp.",
      },
    ]);
    expect(await countRows("ingestion_runs")).toBe(1);
    expect(await countRows("provider_records")).toBe(1);
    expect(await countRows("price_bars")).toBe(0);
  });

  it("is idempotent when the same batch is persisted twice", async () => {
    const provider = createMockMarketDataProvider();
    const batch = await ingestPriceBars(
      provider,
      { symbol: "MSFT", from: "2026-05-01", to: "2026-05-02", interval: "1d" },
      fixedClock,
    );

    await persistIngestionBatch(client, batch);
    await persistIngestionBatch(client, batch);

    expect(await countRows("ingestion_runs")).toBe(1);
    expect(await countRows("provider_records")).toBe(2);
    expect(await countRows("price_bars")).toBe(2);
    expect(await countRows("data_quality_events")).toBe(0);
  });

  it("keeps an audit trail while quarantining duplicate normalized news", async () => {
    const provider = createMockNewsProvider({
      articles: [
        {
          metadata: {
            providerName: "mock-news",
            providerRecordId: "news-1",
            retrievedAt: "2026-05-28T14:00:00.000Z",
            providerTimestamp: "2026-05-28T13:30:00.000Z",
            sourcePublishedAt: "2026-05-28T13:30:00.000Z",
            qualityStatus: "fresh",
            sourceUrl: "https://example.com/msft-news",
          },
          symbol: "MSFT",
          title: "Microsoft example update",
          url: "https://example.com/msft-news",
          source: "example",
          publishedAt: "2026-05-28T13:30:00.000Z",
          retrievedAt: "2026-05-28T14:00:00.000Z",
          duplicateKey: "example-msft-news",
        },
        {
          metadata: {
            providerName: "mock-news",
            providerRecordId: "news-2",
            retrievedAt: "2026-05-28T14:01:00.000Z",
            providerTimestamp: "2026-05-28T13:31:00.000Z",
            sourcePublishedAt: "2026-05-28T13:31:00.000Z",
            qualityStatus: "fresh",
            sourceUrl: "https://example.com/msft-news-copy",
          },
          symbol: "MSFT",
          title: "Microsoft duplicate update",
          url: "https://example.com/msft-news-copy",
          source: "example",
          publishedAt: "2026-05-28T13:31:00.000Z",
          retrievedAt: "2026-05-28T14:01:00.000Z",
          duplicateKey: "example-msft-news",
        },
      ],
    });
    const batch = await ingestNewsArticles(provider, { symbols: ["MSFT"] }, fixedClock);

    await persistIngestionBatch(client, batch);

    expect(await countRows("ingestion_runs")).toBe(1);
    expect(await countRows("provider_records")).toBe(2);
    expect(await countRows("news_articles")).toBe(1);
    expect(await countRows("data_quality_events")).toBe(1);

    const result = await client.execute(
      "SELECT severity, quality_status, message FROM data_quality_events",
    );
    expect(result.rows[0]).toMatchObject({
      severity: "error",
      quality_status: "missing",
      message: "Duplicate news article detected.",
    });
  });

  it("keeps an audit trail while quarantining invalid option quotes", async () => {
    const provider = createMockOptionsProvider({
      quotes: [
        {
          metadata: {
            providerName: "mock-options",
            providerRecordId: "option-1",
            retrievedAt: "2026-05-28T14:00:00.000Z",
            providerTimestamp: "2026-05-28T13:59:00.000Z",
            qualityStatus: "fresh",
          },
          underlyingSymbol: "MSFT",
          contractSymbol: "MSFT260619C00100000",
          expiration: "2026-06-19",
          strike: 100,
          optionType: "call",
          quoteTimestamp: "2026-05-28T13:59:00.000Z",
          bid: 2.8,
          ask: 2.4,
          mid: 2.6,
          volume: 150,
          openInterest: 1200,
          impliedVolatility: 0.42,
          underlyingPrice: 101.1,
        },
      ],
    });
    const batch = await ingestOptionQuotes(
      provider,
      { underlyingSymbol: "MSFT", expiration: "2026-06-19" },
      fixedClock,
    );

    await persistIngestionBatch(client, batch);

    expect(await countRows("ingestion_runs")).toBe(1);
    expect(await countRows("provider_records")).toBe(1);
    expect(await countRows("option_quotes")).toBe(0);
    expect(await countRows("data_quality_events")).toBe(1);
  });
});
