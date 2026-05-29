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

type ApiState = "loading" | "online" | "offline";

const scoringEndpoint = "http://127.0.0.1:4000/scoring/mock-evaluation";
const paperTradingEndpoint = "http://127.0.0.1:4000/paper-trading/mock-decision";
const paperTradeCloseEndpoint = "http://127.0.0.1:4000/paper-trading/mock-close-dry-run";
const paperTradeEvidenceEndpoint = "http://127.0.0.1:4000/paper-trading/mock-evidence-summary";

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
        priceTimestamp: "2026-05-31T20:00:00.000Z",
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
    reviewStatus: "ready_for_review",
    reasonCodes: ["requires_backtest_and_operator_review"],
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

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        const [scoringResponse, paperTradingResponse, paperCloseResponse, paperEvidenceResponse] =
          await Promise.all([
            fetch(scoringEndpoint),
            fetch(paperTradingEndpoint),
            fetch(paperTradeCloseEndpoint, { method: "POST" }),
            fetch(paperTradeEvidenceEndpoint),
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
        const scoringBody = (await scoringResponse.json()) as MockScoringResponse;
        const paperTradingBody = (await paperTradingResponse.json()) as PaperTradeResponse;
        const paperCloseBody = (await paperCloseResponse.json()) as PaperTradeCloseResponse;
        const paperEvidenceBody =
          (await paperEvidenceResponse.json()) as PaperTradeEvidenceSummaryResponse;
        if (active) {
          setScoring(scoringBody);
          setPaperTrading(paperTradingBody);
          setPaperClose(paperCloseBody);
          setPaperEvidence(paperEvidenceBody);
          setApiState("online");
        }
      } catch {
        if (active) {
          setScoring(fallbackScoring);
          setPaperTrading(fallbackPaperTrading);
          setPaperClose(fallbackPaperClose);
          setPaperEvidence(fallbackPaperEvidence);
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Milestone 4</p>
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
          <strong>{decisionLabels[scoring.result.decision]}</strong>
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Operator scoring dashboard">
        <article className="panel panel-large">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Mock scoring evaluation</p>
              <h2>
                {scoring.result.ticker} {decisionLabels[scoring.result.decision]}
              </h2>
            </div>
            <span className="status-pill subtle">
              {apiState === "offline" ? "Fallback mock snapshot" : "API snapshot"}
            </span>
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
              <strong>
                {scoring.result.strategyPolicy.paperTradeAllowed ? "Allowed by Policy" : "Blocked"}
              </strong>
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
            <span className="status-pill subtle">
              {apiState === "offline" ? "Paper fallback snapshot" : "Paper API snapshot"}
            </span>
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
            <span className="status-pill subtle">
              {apiState === "offline"
                ? "Paper close fallback snapshot"
                : "Paper close API snapshot"}
            </span>
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
            <span className="status-pill subtle">
              {apiState === "offline" ? "Evidence fallback snapshot" : "Evidence API snapshot"}
            </span>
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
      </section>
    </main>
  );
}
