export type QualityStatus = "fresh" | "stale" | "partial" | "missing";

export type ProviderDataset = "prices" | "news" | "earnings" | "options";

export type BarInterval = "1d" | "1h" | "15m" | "5m" | "1m";

export type AnnouncementTiming = "pre_market" | "after_market" | "during_market" | "unknown";

export type OptionType = "call" | "put";

export interface ProviderMetadata {
  providerName: string;
  providerRecordId: string;
  retrievedAt: string;
  providerTimestamp?: string;
  sourcePublishedAt?: string;
  sourceUrl?: string;
  qualityStatus: QualityStatus;
}

export interface PriceBarsRequest {
  symbol: string;
  from: string;
  to: string;
  interval: BarInterval;
}

export interface NewsRequest {
  symbols: string[];
  from?: string;
  to?: string;
}

export interface EarningsRequest {
  symbols: string[];
  from?: string;
  to?: string;
}

export interface OptionsChainRequest {
  underlyingSymbol: string;
  expiration?: string;
}

export interface ProviderPriceBar {
  metadata: ProviderMetadata;
  symbol: string;
  interval?: BarInterval;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume: number;
  currency: string;
}

export interface ProviderNewsArticle {
  metadata: ProviderMetadata;
  symbol: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  retrievedAt: string;
  summary?: string;
  sentimentScore?: number;
  duplicateKey: string;
}

export interface ProviderEarningsEvent {
  metadata: ProviderMetadata;
  symbol: string;
  fiscalPeriod: string;
  announcementDate: string;
  announcementTiming: AnnouncementTiming;
  epsEstimate?: number;
  epsActual?: number;
  epsSurprise?: number;
  revenueEstimate?: number;
  revenueActual?: number;
  guidanceText?: string;
  sourceUrl: string;
}

export interface ProviderOptionQuote {
  metadata: ProviderMetadata;
  underlyingSymbol: string;
  contractSymbol: string;
  expiration: string;
  strike: number;
  optionType: OptionType;
  quoteTimestamp: string;
  bid: number;
  ask: number;
  mid: number;
  last?: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  underlyingPrice: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface IngestionClock {
  now(): string;
}

export interface IngestionRunRecord {
  id: string;
  providerName: string;
  providerDataset: ProviderDataset;
  adapterVersion: string;
  status: "completed" | "failed";
  startedAt: string;
  completedAt: string;
}

export interface ProviderRecordEnvelope {
  id: string;
  ingestionRunId: string;
  providerName: string;
  providerDataset: ProviderDataset;
  providerRecordId: string;
  contentHash: string;
  providerTimestamp?: string;
  sourcePublishedAt?: string;
  retrievedAt: string;
  ingestedAt: string;
  normalizedAt: string;
  adapterVersion: string;
  normalizationVersion: string;
  qualityStatus: QualityStatus;
  qualityFlags: string[];
  qualityNotes: string;
  sourceUrl?: string;
}

export interface DataQualityEventRecord {
  id: string;
  providerRecordId?: string;
  ingestionRunId: string;
  severity: "info" | "warning" | "error";
  qualityStatus: QualityStatus;
  message: string;
  createdAt: string;
}

export interface IngestionBatch<TRecord> {
  run: IngestionRunRecord;
  providerRecords: ProviderRecordEnvelope[];
  records: TRecord[];
  qualityEvents: DataQualityEventRecord[];
}
