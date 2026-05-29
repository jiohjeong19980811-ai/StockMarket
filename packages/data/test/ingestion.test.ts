import { describe, expect, it } from "vitest";
import {
  createMockEarningsProvider,
  createMockMarketDataProvider,
  createMockNewsProvider,
  createMockOptionsProvider,
  ingestEarningsEvents,
  ingestNewsArticles,
  ingestOptionQuotes,
  ingestPriceBars,
  type IngestionClock,
} from "../src/index.js";

const fixedClock: IngestionClock = {
  now: () => "2026-05-28T14:30:00.000Z",
};

describe("provider contracts and mock ingestion", () => {
  it("returns timestamped provider-neutral mock price bars", async () => {
    const provider = createMockMarketDataProvider();

    const bars = await provider.getPriceBars({
      symbol: "MSFT",
      from: "2026-05-01",
      to: "2026-05-02",
      interval: "1d",
    });

    expect(bars[0]?.metadata.providerName).toBe("mock-market-data");
    expect(bars[0]?.metadata.retrievedAt).toMatch(/T/);
    expect(bars[0]?.metadata.providerTimestamp).toMatch(/T/);
    expect(bars[0]?.symbol).toBe("MSFT");
  });

  it("does not expose broker execution methods on providers", () => {
    const providers = [
      createMockMarketDataProvider(),
      createMockNewsProvider(),
      createMockEarningsProvider(),
      createMockOptionsProvider(),
    ];

    for (const provider of providers) {
      const unsafeKeys = Object.keys(provider).filter((key) =>
        /order|trade|position|account|broker/i.test(key),
      );
      expect(unsafeKeys).toEqual([]);
    }
  });

  it("builds auditable price ingestion batches with content hashes", async () => {
    const provider = createMockMarketDataProvider();

    const batch = await ingestPriceBars(
      provider,
      { symbol: "MSFT", from: "2026-05-01", to: "2026-05-02", interval: "1d" },
      fixedClock,
    );

    expect(batch.run.providerName).toBe("mock-market-data");
    expect(batch.run.providerDataset).toBe("prices");
    expect(batch.run.status).toBe("completed");
    expect(batch.providerRecords).toHaveLength(2);
    expect(batch.providerRecords[0]?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(batch.records[0]?.symbol).toBe("MSFT");
    expect(batch.qualityEvents).toEqual([]);
  });

  it("creates distinct ingestion run IDs for different requests at the same clock", async () => {
    const provider = createMockMarketDataProvider({
      priceBars: [
        {
          metadata: {
            providerName: "mock-market-data",
            providerRecordId: "MSFT-2026-05-01",
            retrievedAt: "2026-05-28T14:00:00.000Z",
            providerTimestamp: "2026-05-28T14:00:00.000Z",
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
        {
          metadata: {
            providerName: "mock-market-data",
            providerRecordId: "AAPL-2026-05-01",
            retrievedAt: "2026-05-28T14:00:00.000Z",
            providerTimestamp: "2026-05-28T14:00:00.000Z",
            qualityStatus: "fresh",
          },
          symbol: "AAPL",
          timestamp: "2026-05-01T20:00:00.000Z",
          open: 200,
          high: 205,
          low: 198,
          close: 204,
          adjustedClose: 204,
          volume: 1500000,
          currency: "USD",
        },
      ],
    });

    const msftBatch = await ingestPriceBars(
      provider,
      { symbol: "MSFT", from: "2026-05-01", to: "2026-05-01", interval: "1d" },
      fixedClock,
    );
    const aaplBatch = await ingestPriceBars(
      provider,
      { symbol: "AAPL", from: "2026-05-01", to: "2026-05-01", interval: "1d" },
      fixedClock,
    );

    expect(msftBatch.run.id).not.toBe(aaplBatch.run.id);
  });

  it("flags empty provider responses as missing data", async () => {
    const provider = createMockMarketDataProvider({ priceBars: [] });

    const batch = await ingestPriceBars(
      provider,
      { symbol: "MSFT", from: "2026-05-01", to: "2026-05-01", interval: "1d" },
      fixedClock,
    );

    expect(batch.run.status).toBe("failed");
    expect(batch.providerRecords).toEqual([]);
    expect(batch.qualityEvents).toEqual([
      expect.objectContaining({
        qualityStatus: "missing",
        severity: "error",
        message: "Prices provider returned no records.",
      }),
    ]);
    expect(batch.qualityEvents[0]).not.toHaveProperty("providerRecordId");
  });

  it("flags missing timestamps in provider records", async () => {
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

    expect(batch.run.status).toBe("failed");
    expect(batch.providerRecords[0]?.qualityStatus).toBe("missing");
    expect(batch.qualityEvents.map((event) => event.message)).toContain(
      "Missing provider or retrieval timestamp.",
    );
  });

  it("flags future provider timestamps as missing to prevent lookahead bias", async () => {
    const provider = createMockMarketDataProvider({
      priceBars: [
        {
          metadata: {
            providerName: "mock-market-data",
            providerRecordId: "future-timestamp",
            retrievedAt: "2026-05-28T14:00:00.000Z",
            providerTimestamp: "2026-05-29T14:00:00.000Z",
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
      { symbol: "MSFT", from: "2026-05-01", to: "2026-05-01", interval: "1d" },
      fixedClock,
    );

    expect(batch.providerRecords[0]?.qualityStatus).toBe("missing");
    expect(batch.qualityEvents.map((event) => event.message)).toContain(
      "Provider timestamp is in the future.",
    );
  });

  it("flags unsafe price bar values before persistence", async () => {
    const provider = createMockMarketDataProvider({
      priceBars: [
        {
          metadata: {
            providerName: "mock-market-data",
            providerRecordId: "bad-price-bar",
            retrievedAt: "2026-05-28T14:00:00.000Z",
            providerTimestamp: "2026-05-28T14:00:00.000Z",
            qualityStatus: "fresh",
          },
          symbol: "MSFT",
          timestamp: "2026-05-01T20:00:00.000Z",
          open: 100,
          high: 98,
          low: 99,
          close: 104,
          adjustedClose: 104,
          volume: -1,
          currency: "USD",
        },
      ],
    });

    const batch = await ingestPriceBars(
      provider,
      { symbol: "MSFT", from: "2026-05-01", to: "2026-05-01", interval: "1d" },
      fixedClock,
    );

    expect(batch.providerRecords[0]?.qualityStatus).toBe("missing");
    expect(batch.qualityEvents.map((event) => event.message)).toEqual(
      expect.arrayContaining([
        "Price bar high/low relationship is invalid.",
        "Price bar OHLC bounds are invalid.",
        "Price bar volume is negative.",
      ]),
    );
  });

  it("flags duplicate news articles", async () => {
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

    expect(batch.providerRecords[1]?.qualityStatus).toBe("missing");
    expect(batch.qualityEvents.map((event) => event.message)).toContain(
      "Duplicate news article detected.",
    );
  });

  it("flags earnings events with unparseable announcement dates", async () => {
    const provider = createMockEarningsProvider({
      events: [
        {
          metadata: {
            providerName: "mock-earnings",
            providerRecordId: "earnings-1",
            retrievedAt: "2026-05-28T14:00:00.000Z",
            providerTimestamp: "2026-05-28T13:30:00.000Z",
            qualityStatus: "fresh",
          },
          symbol: "MSFT",
          fiscalPeriod: "2026-Q3",
          announcementDate: "not-a-date",
          announcementTiming: "after_market",
          sourceUrl: "https://example.com/msft-earnings",
        },
      ],
    });

    const batch = await ingestEarningsEvents(provider, { symbols: ["MSFT"] }, fixedClock);

    expect(batch.providerRecords[0]?.qualityStatus).toBe("missing");
    expect(batch.qualityEvents.map((event) => event.message)).toContain(
      "Unparseable earnings announcement date.",
    );
  });

  it("flags inverted or illiquid option quotes", async () => {
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
          volume: 0,
          openInterest: 0,
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

    expect(batch.providerRecords[0]?.qualityStatus).toBe("missing");
    expect(batch.qualityEvents.map((event) => event.message)).toEqual(
      expect.arrayContaining([
        "Option quote has an inverted bid/ask spread.",
        "Option quote failed liquidity minimums.",
      ]),
    );
  });

  it("flags option quotes stale after the delayed-quote window", async () => {
    const provider = createMockOptionsProvider({
      quotes: [
        {
          metadata: {
            providerName: "mock-options",
            providerRecordId: "option-stale",
            retrievedAt: "2026-05-28T14:00:00.000Z",
            providerTimestamp: "2026-05-28T13:15:00.000Z",
            qualityStatus: "fresh",
          },
          underlyingSymbol: "MSFT",
          contractSymbol: "MSFT260619C00100000",
          expiration: "2026-06-19",
          strike: 100,
          optionType: "call",
          quoteTimestamp: "2026-05-28T13:15:00.000Z",
          bid: 2.4,
          ask: 2.6,
          mid: 2.5,
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

    expect(batch.providerRecords[0]?.qualityStatus).toBe("stale");
    expect(batch.qualityEvents.map((event) => event.message)).toContain(
      "Options provider timestamp is stale.",
    );
  });

  it("allows earnings calendar records to use a slower freshness window", async () => {
    const provider = createMockEarningsProvider({
      events: [
        {
          metadata: {
            providerName: "mock-earnings",
            providerRecordId: "earnings-slower-window",
            retrievedAt: "2026-05-28T14:00:00.000Z",
            providerTimestamp: "2026-05-26T14:30:00.000Z",
            qualityStatus: "fresh",
          },
          symbol: "MSFT",
          fiscalPeriod: "2026-Q3",
          announcementDate: "2026-06-15",
          announcementTiming: "after_market",
          sourceUrl: "https://example.com/msft-earnings",
        },
      ],
    });

    const batch = await ingestEarningsEvents(provider, { symbols: ["MSFT"] }, fixedClock);

    expect(batch.providerRecords[0]?.qualityStatus).toBe("fresh");
    expect(batch.qualityEvents).toEqual([]);
  });
});
