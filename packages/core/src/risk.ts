export interface ScoreSet {
  risk: number;
  confidence: number;
  liquidity: number;
}

export interface DataFreshness {
  status: "fresh" | "stale" | "partial" | "missing";
  asOf: string;
  notes: string[];
}
