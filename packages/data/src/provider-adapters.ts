import type {
  EarningsProvider,
  MarketDataProvider,
  NewsProvider,
  OptionsProvider,
} from "./providers.js";

export interface ProviderAdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  termsReviewed?: boolean;
}

export class ProviderNotConfiguredError extends Error {
  constructor(providerName: string, environmentVariable: string) {
    super(`${providerName} provider requires ${environmentVariable} to be configured locally.`);
    this.name = "ProviderNotConfiguredError";
  }
}

export class ProviderHttpAdapterDeferredError extends Error {
  constructor(providerName: string) {
    super(`${providerName} HTTP adapter is deferred until provider terms are reviewed.`);
    this.name = "ProviderHttpAdapterDeferredError";
  }
}

function requireApiKey(
  providerName: string,
  environmentVariable: string,
  config: ProviderAdapterConfig,
): void {
  if (config.apiKey === undefined || config.apiKey.trim().length === 0) {
    throw new ProviderNotConfiguredError(providerName, environmentVariable);
  }
}

function deferred(providerName: string): never {
  throw new ProviderHttpAdapterDeferredError(providerName);
}

function requireTermsReviewed(providerName: string, config: ProviderAdapterConfig): void {
  if (config.termsReviewed !== true) {
    deferred(providerName);
  }
}

export function createPolygonProvider(
  config: ProviderAdapterConfig,
): MarketDataProvider & OptionsProvider {
  return {
    providerName: "polygon",
    adapterVersion: "stub-v0",
    getPriceBars: async () => {
      requireTermsReviewed("polygon", config);
      requireApiKey("polygon", "POLYGON_API_KEY", config);
      return deferred("polygon");
    },
    getOptionQuotes: async () => {
      requireTermsReviewed("polygon", config);
      requireApiKey("polygon", "POLYGON_API_KEY", config);
      return deferred("polygon");
    },
  };
}

export function createFinancialModelingPrepProvider(
  config: ProviderAdapterConfig,
): NewsProvider & EarningsProvider {
  return {
    providerName: "financial-modeling-prep",
    adapterVersion: "stub-v0",
    getNewsArticles: async () => {
      requireTermsReviewed("financial-modeling-prep", config);
      requireApiKey("financial-modeling-prep", "FMP_API_KEY", config);
      return deferred("financial-modeling-prep");
    },
    getEarningsEvents: async () => {
      requireTermsReviewed("financial-modeling-prep", config);
      requireApiKey("financial-modeling-prep", "FMP_API_KEY", config);
      return deferred("financial-modeling-prep");
    },
  };
}

export function createFinnhubProvider(
  config: ProviderAdapterConfig,
): NewsProvider & EarningsProvider {
  return {
    providerName: "finnhub",
    adapterVersion: "stub-v0",
    getNewsArticles: async () => {
      requireTermsReviewed("finnhub", config);
      requireApiKey("finnhub", "FINNHUB_API_KEY", config);
      return deferred("finnhub");
    },
    getEarningsEvents: async () => {
      requireTermsReviewed("finnhub", config);
      requireApiKey("finnhub", "FINNHUB_API_KEY", config);
      return deferred("finnhub");
    },
  };
}
