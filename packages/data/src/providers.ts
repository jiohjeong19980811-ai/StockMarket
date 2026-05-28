import type {
  EarningsRequest,
  NewsRequest,
  OptionsChainRequest,
  PriceBarsRequest,
  ProviderEarningsEvent,
  ProviderNewsArticle,
  ProviderOptionQuote,
  ProviderPriceBar,
} from "./types.js";

export interface MarketDataProvider {
  readonly providerName: string;
  readonly adapterVersion: string;
  getPriceBars(request: PriceBarsRequest): Promise<ProviderPriceBar[]>;
}

export interface NewsProvider {
  readonly providerName: string;
  readonly adapterVersion: string;
  getNewsArticles(request: NewsRequest): Promise<ProviderNewsArticle[]>;
}

export interface EarningsProvider {
  readonly providerName: string;
  readonly adapterVersion: string;
  getEarningsEvents(request: EarningsRequest): Promise<ProviderEarningsEvent[]>;
}

export interface OptionsProvider {
  readonly providerName: string;
  readonly adapterVersion: string;
  getOptionQuotes(request: OptionsChainRequest): Promise<ProviderOptionQuote[]>;
}
