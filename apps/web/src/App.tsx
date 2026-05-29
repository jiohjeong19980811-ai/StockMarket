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

interface ScoringResult {
  ticker: string;
  decision: Decision;
  evidenceStatus: string;
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

type ApiState = "loading" | "online" | "offline";

const scoringEndpoint = "http://127.0.0.1:4000/scoring/mock-evaluation";

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

const decisionLabels: Record<Decision, string> = {
  watchlist: "Watchlist",
  paper_trade: "Paper Trade",
  avoid: "Avoid",
  needs_more_data: "Needs More Data",
};

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

  useEffect(() => {
    let active = true;

    async function loadScoring() {
      try {
        const response = await fetch(scoringEndpoint);
        if (!response.ok) {
          throw new Error(`Scoring API returned ${response.status}`);
        }
        const body = (await response.json()) as MockScoringResponse;
        if (active) {
          setScoring(body);
          setApiState("online");
        }
      } catch {
        if (active) {
          setScoring(fallbackScoring);
          setApiState("offline");
        }
      }
    }

    void loadScoring();

    return () => {
      active = false;
    };
  }, []);

  const failedGates = scoring.result.gates.filter((gate) => !gate.passed);

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
      </section>
    </main>
  );
}
