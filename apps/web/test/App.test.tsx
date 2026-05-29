import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";

const mockScoringBody = {
  mode: "mock",
  requiresEnv: false,
  liveTradingEnabled: false,
  providerKeysRequired: [],
  notRecommendation: true,
  result: {
    inputId: "mock-score-MSFT-momentum-watchlist",
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

const mockPaperTradingBody = {
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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("operator console shell", () => {
  it("shows research-first safety posture", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();
        const body = url.includes("paper-trading") ? mockPaperTradingBody : mockScoringBody;
        return new Response(JSON.stringify(body));
      }),
    );

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "StockMarket Operator Console" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Research first. Paper trading first. Live trading prohibited."),
    ).toBeInTheDocument();
    expect(screen.getByText("No good trades today is a valid outcome.")).toBeInTheDocument();
    expect(await screen.findByText("Watchlist")).toBeInTheDocument();
    expect(screen.getByText("No provider keys required")).toBeInTheDocument();
    expect(screen.getByText("Mock scoring evaluation")).toBeInTheDocument();
    expect(screen.getByText("Strategy Policy")).toBeInTheDocument();
    expect(screen.getByText("Momentum")).toBeInTheDocument();
    expect(screen.getByText("MVP Test Now")).toBeInTheDocument();
    expect(screen.getByText("Paper Trade Contract")).toBeInTheDocument();
    expect(screen.getByText("Simulated Open")).toBeInTheDocument();
    expect(screen.getByText("Max Loss")).toBeInTheDocument();
    expect(screen.getByText("$300")).toBeInTheDocument();
    expect(screen.getByText("Risk Controls")).toBeInTheDocument();
    expect(screen.getByText("83")).toBeInTheDocument();
  });

  it("keeps the dashboard usable when the API is offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("API offline");
      }),
    );

    render(<App />);

    expect(await screen.findByText("API offline")).toBeInTheDocument();
    expect(screen.getByText("Fallback mock snapshot")).toBeInTheDocument();
    expect(screen.getByText("Paper fallback snapshot")).toBeInTheDocument();
    expect(screen.getAllByText("Watchlist").length).toBeGreaterThan(0);
  });
});
