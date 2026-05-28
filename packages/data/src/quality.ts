import type {
  DataQualityEventRecord,
  IngestionClock,
  ProviderMetadata,
  ProviderNewsArticle,
  ProviderOptionQuote,
  QualityStatus,
} from "./types.js";

export interface QualityFinding {
  severity: "info" | "warning" | "error";
  qualityStatus: QualityStatus;
  message: string;
}

export function isValidDate(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

export function providerMetadataFindings(
  metadata: ProviderMetadata,
  clock: IngestionClock,
  maxProviderAgeMs = 24 * 60 * 60 * 1000,
): QualityFinding[] {
  const findings: QualityFinding[] = [];
  if (!isValidDate(metadata.retrievedAt) || !isValidDate(metadata.providerTimestamp)) {
    findings.push({
      severity: "warning",
      qualityStatus: "partial",
      message: "Missing provider or retrieval timestamp.",
    });
    return findings;
  }

  const providerAgeMs = Date.parse(clock.now()) - Date.parse(metadata.providerTimestamp);
  if (providerAgeMs > maxProviderAgeMs) {
    findings.push({
      severity: "warning",
      qualityStatus: "stale",
      message: "Provider timestamp is stale.",
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
        severity: "warning",
        qualityStatus: "partial",
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
        severity: "warning",
        qualityStatus: "partial",
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
      qualityStatus: "partial",
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
      severity: "warning",
      qualityStatus: "partial",
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
