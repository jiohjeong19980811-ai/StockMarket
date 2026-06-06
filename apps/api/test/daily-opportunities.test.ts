import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("mock daily opportunities route", () => {
  it("returns a mock daily opportunity report without provider keys or live trading", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/opportunities/mock-daily-dry-run",
      });

      expect(response.statusCode, response.body).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: false,
        providerKeysRequired: [],
        notRecommendation: true,
        report: {
          mode: "mock",
          outcome: "ranked_opportunities",
          notRecommendation: true,
          liveTradingEnabled: false,
          providerKeysRequired: [],
          opportunityCount: 1,
          opportunities: [
            {
              ticker: "MSFT",
              decision: "paper_trade",
              downsideScenario: "Shares close below the mock breakout level.",
              invalidationConditions: ["Close below mock breakout level"],
              dataFreshness: {
                asOf: "2026-05-28T14:30:00.000Z",
              },
              sourceCitations: [
                {
                  title: "Mock daily price history",
                  retrievedAt: "2026-05-28T14:30:00.000Z",
                },
              ],
              evidence: {
                gate: "verified",
                ids: ["bt_mock_momentum_1"],
              },
            },
          ],
        },
      });
      expect(body.report.noGoodTrades).toBeNull();
      expect(body.report.opportunities[0].scores).toMatchObject({
        risk: expect.any(Number),
        confidence: expect.any(Number),
        liquidity: expect.any(Number),
      });
    } finally {
      await server.close();
    }
  });

  it("persists a mock daily opportunity report through the history dry run", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/opportunities/mock-history-dry-run",
      });

      expect(response.statusCode, response.body).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: false,
        providerKeysRequired: [],
        notRecommendation: true,
        persistence: {
          scope: "in_memory",
          durable: false,
        },
        persistedInMemory: {
          dailyOpportunityReports: 1,
          dailyOpportunityReportRecommendations: 1,
          recommendations: 1,
        },
        reports: [
          {
            id: "daily_mock_20260528",
            outcome: "ranked_opportunities",
            notRecommendation: true,
            liveTradingEnabled: false,
            providerKeysRequired: [],
            opportunityCount: 1,
            recommendations: [
              {
                id: "candidate-MSFT-momentum-daily-1",
                reportRank: 1,
                ticker: "MSFT",
                decision: "paper_trade",
                evidenceGate: "verified",
                evidenceIds: {
                  backtestRunId: "bt_mock_momentum_1",
                  paperTradeEvidenceId: null,
                },
                sourceCitations: [
                  {
                    title: "Mock daily price history",
                    retrievedAt: "2026-05-28T14:30:00.000Z",
                  },
                ],
              },
            ],
          },
        ],
      });
      expect("brokerExecution" in body.reports[0].recommendations[0]).toBe(false);
      expect("liveTradingEnabled" in body.reports[0].recommendations[0]).toBe(false);
    } finally {
      await server.close();
    }
  });

  it("runs a mock opportunity decision dry run with audit metadata and no broker execution", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/opportunities/mock-decision-dry-run",
      });

      expect(response.statusCode, response.body).toBe(200);
      const body = response.json();
      expect(body).toMatchObject({
        mode: "mock",
        requiresEnv: false,
        liveTradingEnabled: false,
        providerKeysRequired: [],
        notRecommendation: true,
        persistence: {
          scope: "in_memory",
          durable: false,
        },
        persistedInMemory: {
          dailyOpportunityReports: 1,
          dailyOpportunityReportRecommendations: 1,
          recommendations: 1,
          auditLogs: 2,
        },
        decision: {
          status: "accepted",
          candidateId: "candidate-MSFT-momentum-daily-1",
          ticker: "MSFT",
          operatorDecision: "paper_trade",
          mode: "paper",
          notRecommendation: true,
          liveTradingEnabled: false,
          brokerExecution: false,
          reasonCodes: [],
          evidenceGate: "verified",
          downsideScenario: "Shares close below the mock breakout level.",
          invalidationConditions: ["Close below mock breakout level"],
          audit: {
            auditLogId: "audit_mock_opportunity_decision_1",
            eventType: "operator_decision",
            actorType: "operator",
            actorId: "operator:mock",
            occurredAt: "2026-05-28T15:10:00.000Z",
            subjectType: "recommendation",
            subjectId: "candidate-MSFT-momentum-daily-1",
            riskDecision: "pass",
            operatorDecision: "paper_trade",
          },
          sourceCitation: {
            title: "Mock daily price history",
            retrievedAt: "2026-05-28T14:30:00.000Z",
          },
          dataFreshness: {
            status: "fresh",
            asOf: "2026-05-28T14:30:00.000Z",
          },
        },
        safety: {
          paperOnly: true,
          noBrokerExecution: true,
          notFinancialAdvice: true,
          liveTradingEnabled: false,
        },
      });
      expect(body.decision.scores).toMatchObject({
        risk: expect.any(Number),
        confidence: expect.any(Number),
        liquidity: expect.any(Number),
      });
      expect("brokerOrder" in body.decision).toBe(false);
      expect("orderPlacement" in body.decision).toBe(false);
      expect(JSON.stringify(body)).not.toMatch(
        /liveTradingEnabled":true|brokerCredential|placeOrder/,
      );
    } finally {
      await server.close();
    }
  });

  it("records watchlist, avoid, and needs-more-data mock opportunity decisions", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false,
    });

    const expectedDecisions = [
      {
        decision: "watchlist",
        auditLogId: "audit_mock_opportunity_decision_watchlist",
        reasonCode: "operator_watchlist",
        riskDecision: "watchlist",
      },
      {
        decision: "avoid",
        auditLogId: "audit_mock_opportunity_decision_avoid",
        reasonCode: "operator_rejected",
        riskDecision: "avoid",
      },
      {
        decision: "needs_more_data",
        auditLogId: "audit_mock_opportunity_decision_needs_more_data",
        reasonCode: "operator_needs_more_data",
        riskDecision: "needs_more_data",
      },
    ] as const;

    try {
      for (const expected of expectedDecisions) {
        const response = await server.inject({
          method: "POST",
          url: "/opportunities/mock-decision-dry-run",
          payload: {
            decision: expected.decision,
          },
        });

        expect(response.statusCode, response.body).toBe(200);
        const body = response.json();
        expect(body).toMatchObject({
          mode: "mock",
          liveTradingEnabled: false,
          providerKeysRequired: [],
          notRecommendation: true,
          persistedInMemory: {
            dailyOpportunityReports: 1,
            dailyOpportunityReportRecommendations: 1,
            recommendations: 1,
            auditLogs: 2,
          },
          decision: {
            status: "accepted",
            candidateId: "candidate-MSFT-momentum-daily-1",
            ticker: "MSFT",
            operatorDecision: expected.decision,
            mode: "paper",
            notRecommendation: true,
            liveTradingEnabled: false,
            brokerExecution: false,
            reasonCodes: [expected.reasonCode],
            audit: {
              auditLogId: expected.auditLogId,
              eventType: "operator_decision",
              riskDecision: expected.riskDecision,
              operatorDecision: expected.decision,
            },
          },
          safety: {
            paperOnly: true,
            noBrokerExecution: true,
            notFinancialAdvice: true,
            liveTradingEnabled: false,
          },
        });
        expect("brokerOrder" in body.decision).toBe(false);
        expect("orderPlacement" in body.decision).toBe(false);
      }
    } finally {
      await server.close();
    }
  });
});
