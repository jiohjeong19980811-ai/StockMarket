import type { Client } from "@libsql/client";

export type DailyOpportunityHistoryOutcome = "ranked_opportunities" | "no_good_trades";
export type DailyOpportunityHistoryDecision = "watchlist" | "paper_trade";
export type DailyOpportunityHistoryInstrumentType = "stock";
export type DailyOpportunityHistoryFreshnessStatus = "fresh" | "stale" | "partial" | "missing";

export interface DailyOpportunityHistoryCitation {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  retrievedAt: string;
}

export interface DailyOpportunityHistoryReportInput {
  id: string;
  generatedAt: string;
  outcome: DailyOpportunityHistoryOutcome;
  notRecommendation: true;
  liveTradingEnabled: false;
  providerKeysRequired: string[];
  disclaimer: string;
  reviewedCount: number;
  opportunityCount: number;
  opportunities: Array<{
    rank: number;
    id: string;
    ticker: string;
    instrumentType: string;
    strategyFamily: string;
    decision: DailyOpportunityHistoryDecision;
    scores: {
      risk: number;
      confidence: number;
      liquidity: number;
    };
    thesis: string;
    bullCase: string;
    bearCase: string;
    downsideScenario: string;
    invalidationConditions: string[];
    whySystemMightBeWrong: string;
    sourceCitations: DailyOpportunityHistoryCitation[];
    dataFreshness: {
      status: DailyOpportunityHistoryFreshnessStatus;
      asOf: string;
      notes: string[];
    };
    liquidity: {
      score: number;
      averageDailyDollarVolume?: number;
      spreadPercentOfMid?: number;
      passes: boolean;
    };
    evidence: {
      status: string;
      gate: "verified" | "needs_more_data" | "blocked";
      ids: string[];
    };
    gateSummary: Array<{
      id: string;
      passed: boolean;
      impact: "avoid" | "needs_more_data" | "paper_trade_block";
      message: string;
    }>;
    notRecommendation: true;
  }>;
  noGoodTrades: {
    message: "No good trades today.";
    reasonCodes: string[];
  } | null;
}

export interface PersistDailyOpportunityReportOptions {
  persistedAt: string;
  strategyVersionIds: Partial<Record<string, string>>;
}

export interface DailyRecommendationHistoryReadModel {
  reportRank: number;
  id: string;
  ticker: string;
  instrumentType: DailyOpportunityHistoryInstrumentType;
  strategyVersionId: string;
  decision: DailyOpportunityHistoryDecision;
  evidenceStatus: string;
  evidenceGate: "verified" | "needs_more_data" | "blocked";
  thesis: string;
  bullCase: string;
  bearCase: string;
  downsideScenario: string;
  invalidationConditions: string[];
  whySystemMightBeWrong: string;
  sourceCitations: DailyOpportunityHistoryCitation[];
  dataFreshness: {
    status: DailyOpportunityHistoryFreshnessStatus;
    asOf: string;
    notes: string[];
  };
  scores: {
    risk: number;
    confidence: number;
    liquidity: number;
  };
  evidenceIds: {
    backtestRunId: string | null;
    paperTradeEvidenceId: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DailyOpportunityReportHistoryReadModel {
  id: string;
  generatedAt: string;
  outcome: DailyOpportunityHistoryOutcome;
  reviewedCount: number;
  opportunityCount: number;
  providerKeysRequired: string[];
  disclaimer: string;
  noGoodTrades: {
    message: "No good trades today.";
    reasonCodes: string[];
  } | null;
  liveTradingEnabled: false;
  notRecommendation: true;
  recommendations: DailyRecommendationHistoryReadModel[];
  createdAt: string;
  updatedAt: string;
}

export interface ListPersistedDailyOpportunityReportsFilters {
  outcome?: DailyOpportunityHistoryOutcome;
  limit?: number;
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected ${key} to be a nonempty string.`);
  }
  return value;
}

function readOptionalString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`Expected ${key} to be a string or null.`);
  }
  return value.length === 0 ? null : value;
}

function readNumber(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Expected ${key} to be a finite number.`);
  }
  return value;
}

function readSafeFalse(row: Record<string, unknown>, key: string): false {
  if (readNumber(row, key) !== 0) {
    throw new Error(`Unsafe daily opportunity report has ${key} enabled.`);
  }
  return false;
}

function readSafeTrue(row: Record<string, unknown>, key: string): true {
  if (readNumber(row, key) !== 1) {
    throw new Error(`Daily opportunity report has ${key} disabled.`);
  }
  return true;
}

function parseStringArray(value: string, label: string): string[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new Error(`Expected ${label} to be a string array.`);
  }
  return parsed;
}

function normalizeOutcome(value: string): DailyOpportunityHistoryOutcome {
  if (value === "ranked_opportunities" || value === "no_good_trades") {
    return value;
  }
  throw new Error(`Unsupported daily opportunity outcome: ${value}`);
}

function normalizeDecision(value: string): DailyOpportunityHistoryDecision {
  if (value === "watchlist" || value === "paper_trade") {
    return value;
  }
  throw new Error(`Unsupported daily recommendation decision: ${value}`);
}

function normalizeInstrumentType(value: string): DailyOpportunityHistoryInstrumentType {
  if (value === "stock") {
    return value;
  }
  throw new Error(`Only stock daily opportunity history is supported in MVP: ${value}`);
}

function normalizeFreshnessStatus(value: string): DailyOpportunityHistoryFreshnessStatus {
  if (value === "fresh" || value === "stale" || value === "partial" || value === "missing") {
    return value;
  }
  throw new Error(`Unsupported daily recommendation freshness status: ${value}`);
}

function normalizeEvidenceGate(value: string): "verified" | "needs_more_data" | "blocked" {
  if (value === "verified" || value === "needs_more_data" || value === "blocked") {
    return value;
  }
  throw new Error(`Unsupported daily recommendation evidence gate: ${value}`);
}

function assertFiniteIsoTimestamp(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} must be a valid ISO timestamp.`);
  }
}

function assertSafeReport(report: DailyOpportunityHistoryReportInput, persistedAt: string): void {
  assertFiniteIsoTimestamp(report.generatedAt, "report.generatedAt");
  assertFiniteIsoTimestamp(persistedAt, "persistedAt");
  if (report.notRecommendation !== true) {
    throw new Error("Daily opportunity history requires notRecommendation output.");
  }
  if (report.liveTradingEnabled !== false) {
    throw new Error("Daily opportunity history cannot persist live-trading output.");
  }
  if (report.providerKeysRequired.length > 0) {
    throw new Error("Daily opportunity history dry runs cannot require provider keys.");
  }
  if (report.opportunityCount !== report.opportunities.length) {
    throw new Error("Daily opportunity count must match persisted opportunities.");
  }
  if (report.outcome === "ranked_opportunities" && report.opportunities.length === 0) {
    throw new Error("Ranked daily reports require at least one opportunity.");
  }
  if (report.outcome === "no_good_trades" && report.noGoodTrades === null) {
    throw new Error("No-good-trades reports require a no-good-trades payload.");
  }
}

function primaryCitation(
  opportunity: DailyOpportunityHistoryReportInput["opportunities"][number],
): DailyOpportunityHistoryCitation {
  const citation = opportunity.sourceCitations[0];
  if (citation === undefined) {
    throw new Error(`Daily opportunity ${opportunity.id} requires a primary citation.`);
  }
  return citation;
}

function strategyVersionIdFor(
  opportunity: DailyOpportunityHistoryReportInput["opportunities"][number],
  strategyVersionIds: Partial<Record<string, string>>,
): string {
  const strategyVersionId = strategyVersionIds[opportunity.strategyFamily];
  if (typeof strategyVersionId !== "string" || strategyVersionId.length === 0) {
    throw new Error(`Missing strategy version for ${opportunity.strategyFamily}.`);
  }
  return strategyVersionId;
}

function backtestRunIdFor(
  opportunity: DailyOpportunityHistoryReportInput["opportunities"][number],
): string | null {
  if (opportunity.decision !== "paper_trade") {
    return opportunity.evidence.ids[0] ?? null;
  }
  const evidenceId = opportunity.evidence.ids[0];
  if (opportunity.evidence.gate !== "verified" || evidenceId === undefined) {
    throw new Error(`Paper-trade daily opportunity ${opportunity.id} needs verified evidence.`);
  }
  return evidenceId;
}

function riskDecisionFor(
  opportunity: DailyOpportunityHistoryReportInput["opportunities"][number],
): "pass" | "fail" {
  return opportunity.gateSummary.some((gate) => !gate.passed && gate.impact === "avoid")
    ? "fail"
    : "pass";
}

function auditLogIdFor(reportId: string, recommendationId: string): string {
  return `audit_${reportId}_${recommendationId}`.replace(/[^A-Za-z0-9_-]/g, "_");
}

export async function persistDailyOpportunityReport(
  client: Client,
  report: DailyOpportunityHistoryReportInput,
  options: PersistDailyOpportunityReportOptions,
): Promise<DailyOpportunityHistoryReportInput> {
  assertSafeReport(report, options.persistedAt);

  const statements = [
    {
      sql: `INSERT INTO daily_opportunity_reports
        (id, generated_at, outcome, reviewed_count, opportunity_count,
         provider_keys_required_json, disclaimer, no_good_message,
         no_good_reason_codes_json, live_trading_enabled, not_recommendation,
         created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        report.id,
        report.generatedAt,
        report.outcome,
        report.reviewedCount,
        report.opportunityCount,
        json(report.providerKeysRequired),
        report.disclaimer,
        report.noGoodTrades?.message ?? null,
        json(report.noGoodTrades?.reasonCodes ?? []),
        0,
        1,
        options.persistedAt,
        options.persistedAt,
      ],
    },
  ];

  for (const opportunity of report.opportunities) {
    const citation = primaryCitation(opportunity);
    const strategyVersionId = strategyVersionIdFor(opportunity, options.strategyVersionIds);
    const auditLogId = auditLogIdFor(report.id, opportunity.id);
    const backtestRunId = backtestRunIdFor(opportunity);
    const riskDecision = riskDecisionFor(opportunity);
    const liquidityDecision =
      opportunity.liquidity.passes && opportunity.liquidity.score >= 70 ? "pass" : "fail";

    if (opportunity.instrumentType !== "stock") {
      throw new Error("Daily opportunity history is stock-only for the MVP.");
    }

    statements.push(
      {
        sql: `INSERT INTO audit_logs
          (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id,
           pipeline_run_id, strategy_version_id, risk_decision, operator_decision, operator_notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          auditLogId,
          "daily_opportunity_generated",
          "system",
          "daily-opportunity-generator",
          report.generatedAt,
          "recommendation",
          opportunity.id,
          report.id,
          strategyVersionId,
          riskDecision,
          opportunity.decision,
          "Mock daily opportunity history persistence.",
        ],
      },
      {
        sql: `INSERT INTO recommendations
          (id, ticker, instrument_type, strategy_version_id, decision, evidence_status,
           evidence_gate, thesis, bull_case, bear_case, downside_scenario,
           invalidation_conditions_json, why_system_might_be_wrong,
           primary_citation_title, primary_citation_url, primary_citation_source,
           primary_citation_published_at, primary_citation_retrieved_at,
           freshness_status, freshness_as_of, freshness_notes_json,
           risk_score, confidence_score, liquidity_score, liquidity_decision,
           risk_decision, backtest_run_id, paper_trade_evidence_id,
           operator_audit_log_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          opportunity.id,
          opportunity.ticker,
          opportunity.instrumentType,
          strategyVersionId,
          opportunity.decision,
          opportunity.evidence.status,
          opportunity.evidence.gate,
          opportunity.thesis,
          opportunity.bullCase,
          opportunity.bearCase,
          opportunity.downsideScenario,
          json(opportunity.invalidationConditions),
          opportunity.whySystemMightBeWrong,
          citation.title,
          citation.url,
          citation.source,
          citation.publishedAt,
          citation.retrievedAt,
          opportunity.dataFreshness.status,
          opportunity.dataFreshness.asOf,
          json(opportunity.dataFreshness.notes),
          opportunity.scores.risk,
          opportunity.scores.confidence,
          opportunity.scores.liquidity,
          liquidityDecision,
          riskDecision,
          backtestRunId,
          null,
          auditLogId,
          options.persistedAt,
          options.persistedAt,
        ],
      },
      ...opportunity.sourceCitations.slice(1).map((extraCitation, index) => ({
        sql: `INSERT INTO recommendation_citations
          (id, recommendation_id, title, url, source, published_at, retrieved_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `${opportunity.id}_citation_${index + 2}`,
          opportunity.id,
          extraCitation.title,
          extraCitation.url,
          extraCitation.source,
          extraCitation.publishedAt,
          extraCitation.retrievedAt,
        ],
      })),
      {
        sql: `INSERT INTO daily_opportunity_report_recommendations
          (id, daily_report_id, recommendation_id, report_rank, created_at)
          VALUES (?, ?, ?, ?, ?)`,
        args: [
          `${report.id}_${opportunity.id}`,
          report.id,
          opportunity.id,
          opportunity.rank,
          options.persistedAt,
        ],
      },
    );
  }

  await client.batch(statements, "write");
  return report;
}

const dailyReportReadColumns = `
  id, generated_at, outcome, reviewed_count, opportunity_count,
  provider_keys_required_json, disclaimer, no_good_message,
  no_good_reason_codes_json, live_trading_enabled, not_recommendation,
  created_at, updated_at
`;

async function loadExtraCitations(
  client: Client,
  recommendationId: string,
): Promise<DailyOpportunityHistoryCitation[]> {
  const result = await client.execute({
    sql: `SELECT title, url, source, published_at, retrieved_at
      FROM recommendation_citations
      WHERE recommendation_id = ?
      ORDER BY id ASC`,
    args: [recommendationId],
  });

  return result.rows.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      title: readString(record, "title"),
      url: readString(record, "url"),
      source: readString(record, "source"),
      publishedAt: readString(record, "published_at"),
      retrievedAt: readString(record, "retrieved_at"),
    };
  });
}

async function listReportRecommendations(
  client: Client,
  reportId: string,
): Promise<DailyRecommendationHistoryReadModel[]> {
  const result = await client.execute({
    sql: `SELECT daily_opportunity_report_recommendations.report_rank,
        recommendations.id, recommendations.ticker, recommendations.instrument_type,
        recommendations.strategy_version_id, recommendations.decision,
        recommendations.evidence_status, recommendations.evidence_gate,
        recommendations.thesis, recommendations.bull_case, recommendations.bear_case,
        recommendations.downside_scenario, recommendations.invalidation_conditions_json,
        recommendations.why_system_might_be_wrong,
        recommendations.primary_citation_title, recommendations.primary_citation_url,
        recommendations.primary_citation_source, recommendations.primary_citation_published_at,
        recommendations.primary_citation_retrieved_at,
        recommendations.freshness_status, recommendations.freshness_as_of,
        recommendations.freshness_notes_json, recommendations.risk_score,
        recommendations.confidence_score, recommendations.liquidity_score,
        recommendations.backtest_run_id, recommendations.paper_trade_evidence_id,
        recommendations.created_at, recommendations.updated_at
      FROM daily_opportunity_report_recommendations
      JOIN recommendations
        ON recommendations.id = daily_opportunity_report_recommendations.recommendation_id
      WHERE daily_opportunity_report_recommendations.daily_report_id = ?
      ORDER BY daily_opportunity_report_recommendations.report_rank ASC`,
    args: [reportId],
  });

  const recommendations: DailyRecommendationHistoryReadModel[] = [];
  for (const row of result.rows) {
    const record = row as Record<string, unknown>;
    const recommendationId = readString(record, "id");
    recommendations.push({
      reportRank: readNumber(record, "report_rank"),
      id: recommendationId,
      ticker: readString(record, "ticker"),
      instrumentType: normalizeInstrumentType(readString(record, "instrument_type")),
      strategyVersionId: readString(record, "strategy_version_id"),
      decision: normalizeDecision(readString(record, "decision")),
      evidenceStatus: readString(record, "evidence_status"),
      evidenceGate: normalizeEvidenceGate(readString(record, "evidence_gate")),
      thesis: readString(record, "thesis"),
      bullCase: readString(record, "bull_case"),
      bearCase: readString(record, "bear_case"),
      downsideScenario: readString(record, "downside_scenario"),
      invalidationConditions: parseStringArray(
        readString(record, "invalidation_conditions_json"),
        "invalidation conditions",
      ),
      whySystemMightBeWrong: readString(record, "why_system_might_be_wrong"),
      sourceCitations: [
        {
          title: readString(record, "primary_citation_title"),
          url: readString(record, "primary_citation_url"),
          source: readString(record, "primary_citation_source"),
          publishedAt: readString(record, "primary_citation_published_at"),
          retrievedAt: readString(record, "primary_citation_retrieved_at"),
        },
        ...(await loadExtraCitations(client, recommendationId)),
      ],
      dataFreshness: {
        status: normalizeFreshnessStatus(readString(record, "freshness_status")),
        asOf: readString(record, "freshness_as_of"),
        notes: parseStringArray(readString(record, "freshness_notes_json"), "freshness notes"),
      },
      scores: {
        risk: readNumber(record, "risk_score"),
        confidence: readNumber(record, "confidence_score"),
        liquidity: readNumber(record, "liquidity_score"),
      },
      evidenceIds: {
        backtestRunId: readOptionalString(record, "backtest_run_id"),
        paperTradeEvidenceId: readOptionalString(record, "paper_trade_evidence_id"),
      },
      createdAt: readString(record, "created_at"),
      updatedAt: readString(record, "updated_at"),
    });
  }

  return recommendations;
}

function mapReportReadModel(
  row: Record<string, unknown>,
  recommendations: DailyRecommendationHistoryReadModel[],
): DailyOpportunityReportHistoryReadModel {
  const outcome = normalizeOutcome(readString(row, "outcome"));
  const noGoodMessage = readOptionalString(row, "no_good_message");
  const noGoodReasonCodes = parseStringArray(
    readString(row, "no_good_reason_codes_json"),
    "no-good reason codes",
  );

  return {
    id: readString(row, "id"),
    generatedAt: readString(row, "generated_at"),
    outcome,
    reviewedCount: readNumber(row, "reviewed_count"),
    opportunityCount: readNumber(row, "opportunity_count"),
    providerKeysRequired: parseStringArray(
      readString(row, "provider_keys_required_json"),
      "provider keys",
    ),
    disclaimer: readString(row, "disclaimer"),
    noGoodTrades:
      outcome === "no_good_trades"
        ? {
            message:
              noGoodMessage === "No good trades today." ? noGoodMessage : "No good trades today.",
            reasonCodes: noGoodReasonCodes,
          }
        : null,
    liveTradingEnabled: readSafeFalse(row, "live_trading_enabled"),
    notRecommendation: readSafeTrue(row, "not_recommendation"),
    recommendations,
    createdAt: readString(row, "created_at"),
    updatedAt: readString(row, "updated_at"),
  };
}

export async function listPersistedDailyOpportunityReports(
  client: Client,
  filters: ListPersistedDailyOpportunityReportsFilters = {},
): Promise<DailyOpportunityReportHistoryReadModel[]> {
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (filters.outcome !== undefined) {
    conditions.push("outcome = ?");
    args.push(filters.outcome);
  }

  const safeLimit =
    filters.limit !== undefined && Number.isFinite(filters.limit) && filters.limit > 0
      ? Math.min(Math.floor(filters.limit), 100)
      : 50;
  args.push(safeLimit);

  const result = await client.execute({
    sql: `SELECT ${dailyReportReadColumns}
      FROM daily_opportunity_reports
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY generated_at DESC, id ASC
      LIMIT ?`,
    args,
  });

  const reports: DailyOpportunityReportHistoryReadModel[] = [];
  for (const row of result.rows) {
    const record = row as Record<string, unknown>;
    const reportId = readString(record, "id");
    reports.push(mapReportReadModel(record, await listReportRecommendations(client, reportId)));
  }

  return reports;
}
