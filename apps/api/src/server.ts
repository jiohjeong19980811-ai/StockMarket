import fastify from "fastify";
import {
  createMockEarningsProvider,
  createMockMarketDataProvider,
  createMockNewsProvider,
  createMockOptionsProvider,
  evaluateProviderCandidates,
  ingestEarningsEvents,
  ingestNewsArticles,
  ingestOptionQuotes,
  ingestPriceBars,
  providerSelectionCandidates,
  type IngestionClock,
} from "@stockmarket/data";
import { createLocalClient, persistIngestionBatch, runMigrations } from "@stockmarket/db";
import type { ApiEnv } from "./env.js";

type DryRunTableName =
  | "ingestion_runs"
  | "provider_records"
  | "price_bars"
  | "news_articles"
  | "earnings_events"
  | "option_quotes"
  | "data_quality_events";

async function countRows(
  client: Awaited<ReturnType<typeof createLocalClient>>,
  tableName: DryRunTableName,
) {
  const result = await client.execute(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(result.rows[0]?.count ?? 0);
}

export function buildServer(env: ApiEnv) {
  const server = fastify({
    logger: env.APP_ENV !== "test",
  });

  server.get("/health", async () => ({
    service: "stockmarket-api",
    status: "ok",
    appEnv: env.APP_ENV,
    liveTradingEnabled: env.LIVE_TRADING_ENABLED,
    timestamp: new Date().toISOString(),
  }));

  server.get("/providers/selection", async () => {
    const candidates = evaluateProviderCandidates(providerSelectionCandidates);

    return {
      mode: "policy",
      requiresEnv: false,
      liveTradingEnabled: env.LIVE_TRADING_ENABLED,
      providerKeysRequiredNow: [],
      useNow: candidates
        .filter((candidate) => candidate.decision === "use_now")
        .map((candidate) => candidate.id),
      evaluateFirst: candidates
        .filter((candidate) => candidate.decision === "evaluate_first")
        .map((candidate) => candidate.id),
      deferred: candidates
        .filter((candidate) => candidate.decision === "defer")
        .map((candidate) => candidate.id),
      candidates,
    };
  });

  server.post("/ingestion/mock-dry-run", async () => {
    const clock: IngestionClock = {
      now: () => "2026-05-28T14:30:00.000Z",
    };
    const client = await createLocalClient();

    try {
      await runMigrations(client);
      await persistIngestionBatch(
        client,
        await ingestPriceBars(
          createMockMarketDataProvider(),
          { symbol: "MSFT", from: "2026-05-01", to: "2026-05-02", interval: "1d" },
          clock,
        ),
      );
      await persistIngestionBatch(
        client,
        await ingestNewsArticles(createMockNewsProvider(), { symbols: ["MSFT"] }, clock),
      );
      await persistIngestionBatch(
        client,
        await ingestEarningsEvents(createMockEarningsProvider(), { symbols: ["MSFT"] }, clock),
      );
      await persistIngestionBatch(
        client,
        await ingestOptionQuotes(
          createMockOptionsProvider(),
          { underlyingSymbol: "MSFT", expiration: "2026-06-19" },
          clock,
        ),
      );

      return {
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: env.LIVE_TRADING_ENABLED,
        providerKeysRequired: [],
        persistence: {
          scope: "in_memory",
          durable: false,
          note: "Dry-run data is discarded after the response.",
        },
        persistedInMemory: {
          ingestionRuns: await countRows(client, "ingestion_runs"),
          providerRecords: await countRows(client, "provider_records"),
          priceBars: await countRows(client, "price_bars"),
          newsArticles: await countRows(client, "news_articles"),
          earningsEvents: await countRows(client, "earnings_events"),
          optionQuotes: await countRows(client, "option_quotes"),
          dataQualityEvents: await countRows(client, "data_quality_events"),
        },
      };
    } finally {
      client.close();
    }
  });

  return server;
}
