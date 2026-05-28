import type { Client, InStatement } from "@libsql/client";
import type {
  IngestionBatch,
  ProviderEarningsEvent,
  ProviderNewsArticle,
  ProviderOptionQuote,
  ProviderPriceBar,
  ProviderRecordEnvelope,
} from "@stockmarket/data";

type IngestibleRecord =
  | ProviderPriceBar
  | ProviderNewsArticle
  | ProviderEarningsEvent
  | ProviderOptionQuote;

function nullable<T>(value: T | undefined): T | null {
  return value ?? null;
}

function providerRecordFor(
  providerRecords: ProviderRecordEnvelope[],
  index: number,
): ProviderRecordEnvelope {
  const providerRecord = providerRecords[index];
  if (providerRecord === undefined) {
    throw new Error(`Missing provider record for normalized record at index ${index}.`);
  }
  return providerRecord;
}

function ingestionRunStatement(batch: IngestionBatch<IngestibleRecord>): InStatement {
  return {
    sql: `INSERT INTO ingestion_runs
      (id, provider_name, provider_dataset, adapter_version, status, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      batch.run.id,
      batch.run.providerName,
      batch.run.providerDataset,
      batch.run.adapterVersion,
      batch.run.status,
      batch.run.startedAt,
      batch.run.completedAt,
    ],
  };
}

function providerRecordStatement(record: ProviderRecordEnvelope): InStatement {
  return {
    sql: `INSERT INTO provider_records
      (id, ingestion_run_id, provider_name, provider_dataset, provider_record_id, content_hash,
       provider_timestamp, source_published_at, retrieved_at, ingested_at, normalized_at,
       adapter_version, normalization_version, quality_status, quality_flags_json, quality_notes,
       source_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      record.id,
      record.ingestionRunId,
      record.providerName,
      record.providerDataset,
      record.providerRecordId,
      record.contentHash,
      nullable(record.providerTimestamp),
      nullable(record.sourcePublishedAt),
      record.retrievedAt,
      record.ingestedAt,
      record.normalizedAt,
      record.adapterVersion,
      record.normalizationVersion,
      record.qualityStatus,
      JSON.stringify(record.qualityFlags),
      record.qualityNotes,
      nullable(record.sourceUrl),
    ],
  };
}

function qualityEventStatements(batch: IngestionBatch<IngestibleRecord>): InStatement[] {
  return batch.qualityEvents.map((event) => ({
    sql: `INSERT INTO data_quality_events
      (id, provider_record_id, ingestion_run_id, severity, quality_status, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      event.id,
      nullable(event.providerRecordId),
      event.ingestionRunId,
      event.severity,
      event.qualityStatus,
      event.message,
      event.createdAt,
    ],
  }));
}

function priceBarStatements(batch: IngestionBatch<ProviderPriceBar>): InStatement[] {
  return batch.records.map((record, index) => ({
    sql: `INSERT INTO price_bars
      (id, provider_record_id, symbol, bar_interval, timestamp, open, high, low, close,
       adjusted_close, volume, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      `${providerRecordFor(batch.providerRecords, index).id}:price`,
      providerRecordFor(batch.providerRecords, index).id,
      record.symbol,
      record.interval ?? "1d",
      record.timestamp,
      record.open,
      record.high,
      record.low,
      record.close,
      nullable(record.adjustedClose),
      record.volume,
      record.currency,
    ],
  }));
}

function newsArticleStatements(batch: IngestionBatch<ProviderNewsArticle>): InStatement[] {
  return batch.records.map((record, index) => ({
    sql: `INSERT INTO news_articles
      (id, provider_record_id, symbol, title, url, source, published_at, retrieved_at,
       summary, sentiment_score, duplicate_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      `${providerRecordFor(batch.providerRecords, index).id}:news`,
      providerRecordFor(batch.providerRecords, index).id,
      record.symbol,
      record.title,
      record.url,
      record.source,
      record.publishedAt,
      record.retrievedAt,
      record.summary ?? "",
      nullable(record.sentimentScore),
      record.duplicateKey,
    ],
  }));
}

function earningsEventStatements(batch: IngestionBatch<ProviderEarningsEvent>): InStatement[] {
  return batch.records.map((record, index) => ({
    sql: `INSERT INTO earnings_events
      (id, provider_record_id, symbol, fiscal_period, announcement_date, announcement_timing,
       eps_estimate, eps_actual, eps_surprise, revenue_estimate, revenue_actual, guidance_text,
       source_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      `${providerRecordFor(batch.providerRecords, index).id}:earnings`,
      providerRecordFor(batch.providerRecords, index).id,
      record.symbol,
      record.fiscalPeriod,
      record.announcementDate,
      record.announcementTiming,
      nullable(record.epsEstimate),
      nullable(record.epsActual),
      nullable(record.epsSurprise),
      nullable(record.revenueEstimate),
      nullable(record.revenueActual),
      record.guidanceText ?? "",
      record.sourceUrl,
    ],
  }));
}

function optionQuoteStatements(batch: IngestionBatch<ProviderOptionQuote>): InStatement[] {
  return batch.records.map((record, index) => {
    const providerRecord = providerRecordFor(batch.providerRecords, index);
    return {
      sql: `INSERT INTO option_quotes
        (id, provider_record_id, underlying_symbol, contract_symbol, expiration, strike,
         option_type, quote_timestamp, bid, ask, mid, last, volume, open_interest,
         implied_volatility, underlying_price, delta, gamma, theta, vega, liquidity_flags_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `${providerRecord.id}:option`,
        providerRecord.id,
        record.underlyingSymbol,
        record.contractSymbol,
        record.expiration,
        record.strike,
        record.optionType,
        record.quoteTimestamp,
        record.bid,
        record.ask,
        record.mid,
        nullable(record.last),
        record.volume,
        record.openInterest,
        record.impliedVolatility,
        record.underlyingPrice,
        nullable(record.delta),
        nullable(record.gamma),
        nullable(record.theta),
        nullable(record.vega),
        JSON.stringify(providerRecord.qualityFlags),
      ],
    };
  });
}

function normalizedRecordStatements(batch: IngestionBatch<IngestibleRecord>): InStatement[] {
  switch (batch.run.providerDataset) {
    case "prices":
      return priceBarStatements(batch as IngestionBatch<ProviderPriceBar>);
    case "news":
      return newsArticleStatements(batch as IngestionBatch<ProviderNewsArticle>);
    case "earnings":
      return earningsEventStatements(batch as IngestionBatch<ProviderEarningsEvent>);
    case "options":
      return optionQuoteStatements(batch as IngestionBatch<ProviderOptionQuote>);
  }
}

export async function persistIngestionBatch(
  client: Client,
  batch: IngestionBatch<IngestibleRecord>,
): Promise<void> {
  await client.batch(
    [
      ingestionRunStatement(batch),
      ...batch.providerRecords.map(providerRecordStatement),
      ...qualityEventStatements(batch),
      ...normalizedRecordStatements(batch),
    ],
    "write",
  );
}
