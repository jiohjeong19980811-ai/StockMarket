import type {
  EarningsProvider,
  MarketDataProvider,
  NewsProvider,
  OptionsProvider,
} from "./providers.js";
import type {
  ProviderEarningsEvent,
  ProviderMetadata,
  ProviderNewsArticle,
  ProviderOptionQuote,
  ProviderPriceBar,
} from "./types.js";

const retrievedAt = "2026-05-28T14:00:00.000Z";

function metadata(
  providerName: string,
  providerRecordId: string,
  providerTimestamp = retrievedAt,
  sourceUrl?: string,
): ProviderMetadata {
  return {
    providerName,
    providerRecordId,
    retrievedAt,
    providerTimestamp,
    sourcePublishedAt: providerTimestamp,
    sourceUrl,
    qualityStatus: "fresh",
  };
}

const defaultPriceBars: ProviderPriceBar[] = [
  {
    metadata: metadata("mock-market-data", "MSFT-2026-05-01"),
    symbol: "MSFT",
    interval: "1d",
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
    metadata: metadata("mock-market-data", "MSFT-2026-05-02"),
    symbol: "MSFT",
    interval: "1d",
    timestamp: "2026-05-02T20:00:00.000Z",
    open: 104,
    high: 108,
    low: 103,
    close: 107,
    adjustedClose: 107,
    volume: 1350000,
    currency: "USD",
  },
];

const defaultNewsArticles: ProviderNewsArticle[] = [
  {
    metadata: metadata(
      "mock-news",
      "MSFT-news-1",
      "2026-05-28T13:30:00.000Z",
      "https://example.com/msft-news",
    ),
    symbol: "MSFT",
    title: "Microsoft example update",
    url: "https://example.com/msft-news",
    source: "example",
    publishedAt: "2026-05-28T13:30:00.000Z",
    retrievedAt,
    summary: "Mock article for local provider contract tests.",
    sentimentScore: 0.2,
    duplicateKey: "example-msft-news",
  },
];

const defaultEarningsEvents: ProviderEarningsEvent[] = [
  {
    metadata: metadata(
      "mock-earnings",
      "MSFT-earnings-1",
      "2026-05-28T13:30:00.000Z",
      "https://example.com/msft-earnings",
    ),
    symbol: "MSFT",
    fiscalPeriod: "2026-Q3",
    announcementDate: "2026-06-15",
    announcementTiming: "after_market",
    epsEstimate: 2.1,
    epsActual: 2.3,
    epsSurprise: 0.2,
    sourceUrl: "https://example.com/msft-earnings",
  },
];

const defaultOptionQuotes: ProviderOptionQuote[] = [
  {
    metadata: metadata("mock-options", "MSFT-option-1", "2026-05-28T13:59:00.000Z"),
    underlyingSymbol: "MSFT",
    contractSymbol: "MSFT260619C00100000",
    expiration: "2026-06-19",
    strike: 100,
    optionType: "call",
    quoteTimestamp: "2026-05-28T13:59:00.000Z",
    bid: 2.4,
    ask: 2.6,
    mid: 2.5,
    volume: 150,
    openInterest: 1200,
    impliedVolatility: 0.42,
    underlyingPrice: 101.1,
  },
];

export function createMockMarketDataProvider(
  fixtures: {
    priceBars?: ProviderPriceBar[];
  } = {},
): MarketDataProvider {
  const priceBars = fixtures.priceBars ?? defaultPriceBars;
  return {
    providerName: "mock-market-data",
    adapterVersion: "mock-v0",
    getPriceBars: async (request) =>
      priceBars.filter(
        (bar) =>
          bar.symbol === request.symbol &&
          bar.timestamp.slice(0, 10) >= request.from &&
          bar.timestamp.slice(0, 10) <= request.to,
      ),
  };
}

export function createMockNewsProvider(
  fixtures: {
    articles?: ProviderNewsArticle[];
  } = {},
): NewsProvider {
  const articles = fixtures.articles ?? defaultNewsArticles;
  return {
    providerName: "mock-news",
    adapterVersion: "mock-v0",
    getNewsArticles: async (request) =>
      articles.filter((article) => request.symbols.includes(article.symbol)),
  };
}

export function createMockEarningsProvider(
  fixtures: {
    events?: ProviderEarningsEvent[];
  } = {},
): EarningsProvider {
  const events = fixtures.events ?? defaultEarningsEvents;
  return {
    providerName: "mock-earnings",
    adapterVersion: "mock-v0",
    getEarningsEvents: async (request) =>
      events.filter((event) => request.symbols.includes(event.symbol)),
  };
}

export function createMockOptionsProvider(
  fixtures: {
    quotes?: ProviderOptionQuote[];
  } = {},
): OptionsProvider {
  const quotes = fixtures.quotes ?? defaultOptionQuotes;
  return {
    providerName: "mock-options",
    adapterVersion: "mock-v0",
    getOptionQuotes: async (request) =>
      quotes.filter(
        (quote) =>
          quote.underlyingSymbol === request.underlyingSymbol &&
          (request.expiration === undefined || quote.expiration === request.expiration),
      ),
  };
}
