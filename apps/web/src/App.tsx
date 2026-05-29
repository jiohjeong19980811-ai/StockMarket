import { useEffect, useState } from "react";

type Decision = "watchlist" | "paper_trade" | "avoid" | "needs_more_data";

interface ScoreSet {
  risk: number;
  confidence: number;
  liquidity: number;
}

interface RiskGate {
  id: string;
  passed: boolean;
  impact: string;
  message: string;
}

interface StrategyPolicy {
  family: string;
  label: string;
  mvpDecision: "test_now" | "context_only" | "test_later" | "control_layer";
  paperTradeAllowed: boolean;
  requiredData: string[];
  backtestingRequirements: string[];
  riskControls: string[];
  optionsConsiderations: string[];
  implementationComplexity: string;
  overfittingRisk: string;
  notes: string;
}

interface ScoringResult {
  ticker: string;
  decision: Decision;
  evidenceStatus: string;
  strategyPolicy: StrategyPolicy;
  scores: ScoreSet;
  gates: RiskGate[];
  explanation: {
    summary: string;
    contributors: string[];
    assumptions: string[];
    blocks: string[];
  };
}

interface MockScoringResponse {
  mode: "mock";
  requiresEnv: boolean;
  liveTradingEnabled: boolean;
  providerKeysRequired: string[];
  notRecommendation: boolean;
  result: ScoringResult;
}

interface PaperTradeResponse {
  mode: "mock";
  requiresEnv: boolean;
  liveTradingEnabled: boolean;
  providerKeysRequired: string[];
  notRecommendation: boolean;
  persistence: {
    scope: string;
    durable: boolean;
    note: string;
  };
  result: {
    status: "accepted" | "rejected";
    reasonCodes: string[];
    trade?: {
      mode: "paper";
      liveTradingEnabled: false;
      brokerExecution: false;
      ticker: string;
      instrumentType: string;
      status: "open";
      risk: {
        maxLoss: number;
        riskPctOfEquity: number;
      };
    };
  };
}

interface PaperTradeCloseResponse {
  mode: "mock";
  requiresEnv: boolean;
  liveTradingEnabled: boolean;
  providerKeysRequired: string[];
  notRecommendation: boolean;
  persistence: {
    scope: string;
    durable: boolean;
    note: string;
  };
  closeResult: {
    status: "accepted" | "rejected";
    reasonCodes: string[];
    trade?: {
      mode: "paper";
      liveTradingEnabled: false;
      brokerExecution: false;
      ticker: string;
      instrumentType: string;
      status: "closed";
      entryPrice: number;
      exitPrice: number;
      quantity: number;
      realizedPnl: number;
      realizedReturnPct: number;
      lessons: string[];
      exitAudit: {
        auditLogId: string;
        priceTimestamp: string;
      };
    };
  };
  persistedInMemory: {
    recommendations: number;
    auditLogs: number;
    paperTrades: number;
  };
  ledger?: {
    status: "closed";
    exitAuditLogId: string;
    exitPrice: number;
    lessonsLearned: string;
  };
}

interface PaperTradeEvidenceSummaryResponse {
  mode: "mock";
  requiresEnv: boolean;
  liveTradingEnabled: boolean;
  providerKeysRequired: string[];
  notRecommendation: boolean;
  persistence: {
    scope: string;
    durable: boolean;
    note: string;
  };
  summary: {
    mode: "paper";
    liveTradingEnabled: false;
    brokerExecution: false;
    notRecommendation: true;
    status: "accepted" | "blocked";
    reviewStatus: "needs_more_data" | "ready_for_review" | "blocked";
    reasonCodes: string[];
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRatePct: number;
    realizedPnl: number;
    averageReturnPct: number;
    averageRiskPctOfEquity: number;
    largestWin: number;
    largestLoss: number;
    closedTradeAuditLogIds: string[];
    notes: string[];
  };
}

interface PaperTradeReadModelResponse {
  mode: "mock";
  requiresEnv: boolean;
  liveTradingEnabled: boolean;
  providerKeysRequired: string[];
  notRecommendation: boolean;
  persistence: {
    scope: string;
    durable: boolean;
    note: string;
  };
  persistedInMemory: {
    recommendations: number;
    auditLogs: number;
    paperTrades: number;
  };
  trades: Array<{
    id: string;
    recommendationId: string;
    accountId: string;
    mode: "paper";
    status: "open" | "closed" | "cancelled";
    ticker: string;
    instrumentType: "stock";
    strategyVersionId: string;
    thesisSnapshot: string;
    entryReason: string;
    downsideScenario: string;
    invalidationConditions: string[];
    liveTradingEnabled: false;
    brokerExecution: false;
    audit: {
      operatorApprovalAuditLogId: string;
      entryAuditLogId: string;
      exitAuditLogId: string | null;
    };
    entry: {
      type: "market" | "limit";
      requestedPrice: number;
      simulatedPrice: number;
      quantity: number;
      enteredAt: string;
      stopLoss: number;
      profitTarget: number;
      timeStopAt: string;
    };
    risk: {
      maxLossAmount: number;
      riskPctOfEquity: number;
      accountEquityAtEntry: number;
      singleNameExposurePct: number;
      sectorExposurePct: number;
      correlatedExposurePct: number;
      dailyLossPctAtEntry: number;
    };
    outcome: {
      closedAt: string;
      exitPrice: number;
      exitReason: string;
      lessonsLearned: string;
      realizedPnl: number;
      realizedReturnPct: number;
    } | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface EvidenceDetailResponse {
  mode: "mock";
  requiresEnv: boolean;
  liveTradingEnabled: boolean;
  providerKeysRequired: string[];
  notRecommendation: boolean;
  persistence: {
    scope: string;
    durable: boolean;
    note: string;
  };
  persistedInMemory: {
    recommendations: number;
    auditLogs: number;
    paperTrades: number;
  };
  evidenceDetail: {
    notRecommendation: true;
    evidenceGate: "verified" | "needs_more_data" | "blocked";
    reasonCodes: string[];
    recommendation: {
      id: string;
      ticker: string;
      instrumentType: string;
      strategyVersionId: string;
      decision: Decision;
      evidenceStatus: string;
      thesis: string;
      bullCase: string;
      bearCase: string;
      downsideScenario: string;
      invalidationConditions: string[];
      whySystemMightBeWrong: string;
      scores: ScoreSet;
      evidenceIds: {
        backtestRunId: string | null;
        paperTradeEvidenceId: string | null;
      };
    };
    citations: Array<{
      title: string;
      url: string;
      source: string;
      publishedAt: string;
      retrievedAt: string;
    }>;
    dataFreshness: {
      status: string;
      asOf: string;
      notes: string[];
    };
    evidence: Array<{
      kind: "backtest_run" | "paper_trade";
      id: string;
      status: "verified" | "unresolved" | "blocked";
      reasonCodes: string[];
      ticker?: string;
      instrumentType?: string;
      strategyVersionId?: string;
      closedAt?: string;
      liveTradingEnabled?: false;
      brokerExecution?: false;
      realizedPnl?: number;
      realizedReturnPct?: number;
    }>;
    auditTrail: Array<{
      id: string;
      eventType: string;
      actorType: "operator" | "system";
      actorId: string;
      occurredAt: string;
      subjectType: string;
      subjectId: string;
      riskDecision: string | null;
      operatorDecision: string | null;
      operatorNotes: string | null;
    }>;
  };
}

type ApiState = "loading" | "online" | "offline";

const scoringEndpoint = "http://127.0.0.1:4000/scoring/mock-evaluation";
const paperTradingEndpoint = "http://127.0.0.1:4000/paper-trading/mock-decision";
const paperTradeCloseEndpoint = "http://127.0.0.1:4000/paper-trading/mock-close-dry-run";
const paperTradeEvidenceEndpoint = "http://127.0.0.1:4000/paper-trading/mock-evidence-summary";
const paperTradeReadModelEndpoint = "http://127.0.0.1:4000/paper-trading/mock-read-model-dry-run";
const evidenceDetailEndpoint = "http://127.0.0.1:4000/paper-trading/mock-evidence-detail-dry-run";

const fallbackScoring: MockScoringResponse = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  result: {
    ticker: "MSFT",
    decision: "watchlist",
    evidenceStatus: "research_only",
    strategyPolicy: {
      family: "momentum",
      label: "Momentum",
      mvpDecision: "test_now",
      paperTradeAllowed: true,
      requiredData: ["Adjusted OHLCV"],
      backtestingRequirements: ["Turnover and cost modeling"],
      riskControls: ["Liquidity floor"],
      optionsConsiderations: ["Defined-risk options only after options evidence exists."],
      implementationComplexity: "medium",
      overfittingRisk: "medium",
      notes: "Liquid equity and ETF momentum is an MVP test-first family.",
    },
    scores: {
      risk: 83,
      confidence: 81,
      liquidity: 86,
    },
    gates: [
      {
        id: "citations_present",
        passed: true,
        impact: "needs_more_data",
        message: "Source citations and timestamps are required before scoring can promote an idea.",
      },
      {
        id: "paper_trade_evidence",
        passed: false,
        impact: "paper_trade_block",
        message: "Backtest or paper-trade evidence is required before paper-trade promotion.",
      },
    ],
    explanation: {
      summary: "Scored MSFT as momentum research with 81/100 confidence.",
      contributors: ["momentum: 78/100 - Mock trend strength is positive but still research-only."],
      assumptions: [
        "Scores are research signals only and are not guaranteed to predict returns.",
        "Risk score is a risk-control quality score where higher means safer controls.",
      ],
      blocks: ["Backtest or paper-trade evidence is required before paper-trade promotion."],
    },
  },
};

const fallbackPaperTrading: PaperTradeResponse = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Mock paper-trade decisions are contract evaluations and are not persisted.",
  },
  result: {
    status: "accepted",
    reasonCodes: [],
    trade: {
      mode: "paper",
      liveTradingEnabled: false,
      brokerExecution: false,
      ticker: "MSFT",
      instrumentType: "stock",
      status: "open",
      risk: {
        maxLoss: 300,
        riskPctOfEquity: 0.3,
      },
    },
  },
};

const fallbackPaperClose: PaperTradeCloseResponse = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Mock paper-trade close dry runs use an in-memory ledger only.",
  },
  closeResult: {
    status: "accepted",
    reasonCodes: [],
    trade: {
      mode: "paper",
      liveTradingEnabled: false,
      brokerExecution: false,
      ticker: "MSFT",
      instrumentType: "stock",
      status: "closed",
      entryPrice: 100,
      exitPrice: 106,
      quantity: 10,
      realizedPnl: 60,
      realizedReturnPct: 6,
      lessons: ["Mock paper trade followed through before the time stop."],
      exitAudit: {
        auditLogId: "audit_mock_paper_close_1",
        priceTimestamp: "2026-05-29T12:00:00.000Z",
      },
    },
  },
  persistedInMemory: {
    recommendations: 1,
    auditLogs: 4,
    paperTrades: 1,
  },
  ledger: {
    status: "closed",
    exitAuditLogId: "audit_mock_paper_close_1",
    exitPrice: 106,
    lessonsLearned: "Mock paper trade followed through before the time stop.",
  },
};

const fallbackPaperEvidence: PaperTradeEvidenceSummaryResponse = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Mock paper-trade evidence summary data is generated in memory.",
  },
  summary: {
    mode: "paper",
    liveTradingEnabled: false,
    brokerExecution: false,
    notRecommendation: true,
    status: "accepted",
    reviewStatus: "needs_more_data",
    reasonCodes: ["insufficient_closed_trades"],
    totalTrades: 3,
    openTrades: 1,
    closedTrades: 2,
    winningTrades: 1,
    losingTrades: 1,
    winRatePct: 50,
    realizedPnl: 10,
    averageReturnPct: 0.5,
    averageRiskPctOfEquity: 0.3,
    largestWin: 60,
    largestLoss: -50,
    closedTradeAuditLogIds: ["audit_mock_paper_close_1", "audit_mock_paper_close_loss_1"],
    notes: [
      "Paper-trade evidence is a validation input, not a recommendation or performance promise.",
    ],
  },
};

const fallbackPaperReadModel: PaperTradeReadModelResponse = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Dry-run paper-trade read model data is discarded after the response.",
  },
  persistedInMemory: {
    recommendations: 1,
    auditLogs: 4,
    paperTrades: 1,
  },
  trades: [
    {
      id: "paper_rec-MSFT-paper-mock-1_20260528T150000000Z",
      recommendationId: "rec-MSFT-paper-mock-1",
      accountId: "paper_account_mock",
      mode: "paper",
      status: "closed",
      ticker: "MSFT",
      instrumentType: "stock",
      strategyVersionId: "momentum-v0",
      thesisSnapshot: "Mock stock-only paper trade candidate for contract evaluation.",
      entryReason: "Mock API read-model dry-run accepted a simulated stock paper entry.",
      downsideScenario: "Shares close below the mock breakout level.",
      invalidationConditions: ["Close below mock breakout level"],
      liveTradingEnabled: false,
      brokerExecution: false,
      audit: {
        operatorApprovalAuditLogId: "audit_mock_paper_open_1",
        entryAuditLogId: "audit_mock_paper_entry_1",
        exitAuditLogId: "audit_mock_paper_close_1",
      },
      entry: {
        type: "market",
        requestedPrice: 100,
        simulatedPrice: 100,
        quantity: 10,
        enteredAt: "2026-05-28T15:00:00.000Z",
        stopLoss: 95,
        profitTarget: 108,
        timeStopAt: "2026-06-11T20:00:00.000Z",
      },
      risk: {
        maxLossAmount: 300,
        riskPctOfEquity: 0.3,
        accountEquityAtEntry: 100000,
        singleNameExposurePct: 2,
        sectorExposurePct: 8,
        correlatedExposurePct: 4,
        dailyLossPctAtEntry: 0.1,
      },
      outcome: {
        closedAt: "2026-05-29T12:00:00.000Z",
        exitPrice: 106,
        exitReason: "Mock profit-target review hit during paper-trade validation.",
        lessonsLearned: "Mock paper trade followed through before the time stop.",
        realizedPnl: 60,
        realizedReturnPct: 6,
      },
      createdAt: "2026-05-28T15:00:00.000Z",
      updatedAt: "2026-05-29T12:00:00.000Z",
    },
  ],
};

const fallbackEvidenceDetail: EvidenceDetailResponse = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  persistence: {
    scope: "in_memory",
    durable: false,
    note: "Dry-run evidence detail data is discarded after the response.",
  },
  persistedInMemory: {
    recommendations: 2,
    auditLogs: 5,
    paperTrades: 1,
  },
  evidenceDetail: {
    notRecommendation: true,
    evidenceGate: "verified",
    reasonCodes: [],
    recommendation: {
      id: "rec-MSFT-paper-candidate-1",
      ticker: "MSFT",
      instrumentType: "stock",
      strategyVersionId: "momentum-v0",
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      thesis: "Mock stock-only paper trade candidate for contract evaluation.",
      bullCase: "Mock trend evidence and liquidity support a paper-only entry test.",
      bearCase: "Trend may reverse before a paper entry can validate the thesis.",
      downsideScenario: "Shares close below the mock breakout level.",
      invalidationConditions: ["Close below mock breakout level"],
      whySystemMightBeWrong: "Mock data may not represent real market behavior.",
      scores: {
        risk: 86,
        confidence: 78,
        liquidity: 86,
      },
      evidenceIds: {
        backtestRunId: null,
        paperTradeEvidenceId: "paper_rec-MSFT-paper-mock-1_20260528T150000000Z",
      },
    },
    citations: [
      {
        title: "Mock daily price history",
        url: "https://example.test/mock/msft/prices",
        source: "mock-provider",
        publishedAt: "2026-05-28T14:00:00.000Z",
        retrievedAt: "2026-05-28T14:30:00.000Z",
      },
    ],
    dataFreshness: {
      status: "fresh",
      asOf: "2026-05-28T14:30:00.000Z",
      notes: [],
    },
    evidence: [
      {
        kind: "paper_trade",
        id: "paper_rec-MSFT-paper-mock-1_20260528T150000000Z",
        status: "verified",
        reasonCodes: [],
        ticker: "MSFT",
        instrumentType: "stock",
        strategyVersionId: "momentum-v0",
        closedAt: "2026-05-29T12:00:00.000Z",
        liveTradingEnabled: false,
        brokerExecution: false,
        realizedPnl: 60,
        realizedReturnPct: 6,
      },
    ],
    auditTrail: [
      {
        id: "audit_mock_candidate_rec_1",
        eventType: "operator_decision",
        actorType: "operator",
        actorId: "operator:mock",
        occurredAt: "2026-05-29T12:10:00.000Z",
        subjectType: "recommendation",
        subjectId: "rec-MSFT-paper-candidate-1",
        riskDecision: "pass",
        operatorDecision: "paper_trade",
        operatorNotes: "Mock candidate recommendation references durable paper-trade evidence.",
      },
      {
        id: "audit_mock_paper_close_1",
        eventType: "paper_trade_closed",
        actorType: "system",
        actorId: "paper-trading",
        occurredAt: "2026-05-29T12:00:00.000Z",
        subjectType: "paper_trade",
        subjectId: "paper_rec-MSFT-paper-mock-1_20260528T150000000Z",
        riskDecision: "pass",
        operatorDecision: "paper_trade",
        operatorNotes: "Mock profit-target review hit during paper-trade validation.",
      },
    ],
  },
};

const decisionLabels: Record<Decision, string> = {
  watchlist: "Watchlist",
  paper_trade: "Paper Trade",
  avoid: "Avoid",
  needs_more_data: "Needs More Data",
};

const mvpDecisionLabels: Record<StrategyPolicy["mvpDecision"], string> = {
  test_now: "MVP Test Now",
  context_only: "Context Only",
  test_later: "Test Later",
  control_layer: "Control Layer",
};

const paperTradeStatusLabels: Record<PaperTradeResponse["result"]["status"], string> = {
  accepted: "Simulated Open",
  rejected: "Blocked",
};

const paperTradeCloseStatusLabels: Record<
  PaperTradeCloseResponse["closeResult"]["status"],
  string
> = {
  accepted: "Simulated Closed",
  rejected: "Close Blocked",
};

const paperEvidenceReviewLabels: Record<
  PaperTradeEvidenceSummaryResponse["summary"]["reviewStatus"],
  string
> = {
  needs_more_data: "Needs More Data",
  ready_for_review: "Ready for Review",
  blocked: "Blocked",
};

const paperReadStatusLabels: Record<
  PaperTradeReadModelResponse["trades"][number]["status"],
  string
> = {
  open: "Persisted Open",
  closed: "Persisted Closed",
  cancelled: "Persisted Cancelled",
};

const evidenceGateLabels: Record<EvidenceDetailResponse["evidenceDetail"]["evidenceGate"], string> =
  {
    verified: "Verified Evidence",
    needs_more_data: "Needs More Data",
    blocked: "Evidence Blocked",
  };

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2).replace(/\.?0+$/, "")}%`;
}

function ScoreMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-meter">
      <div className="score-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="meter-track" aria-hidden="true">
        <div className="meter-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function App() {
  const [apiState, setApiState] = useState<ApiState>("loading");
  const [scoring, setScoring] = useState<MockScoringResponse>(fallbackScoring);
  const [paperTrading, setPaperTrading] = useState<PaperTradeResponse>(fallbackPaperTrading);
  const [paperClose, setPaperClose] = useState<PaperTradeCloseResponse>(fallbackPaperClose);
  const [paperEvidence, setPaperEvidence] =
    useState<PaperTradeEvidenceSummaryResponse>(fallbackPaperEvidence);
  const [paperReadModel, setPaperReadModel] =
    useState<PaperTradeReadModelResponse>(fallbackPaperReadModel);
  const [evidenceDetail, setEvidenceDetail] =
    useState<EvidenceDetailResponse>(fallbackEvidenceDetail);

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        const [
          scoringResponse,
          paperTradingResponse,
          paperCloseResponse,
          paperEvidenceResponse,
          paperReadModelResponse,
          evidenceDetailResponse,
        ] = await Promise.all([
          fetch(scoringEndpoint),
          fetch(paperTradingEndpoint),
          fetch(paperTradeCloseEndpoint, { method: "POST" }),
          fetch(paperTradeEvidenceEndpoint),
          fetch(paperTradeReadModelEndpoint, { method: "POST" }),
          fetch(evidenceDetailEndpoint),
        ]);
        if (!scoringResponse.ok) {
          throw new Error(`Scoring API returned ${scoringResponse.status}`);
        }
        if (!paperTradingResponse.ok) {
          throw new Error(`Paper-trading API returned ${paperTradingResponse.status}`);
        }
        if (!paperCloseResponse.ok) {
          throw new Error(`Paper-trade close API returned ${paperCloseResponse.status}`);
        }
        if (!paperEvidenceResponse.ok) {
          throw new Error(`Paper-trade evidence API returned ${paperEvidenceResponse.status}`);
        }
        if (!paperReadModelResponse.ok) {
          throw new Error(`Paper-trade read model API returned ${paperReadModelResponse.status}`);
        }
        if (!evidenceDetailResponse.ok) {
          throw new Error(`Evidence detail API returned ${evidenceDetailResponse.status}`);
        }
        const scoringBody = (await scoringResponse.json()) as MockScoringResponse;
        const paperTradingBody = (await paperTradingResponse.json()) as PaperTradeResponse;
        const paperCloseBody = (await paperCloseResponse.json()) as PaperTradeCloseResponse;
        const paperEvidenceBody =
          (await paperEvidenceResponse.json()) as PaperTradeEvidenceSummaryResponse;
        const paperReadModelBody =
          (await paperReadModelResponse.json()) as PaperTradeReadModelResponse;
        const evidenceDetailBody = (await evidenceDetailResponse.json()) as EvidenceDetailResponse;
        if (active) {
          setScoring(scoringBody);
          setPaperTrading(paperTradingBody);
          setPaperClose(paperCloseBody);
          setPaperEvidence(paperEvidenceBody);
          setPaperReadModel(paperReadModelBody);
          setEvidenceDetail(evidenceDetailBody);
          setApiState("online");
        }
      } catch {
        if (active) {
          setScoring(fallbackScoring);
          setPaperTrading(fallbackPaperTrading);
          setPaperClose(fallbackPaperClose);
          setPaperEvidence(fallbackPaperEvidence);
          setPaperReadModel(fallbackPaperReadModel);
          setEvidenceDetail(fallbackEvidenceDetail);
          setApiState("offline");
        }
      }
    }

    void loadDashboardData();

    return () => {
      active = false;
    };
  }, []);

  const failedGates = scoring.result.gates.filter((gate) => !gate.passed);
  const paperTrade = paperTrading.result.trade;
  const paperCloseTrade = paperClose.closeResult.trade;
  const closeLesson =
    paperCloseTrade?.lessons[0] ?? paperClose.ledger?.lessonsLearned ?? "Close review is blocked.";
  const paperEvidenceSummary = paperEvidence.summary;
  const evidenceNote =
    paperEvidenceSummary.notes[0] ??
    "Paper-trade evidence remains a validation input, not a recommendation.";
  const fallbackLedgerTrade = fallbackPaperReadModel.trades[0];
  if (fallbackLedgerTrade === undefined) {
    throw new Error("Fallback paper-trade read model requires one trade.");
  }
  const ledgerTrade = paperReadModel.trades[0] ?? fallbackLedgerTrade;
  const ledgerOutcome = ledgerTrade?.outcome;
  const ledgerAuditId = ledgerTrade?.audit.exitAuditLogId ?? ledgerTrade?.audit.entryAuditLogId;
  const ledgerLesson =
    ledgerOutcome?.lessonsLearned ?? "Persisted paper-trade readback is still open.";
  const evidence = evidenceDetail.evidenceDetail;
  const firstCitation = evidence.citations[0];
  const firstEvidenceItem = evidence.evidence[0];
  const paperEvidenceItem =
    evidence.evidence.find((item) => item.kind === "paper_trade") ?? firstEvidenceItem;
  const firstAuditEvent = evidence.auditTrail[0];
  const lastAuditEvent = evidence.auditTrail[evidence.auditTrail.length - 1];
  const isOffline = apiState === "offline";
  const isOnline = apiState === "online";
  const evidenceReasonText =
    evidence.reasonCodes.length > 0 ? evidence.reasonCodes.join(", ") : "No evidence reason codes";
  const paperEvidencePnl =
    paperEvidenceItem?.status === "verified" && paperEvidenceItem.realizedPnl !== undefined
      ? formatCurrency(paperEvidenceItem.realizedPnl)
      : "Unavailable";
  const paperTradeGateLabel =
    failedGates.length > 0
      ? "Blocked pending evidence"
      : scoring.result.strategyPolicy.paperTradeAllowed
        ? "Allowed by Policy"
        : "Blocked";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Milestone 6</p>
          <h1>StockMarket Operator Console</h1>
        </div>
        <span className="status-pill">Mock Only</span>
      </header>

      <section className="summary-band">
        <p>Research first. Paper trading first. Live trading prohibited.</p>
        <p>No good trades today is a valid outcome.</p>
      </section>

      <section className="kpi-row" aria-label="System safety status">
        <div className="kpi">
          <span>API Status</span>
          <strong>
            {apiState === "loading"
              ? "Loading"
              : apiState === "online"
                ? "API online"
                : "API offline"}
          </strong>
        </div>
        <div className="kpi">
          <span>Provider Keys</span>
          <strong>No provider keys required</strong>
        </div>
        <div className="kpi">
          <span>Live Trading</span>
          <strong>{scoring.liveTradingEnabled ? "Enabled" : "Disabled"}</strong>
        </div>
        <div className="kpi">
          <span>Decision</span>
          <strong>
            {isOffline
              ? "No operational decision"
              : isOnline
                ? decisionLabels[scoring.result.decision]
                : "Loading"}
          </strong>
        </div>
      </section>

      {isOffline ? (
        <section className="dashboard-grid" aria-label="Operator scoring dashboard">
          <article className="panel panel-large">
            <p className="eyebrow">Data unavailable</p>
            <h2>Operational data unavailable</h2>
            <p className="panel-copy">
              Sample trade metrics are hidden until the local API responds.
            </p>
            <p className="panel-copy">
              Keep live trading disabled and treat the dashboard as unavailable, not as a stale
              recommendation.
            </p>
          </article>
        </section>
      ) : !isOnline ? (
        <section className="dashboard-grid" aria-label="Operator scoring dashboard">
          <article className="panel panel-large">
            <p className="eyebrow">Loading</p>
            <h2>Loading operational data</h2>
            <p className="panel-copy">
              Evidence and paper-trade metrics stay hidden until the local API responds.
            </p>
          </article>
        </section>
      ) : (
        <section className="dashboard-grid" aria-label="Operator scoring dashboard">
          <article className="panel panel-large">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Mock scoring evaluation</p>
                <h2>
                  {scoring.result.ticker} {decisionLabels[scoring.result.decision]}
                </h2>
              </div>
              <span className="status-pill subtle">API snapshot</span>
            </div>
            <p className="panel-copy">{scoring.result.explanation.summary}</p>
            <div className="policy-strip" aria-label="Strategy policy">
              <div>
                <span>Strategy Policy</span>
                <strong>{scoring.result.strategyPolicy.label}</strong>
              </div>
              <div>
                <span>MVP Status</span>
                <strong>{mvpDecisionLabels[scoring.result.strategyPolicy.mvpDecision]}</strong>
              </div>
              <div>
                <span>Paper Trade Gate</span>
                <strong>{paperTradeGateLabel}</strong>
              </div>
            </div>
            <div className="score-grid" aria-label="Score summary">
              <ScoreMeter label="Risk Controls" value={scoring.result.scores.risk} />
              <ScoreMeter label="Confidence" value={scoring.result.scores.confidence} />
              <ScoreMeter label="Liquidity" value={scoring.result.scores.liquidity} />
            </div>
          </article>

          <article className="panel">
            <p className="eyebrow">Promotion gates</p>
            <h2>Evidence Blockers</h2>
            <ul className="gate-list">
              {scoring.result.gates.map((gate) => (
                <li key={gate.id} className={gate.passed ? "gate-pass" : "gate-fail"}>
                  <span>{gate.passed ? "Pass" : "Block"}</span>
                  <p>{gate.message}</p>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <p className="eyebrow">Research status</p>
            <h2>{scoring.notRecommendation ? "Not a Recommendation" : "Review Required"}</h2>
            <p className="panel-copy">{scoring.result.explanation.assumptions[0]}</p>
            <p className="panel-copy">
              {failedGates.length > 0 ? failedGates[0]?.message : "All displayed gates pass."}
            </p>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Paper Trade Contract</p>
                <h2>{paperTradeStatusLabels[paperTrading.result.status]}</h2>
              </div>
              <span className="status-pill subtle">Paper API snapshot</span>
            </div>
            <div className="trade-strip" aria-label="Paper trade risk summary">
              <div>
                <span>Mode</span>
                <strong>{paperTrade?.mode === "paper" ? "Paper Only" : "Review"}</strong>
              </div>
              <div>
                <span>Max Loss</span>
                <strong>{formatCurrency(paperTrade?.risk.maxLoss ?? 0)}</strong>
              </div>
              <div>
                <span>Risk</span>
                <strong>{paperTrade?.risk.riskPctOfEquity ?? 0}%</strong>
              </div>
            </div>
            <p className="panel-copy">
              {paperTrade?.brokerExecution === false
                ? "No broker execution or durable paper-trade record is created by this mock check."
                : "Paper-trade contract review is blocked."}
            </p>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Paper Trade Outcome</p>
                <h2>{paperTradeCloseStatusLabels[paperClose.closeResult.status]}</h2>
              </div>
              <span className="status-pill subtle">Paper close API snapshot</span>
            </div>
            <div className="outcome-strip" aria-label="Paper trade performance summary">
              <div>
                <span>P/L</span>
                <strong>{formatCurrency(paperCloseTrade?.realizedPnl ?? 0)}</strong>
              </div>
              <div>
                <span>Return</span>
                <strong>{formatPercent(paperCloseTrade?.realizedReturnPct ?? 0)}</strong>
              </div>
              <div>
                <span>Exit</span>
                <strong>{formatCurrency(paperCloseTrade?.exitPrice ?? 0)}</strong>
              </div>
            </div>
            <p className="panel-copy">{closeLesson}</p>
            <p className="panel-copy">
              {paperCloseTrade?.brokerExecution === false
                ? "Close audit is linked to the in-memory ledger; no broker execution occurred."
                : "Paper-trade close review is blocked."}
            </p>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Paper Trade Evidence</p>
                <h2>{paperEvidenceReviewLabels[paperEvidenceSummary.reviewStatus]}</h2>
              </div>
              <span className="status-pill subtle">Evidence API snapshot</span>
            </div>
            <div className="evidence-strip" aria-label="Paper trade evidence summary">
              <div>
                <span>Closed</span>
                <strong>{paperEvidenceSummary.closedTrades}</strong>
              </div>
              <div>
                <span>Open</span>
                <strong>{paperEvidenceSummary.openTrades}</strong>
              </div>
              <div>
                <span>Win Rate</span>
                <strong>{formatPercent(paperEvidenceSummary.winRatePct)}</strong>
              </div>
            </div>
            <div
              className="evidence-strip evidence-strip-secondary"
              aria-label="Paper trade evidence performance"
            >
              <div>
                <span>Realized</span>
                <strong>{formatCurrency(paperEvidenceSummary.realizedPnl)}</strong>
              </div>
              <div>
                <span>Avg Return</span>
                <strong>{formatPercent(paperEvidenceSummary.averageReturnPct)}</strong>
              </div>
              <div>
                <span>Avg Risk</span>
                <strong>{formatPercent(paperEvidenceSummary.averageRiskPctOfEquity)}</strong>
              </div>
            </div>
            <p className="panel-copy">{evidenceNote}</p>
            <p className="panel-copy">
              Backtest and operator review remain required before strategy promotion.
            </p>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Paper Trade Ledger</p>
                <h2>{paperReadStatusLabels[ledgerTrade.status]}</h2>
              </div>
              <span className="status-pill subtle">Ledger API snapshot</span>
            </div>
            <div className="evidence-strip" aria-label="Paper trade ledger readback">
              <div>
                <span>Audit</span>
                <strong>{ledgerAuditId}</strong>
              </div>
              <div>
                <span>P/L</span>
                <strong>{formatCurrency(ledgerOutcome?.realizedPnl ?? 0)}</strong>
              </div>
              <div>
                <span>Risk</span>
                <strong>{formatPercent(ledgerTrade.risk.riskPctOfEquity)}</strong>
              </div>
            </div>
            <div
              className="evidence-strip evidence-strip-secondary"
              aria-label="Paper trade ledger prices"
            >
              <div>
                <span>Entry</span>
                <strong>{formatCurrency(ledgerTrade.entry.simulatedPrice)}</strong>
              </div>
              <div>
                <span>Exit</span>
                <strong>{formatCurrency(ledgerOutcome?.exitPrice ?? 0)}</strong>
              </div>
              <div>
                <span>Return</span>
                <strong>{formatPercent(ledgerOutcome?.realizedReturnPct ?? 0)}</strong>
              </div>
            </div>
            <p className="panel-copy">{ledgerLesson}</p>
            <p className="panel-copy">
              {ledgerTrade.brokerExecution === false
                ? "Read model preserves paper-only ledger state; no broker execution occurred."
                : "Paper-trade read model review is blocked."}
            </p>
          </article>

          <article className="panel panel-large">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Evidence Detail</p>
                <h2>{evidenceGateLabels[evidence.evidenceGate]}</h2>
              </div>
              <span className="status-pill subtle">Resolver API snapshot</span>
            </div>
            <div className="evidence-strip" aria-label="Evidence resolver status">
              <div>
                <span>Evidence</span>
                <strong>{firstEvidenceItem?.status ?? "missing"}</strong>
              </div>
              <div>
                <span>Source</span>
                <strong>{firstCitation?.source ?? "missing"}</strong>
              </div>
              <div>
                <span>Fresh As Of</span>
                <strong>{evidence.dataFreshness.asOf}</strong>
              </div>
            </div>
            <div className="evidence-strip evidence-strip-secondary" aria-label="Citation timing">
              <div>
                <span>Published</span>
                <strong>{firstCitation?.publishedAt ?? "missing"}</strong>
              </div>
              <div>
                <span>Retrieved</span>
                <strong>{firstCitation?.retrievedAt ?? "missing"}</strong>
              </div>
              <div>
                <span>Paper P/L</span>
                <strong>{paperEvidencePnl}</strong>
              </div>
            </div>
            <p className="panel-copy">{evidence.recommendation.downsideScenario}</p>
            <p className="panel-copy">
              {evidence.recommendation.invalidationConditions.join("; ")}
            </p>
            <div className="evidence-strip evidence-strip-secondary" aria-label="Audit trail">
              <div>
                <span>Decision Audit</span>
                <strong>{firstAuditEvent?.eventType ?? "missing"}</strong>
              </div>
              <div>
                <span>Latest Audit</span>
                <strong>{lastAuditEvent?.eventType ?? "missing"}</strong>
              </div>
              <div>
                <span>Evidence ID</span>
                <strong>{paperEvidenceItem?.id ?? "missing"}</strong>
              </div>
            </div>
            <ul className="gate-list" aria-label="Evidence items">
              {evidence.evidence.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className={item.status === "verified" ? "gate-pass" : "gate-fail"}
                >
                  <span>{item.kind}</span>
                  <p>
                    {item.id} - {item.status}
                    {item.reasonCodes.length > 0 ? ` - ${item.reasonCodes.join(", ")}` : ""}
                  </p>
                </li>
              ))}
            </ul>
            <p className="panel-copy">{evidenceReasonText}</p>
            <div className="decision-actions" aria-label="Operator decision actions">
              <button type="button" disabled>
                Watchlist
              </button>
              <button type="button" disabled>
                Paper Trade
              </button>
              <button type="button" disabled>
                Avoid
              </button>
              <button type="button" disabled>
                Needs More Data
              </button>
            </div>
            <p className="panel-copy">
              Operator actions stay disabled until audit-backed decision writes are implemented.
            </p>
          </article>
        </section>
      )}
    </main>
  );
}
