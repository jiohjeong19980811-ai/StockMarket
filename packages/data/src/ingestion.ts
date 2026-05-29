import { createHash } from "node:crypto";
import type {
  EarningsProvider,
  MarketDataProvider,
  NewsProvider,
  OptionsProvider,
} from "./providers.js";
import {
  degradeQualityStatus,
  duplicateNewsFindings,
  earningsDateFindings,
  freshnessPolicyForDataset,
  optionQuoteFindings,
  priceBarFindings,
  providerMetadataFindings,
  qualityEventsFromFindings,
  type FreshnessPolicy,
  type QualityFinding,
} from "./quality.js";
import type {
  DataQualityEventRecord,
  EarningsRequest,
  IngestionBatch,
  IngestionClock,
  IngestionRunRecord,
  NewsRequest,
  OptionsChainRequest,
  PriceBarsRequest,
  ProviderDataset,
  ProviderEarningsEvent,
  ProviderMetadata,
  ProviderNewsArticle,
  ProviderOptionQuote,
  ProviderPriceBar,
  ProviderRecordEnvelope,
} from "./types.js";

export const normalizationVersion = "normalize-v0";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function safeIdPart(value: string): string {
  return value
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function createRun(
  providerName: string,
  adapterVersion: string,
  providerDataset: ProviderDataset,
  clock: IngestionClock,
  requestContext: unknown,
): IngestionRunRecord {
  const now = clock.now();
  return {
    id: `ingest_${safeIdPart(providerName)}_${providerDataset}_${sha256({
      now,
      providerName,
      providerDataset,
      requestContext,
    }).slice(0, 12)}`,
    providerName,
    providerDataset,
    adapterVersion,
    status: "completed",
    startedAt: now,
    completedAt: now,
  };
}

function createProviderRecord<TRecord extends { metadata: ProviderMetadata }>(
  run: IngestionRunRecord,
  record: TRecord,
  index: number,
  clock: IngestionClock,
  findings: QualityFinding[],
): ProviderRecordEnvelope {
  const contentHash = sha256(record);
  const id = `provider_record_${run.providerDataset}_${index + 1}_${contentHash.slice(0, 12)}`;
  return {
    id,
    ingestionRunId: run.id,
    providerName: run.providerName,
    providerDataset: run.providerDataset,
    providerRecordId: record.metadata.providerRecordId,
    contentHash,
    providerTimestamp: record.metadata.providerTimestamp,
    sourcePublishedAt: record.metadata.sourcePublishedAt,
    retrievedAt: record.metadata.retrievedAt,
    ingestedAt: clock.now(),
    normalizedAt: clock.now(),
    adapterVersion: run.adapterVersion,
    normalizationVersion,
    qualityStatus: degradeQualityStatus(record.metadata.qualityStatus, findings),
    qualityFlags: findings.map((finding) => finding.message),
    qualityNotes: findings.map((finding) => finding.message).join("; "),
    sourceUrl: record.metadata.sourceUrl,
  };
}

function buildBatch<TRecord extends { metadata: ProviderMetadata }>(
  run: IngestionRunRecord,
  records: TRecord[],
  clock: IngestionClock,
  freshnessPolicy: FreshnessPolicy,
  emptyResponseLabel: string,
  findingsForRecord: (record: TRecord, index: number) => QualityFinding[],
): IngestionBatch<TRecord> {
  const providerRecords: ProviderRecordEnvelope[] = [];
  const qualityEvents: DataQualityEventRecord[] = [];

  if (records.length === 0) {
    return {
      run: { ...run, status: "failed" },
      providerRecords,
      records,
      qualityEvents: [
        {
          id: `${run.id}:quality:empty-response`,
          ingestionRunId: run.id,
          severity: "error",
          qualityStatus: "missing",
          message: `${emptyResponseLabel} provider returned no records.`,
          createdAt: clock.now(),
        },
      ],
    };
  }

  records.forEach((record, index) => {
    const findings = [
      ...providerMetadataFindings(record.metadata, clock, freshnessPolicy),
      ...findingsForRecord(record, index),
    ];
    const providerRecord = createProviderRecord(run, record, index, clock, findings);
    providerRecords.push(providerRecord);
    qualityEvents.push(...qualityEventsFromFindings(findings, run.id, providerRecord.id, clock));
  });

  const hasUsableRecords = providerRecords.some(
    (providerRecord) => providerRecord.qualityStatus !== "missing",
  );

  return {
    run: hasUsableRecords ? run : { ...run, status: "failed" },
    providerRecords,
    records,
    qualityEvents,
  };
}

export async function ingestPriceBars(
  provider: MarketDataProvider,
  request: PriceBarsRequest,
  clock: IngestionClock,
): Promise<IngestionBatch<ProviderPriceBar>> {
  const records = await provider.getPriceBars(request);
  const run = createRun(provider.providerName, provider.adapterVersion, "prices", clock, request);
  return buildBatch(
    run,
    records,
    clock,
    freshnessPolicyForDataset("prices", { interval: request.interval }),
    "Prices",
    priceBarFindings,
  );
}

export async function ingestNewsArticles(
  provider: NewsProvider,
  request: NewsRequest,
  clock: IngestionClock,
): Promise<IngestionBatch<ProviderNewsArticle>> {
  const records = await provider.getNewsArticles(request);
  const run = createRun(provider.providerName, provider.adapterVersion, "news", clock, request);
  const seenDuplicateKeys = new Set<string>();
  return buildBatch(run, records, clock, freshnessPolicyForDataset("news"), "News", (record) =>
    duplicateNewsFindings(record, seenDuplicateKeys),
  );
}

export async function ingestEarningsEvents(
  provider: EarningsProvider,
  request: EarningsRequest,
  clock: IngestionClock,
): Promise<IngestionBatch<ProviderEarningsEvent>> {
  const records = await provider.getEarningsEvents(request);
  const run = createRun(provider.providerName, provider.adapterVersion, "earnings", clock, request);
  return buildBatch(
    run,
    records,
    clock,
    freshnessPolicyForDataset("earnings"),
    "Earnings",
    (record) => earningsDateFindings(record.announcementDate),
  );
}

export async function ingestOptionQuotes(
  provider: OptionsProvider,
  request: OptionsChainRequest,
  clock: IngestionClock,
): Promise<IngestionBatch<ProviderOptionQuote>> {
  const records = await provider.getOptionQuotes(request);
  const run = createRun(provider.providerName, provider.adapterVersion, "options", clock, request);
  return buildBatch(
    run,
    records,
    clock,
    freshnessPolicyForDataset("options"),
    "Options",
    optionQuoteFindings,
  );
}
