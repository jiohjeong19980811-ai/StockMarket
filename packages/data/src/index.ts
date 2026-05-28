export interface ProviderMetadata {
  providerName: string;
  retrievedAt: string;
  providerTimestamp?: string;
  qualityStatus: "fresh" | "stale" | "partial" | "missing";
}
