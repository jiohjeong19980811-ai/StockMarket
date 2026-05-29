export type ProviderSelectionDecision = "use_now" | "evaluate_first" | "evaluate_later" | "defer";

export type ProviderSelectionCapability =
  | "prices"
  | "options"
  | "news"
  | "earnings"
  | "fundamentals"
  | "filings"
  | "macro"
  | "historical_options";

export interface ProviderSelectionCandidate {
  id: string;
  displayName: string;
  capabilities: ProviderSelectionCapability[];
  requiredEnv: string[];
  requiresTermsReview: boolean;
  brokerOrExecutionSurface: boolean;
  currentDevelopmentReady: boolean;
  notes: string[];
}

export interface ProviderSelectionEvaluation extends ProviderSelectionCandidate {
  score: number;
  decision: ProviderSelectionDecision;
  blockers: string[];
  nextActions: string[];
}

const brokerSurfaceBlocker =
  "Broker or order-placement surface must stay isolated from MVP ingestion.";

export const providerSelectionCandidates: ProviderSelectionCandidate[] = [
  {
    id: "mock",
    displayName: "Mock providers",
    capabilities: ["prices", "options", "news", "earnings"],
    requiredEnv: [],
    requiresTermsReview: false,
    brokerOrExecutionSurface: false,
    currentDevelopmentReady: true,
    notes: ["Use for tests, local demos, and no-key ingestion dry runs."],
  },
  {
    id: "polygon",
    displayName: "Polygon.io / Massive",
    capabilities: ["prices", "options"],
    requiredEnv: ["POLYGON_API_KEY"],
    requiresTermsReview: true,
    brokerOrExecutionSurface: false,
    currentDevelopmentReady: false,
    notes: ["First paid-provider candidate for market and options data."],
  },
  {
    id: "financial-modeling-prep",
    displayName: "Financial Modeling Prep",
    capabilities: ["news", "earnings", "fundamentals"],
    requiredEnv: ["FMP_API_KEY"],
    requiresTermsReview: true,
    brokerOrExecutionSurface: false,
    currentDevelopmentReady: false,
    notes: ["Candidate for fundamentals, earnings, analyst, and market news data."],
  },
  {
    id: "finnhub",
    displayName: "Finnhub",
    capabilities: ["news", "earnings", "fundamentals"],
    requiredEnv: ["FINNHUB_API_KEY"],
    requiresTermsReview: true,
    brokerOrExecutionSurface: false,
    currentDevelopmentReady: false,
    notes: ["Candidate for company news, earnings, fundamentals, and analyst signals."],
  },
  {
    id: "sec-edgar",
    displayName: "SEC EDGAR",
    capabilities: ["filings", "fundamentals"],
    requiredEnv: ["SEC_EDGAR_USER_AGENT"],
    requiresTermsReview: false,
    brokerOrExecutionSurface: false,
    currentDevelopmentReady: false,
    notes: ["Official source for filings and company facts; needs polite request identity."],
  },
  {
    id: "fred",
    displayName: "FRED",
    capabilities: ["macro"],
    requiredEnv: ["FRED_API_KEY"],
    requiresTermsReview: false,
    brokerOrExecutionSurface: false,
    currentDevelopmentReady: false,
    notes: ["Official macro source for rates, inflation, labor, and market regime context."],
  },
  {
    id: "cboe-datashop",
    displayName: "Cboe DataShop",
    capabilities: ["historical_options"],
    requiredEnv: [],
    requiresTermsReview: true,
    brokerOrExecutionSurface: false,
    currentDevelopmentReady: false,
    notes: ["Future candidate for serious historical options-chain validation."],
  },
  {
    id: "tradier",
    displayName: "Tradier",
    capabilities: ["options", "prices"],
    requiredEnv: [],
    requiresTermsReview: true,
    brokerOrExecutionSurface: true,
    currentDevelopmentReady: false,
    notes: ["Market/options data may be useful later, but broker adjacency is out of MVP."],
  },
  {
    id: "alpaca",
    displayName: "Alpaca",
    capabilities: ["prices"],
    requiredEnv: [],
    requiresTermsReview: true,
    brokerOrExecutionSurface: true,
    currentDevelopmentReady: false,
    notes: ["Market data may be useful later, but broker adjacency is out of MVP."],
  },
];

function capabilityScore(capabilities: ProviderSelectionCapability[]): number {
  const weights: Record<ProviderSelectionCapability, number> = {
    prices: 18,
    options: 18,
    news: 14,
    earnings: 14,
    fundamentals: 10,
    filings: 10,
    macro: 8,
    historical_options: 12,
  };
  return capabilities.reduce((score, capability) => score + weights[capability], 0);
}

function decisionForCandidate(candidate: ProviderSelectionCandidate): ProviderSelectionDecision {
  if (candidate.currentDevelopmentReady) {
    return "use_now";
  }
  if (candidate.brokerOrExecutionSurface) {
    return "defer";
  }
  if (["polygon", "financial-modeling-prep", "finnhub"].includes(candidate.id)) {
    return "evaluate_first";
  }
  return "evaluate_later";
}

export function evaluateProviderCandidates(
  candidates: ProviderSelectionCandidate[],
): ProviderSelectionEvaluation[] {
  return candidates.map((candidate) => {
    const blockers: string[] = [];
    const nextActions: string[] = [];
    let score = capabilityScore(candidate.capabilities);

    if (candidate.currentDevelopmentReady) {
      score += 100;
      nextActions.push("Use for local tests and mock ingestion until a real provider is approved.");
    }
    if (candidate.requiredEnv.length === 0) {
      score += 8;
    }
    if (candidate.requiresTermsReview) {
      score -= 12;
      blockers.push("Provider terms, pricing, storage rights, and rate limits need review.");
    }
    if (candidate.brokerOrExecutionSurface) {
      score -= 100;
      blockers.push(brokerSurfaceBlocker);
    }
    if (!candidate.currentDevelopmentReady && !candidate.brokerOrExecutionSurface) {
      nextActions.push("Keep adapter stubbed until provider review is complete.");
    }

    return {
      ...candidate,
      score,
      decision: decisionForCandidate(candidate),
      blockers,
      nextActions,
    };
  });
}
