import type {
  DataQualityEventRecord,
  BarInterval,
  IngestionClock,
  ProviderMetadata,
  ProviderDataset,
  ProviderNewsArticle,
  ProviderOptionQuote,
  ProviderPriceBar,
  QualityStatus,
} from "./types.js";

export interface QualityFinding {
  severity: "info" | "warning" | "error";
  qualityStatus: QualityStatus;
  message: string;
}

export interface FreshnessPolicy {
  label: string;
  maxProviderAgeMs: number;
}

const minuteMs = 60 * 1000;
const hourMs = 60 * minuteMs;
const dayMs = 24 * hourMs;

export const freshnessPolicies = {
  intradayPrices: {
    label: "Intraday price",
    maxProviderAgeMs: 30 * minuteMs,
  },
  dailyPrices: {
    label: "Daily price",
    maxProviderAgeMs: 4 * dayMs,
  },
  news: {
    label: "News",
    maxProviderAgeMs: 48 * hourMs,
  },
  earnings: {
    label: "Earnings",
    maxProviderAgeMs: 7 * dayMs,
  },
  options: {
    label: "Options",
    maxProviderAgeMs: 60 * minuteMs,
  },
} satisfies Record<string, FreshnessPolicy>;

export function priceFreshnessPolicyForInterval(interval?: BarInterval): FreshnessPolicy {
  return interval === "1d" ? freshnessPolicies.dailyPrices : freshnessPolicies.intradayPrices;
}

export function freshnessPolicyForDataset(
  dataset: ProviderDataset,
  options: { interval?: BarInterval } = {},
): FreshnessPolicy {
  if (dataset === "prices") {
    return priceFreshnessPolicyForInterval(options.interval);
  }
  return freshnessPolicies[dataset];
}

export function isValidDate(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

export function providerMetadataFindings(
  metadata: ProviderMetadata,
  clock: IngestionClock,
  freshnessPolicy: FreshnessPolicy = {
    label: "Provider",
    maxProviderAgeMs: 24 * hourMs,
  },
): QualityFinding[] {
  const findings: QualityFinding[] = [];
  if (!isValidDate(metadata.retrievedAt) || !isValidDate(metadata.providerTimestamp)) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Missing provider or retrieval timestamp.",
    });
    return findings;
  }

  const nowMs = Date.parse(clock.now());
  const retrievedAtMs = Date.parse(metadata.retrievedAt);
  const providerTimestampMs = Date.parse(metadata.providerTimestamp);
  if (retrievedAtMs > nowMs) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Retrieval timestamp is in the future.",
    });
  }
  if (providerTimestampMs > nowMs) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Provider timestamp is in the future.",
    });
  }
  if (metadata.sourcePublishedAt !== undefined) {
    if (!isValidDate(metadata.sourcePublishedAt)) {
      findings.push({
        severity: "error",
        qualityStatus: "missing",
        message: "Source published timestamp is invalid.",
      });
    } else if (Date.parse(metadata.sourcePublishedAt) > nowMs) {
      findings.push({
        severity: "error",
        qualityStatus: "missing",
        message: "Source published timestamp is in the future.",
      });
    }
  }

  const providerAgeMs = Date.parse(clock.now()) - Date.parse(metadata.providerTimestamp);
  if (providerAgeMs > freshnessPolicy.maxProviderAgeMs) {
    findings.push({
      severity: "warning",
      qualityStatus: "stale",
      message: `${freshnessPolicy.label} provider timestamp is stale.`,
    });
  }

  return findings;
}

export function priceBarFindings(bar: ProviderPriceBar): QualityFinding[] {
  const findings: QualityFinding[] = [];

  if (!isValidDate(bar.timestamp)) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Price bar timestamp is invalid.",
    });
  }
  if (bar.open <= 0 || bar.high <= 0 || bar.low <= 0 || bar.close <= 0) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Price bar has nonpositive OHLC values.",
    });
  }
  if (bar.adjustedClose !== undefined && bar.adjustedClose <= 0) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Price bar adjusted close is nonpositive.",
    });
  }
  if (bar.high < bar.low) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Price bar high/low relationship is invalid.",
    });
  }
  if (bar.high < bar.open || bar.high < bar.close || bar.low > bar.open || bar.low > bar.close) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Price bar OHLC bounds are invalid.",
    });
  }
  if (bar.volume < 0) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Price bar volume is negative.",
    });
  }

  return findings;
}

export function duplicateNewsFindings(
  article: ProviderNewsArticle,
  seenDuplicateKeys: Set<string>,
): QualityFinding[] {
  if (seenDuplicateKeys.has(article.duplicateKey)) {
    return [
      {
        severity: "error",
        qualityStatus: "missing",
        message: "Duplicate news article detected.",
      },
    ];
  }
  seenDuplicateKeys.add(article.duplicateKey);
  return [];
}

export function earningsDateFindings(announcementDate: string): QualityFinding[] {
  if (!isValidDate(announcementDate)) {
    return [
      {
        severity: "error",
        qualityStatus: "missing",
        message: "Unparseable earnings announcement date.",
      },
    ];
  }
  return [];
}

export function optionQuoteFindings(quote: ProviderOptionQuote): QualityFinding[] {
  const findings: QualityFinding[] = [];

  if (quote.ask < quote.bid) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Option quote has an inverted bid/ask spread.",
    });
  }
  if (quote.volume <= 0 || quote.openInterest <= 0) {
    findings.push({
      severity: "warning",
      qualityStatus: "partial",
      message: "Option quote failed liquidity minimums.",
    });
  }
  if (quote.impliedVolatility <= 0) {
    findings.push({
      severity: "error",
      qualityStatus: "missing",
      message: "Option quote is missing usable implied volatility.",
    });
  }

  return findings;
}

export function qualityEventsFromFindings(
  findings: QualityFinding[],
  ingestionRunId: string,
  providerRecordId: string,
  clock: IngestionClock,
): DataQualityEventRecord[] {
  return findings.map((finding, index) => ({
    id: `${providerRecordId}:quality:${index + 1}`,
    providerRecordId,
    ingestionRunId,
    severity: finding.severity,
    qualityStatus: finding.qualityStatus,
    message: finding.message,
    createdAt: clock.now(),
  }));
}

export function degradeQualityStatus(
  originalStatus: QualityStatus,
  findings: QualityFinding[],
): QualityStatus {
  if (findings.some((finding) => finding.qualityStatus === "missing")) {
    return "missing";
  }
  if (findings.some((finding) => finding.qualityStatus === "partial")) {
    return "partial";
  }
  if (findings.some((finding) => finding.qualityStatus === "stale")) {
    return "stale";
  }
  return originalStatus;
}
