export const strategyFamilies = [
  "earnings",
  "momentum",
  "mean_reversion",
  "volatility",
  "options",
  "news_sentiment",
  "value_quality",
  "sector_macro",
  "portfolio_risk",
] as const;

export type StrategyFamily = (typeof strategyFamilies)[number];

export const evidenceStatuses = [
  "research_only",
  "watchlist_eligible",
  "paper_trade_eligible",
  "avoid",
  "needs_more_data",
] as const;

export type EvidenceStatus = (typeof evidenceStatuses)[number];
