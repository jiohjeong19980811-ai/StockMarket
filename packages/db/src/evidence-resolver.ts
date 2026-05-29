import type { Client } from "@libsql/client";

export type RecommendationEvidenceGate = "verified" | "needs_more_data" | "blocked";
export type RecommendationEvidenceItemStatus = "verified" | "unresolved" | "blocked";
export type RecommendationEvidenceReason =
  | "no_evidence_ids"
  | "backtest_resolver_not_available"
  | "paper_trade_evidence_missing"
  | "paper_trade_evidence_not_closed"
  | "paper_trade_evidence_unsafe"
  | "paper_trade_evidence_cohort_mismatch";

export interface RecommendationEvidenceCitation {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  retrievedAt: string;
}

export interface RecommendationEvidenceAuditEvent {
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
}

export interface RecommendationEvidenceItem {
  kind: "backtest_run" | "paper_trade";
  id: string;
  status: RecommendationEvidenceItemStatus;
  reasonCodes: RecommendationEvidenceReason[];
  ticker?: string;
  instrumentType?: string;
  strategyVersionId?: string;
  closedAt?: string;
  liveTradingEnabled?: false;
  brokerExecution?: false;
  realizedPnl?: number;
  realizedReturnPct?: number;
}

export interface RecommendationEvidenceDetail {
  notRecommendation: true;
  evidenceGate: RecommendationEvidenceGate;
  reasonCodes: RecommendationEvidenceReason[];
  recommendation: {
    id: string;
    ticker: string;
    instrumentType: string;
    strategyVersionId: string;
    decision: string;
    evidenceStatus: string;
    thesis: string;
    bullCase: string;
    bearCase: string;
    downsideScenario: string;
    invalidationConditions: string[];
    whySystemMightBeWrong: string;
    scores: {
      risk: number;
      confidence: number;
      liquidity: number;
    };
    evidenceIds: {
      backtestRunId: string | null;
      paperTradeEvidenceId: string | null;
    };
  };
  citations: RecommendationEvidenceCitation[];
  dataFreshness: {
    status: string;
    asOf: string;
    notes: string[];
  };
  evidence: RecommendationEvidenceItem[];
  auditTrail: RecommendationEvidenceAuditEvent[];
}

function roundedPercent(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function roundedCurrency(value: number): number {
  return Math.round(value * 100) / 100;
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

function readOptionalNumber(row: Record<string, unknown>, key: string): number | null {
  const value = row[key];
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Expected ${key} to be a finite number or null.`);
  }
  return value;
}

function readSafeFalse(row: Record<string, unknown>, key: string): false {
  if (readNumber(row, key) !== 0) {
    throw new Error(`Unsafe evidence row has ${key} enabled.`);
  }
  return false;
}

function parseStringArray(value: string, label: string): string[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new Error(`Expected ${label} to be a string array.`);
  }
  return parsed;
}

function uniqueReasons(reasons: RecommendationEvidenceReason[]): RecommendationEvidenceReason[] {
  return [...new Set(reasons)];
}

function evidenceGateFor(items: RecommendationEvidenceItem[]): RecommendationEvidenceGate {
  if (items.length === 0 || items.every((item) => item.status === "unresolved")) {
    return "needs_more_data";
  }
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  return "verified";
}

async function loadAuditTrail(
  client: Client,
  auditIds: Array<string | null | undefined>,
): Promise<RecommendationEvidenceAuditEvent[]> {
  const events: RecommendationEvidenceAuditEvent[] = [];
  const seen = new Set<string>();

  for (const auditId of auditIds) {
    if (auditId === null || auditId === undefined || seen.has(auditId)) {
      continue;
    }
    seen.add(auditId);
    const result = await client.execute({
      sql: `SELECT id, event_type, actor_type, actor_id, occurred_at, subject_type,
          subject_id, risk_decision, operator_decision, operator_notes
        FROM audit_logs
        WHERE id = ?
        LIMIT 1`,
      args: [auditId],
    });
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (row === undefined) {
      continue;
    }
    const actorType = readString(row, "actor_type");
    if (actorType !== "operator" && actorType !== "system") {
      throw new Error(`Unsupported audit actor type: ${actorType}`);
    }
    events.push({
      id: readString(row, "id"),
      eventType: readString(row, "event_type"),
      actorType,
      actorId: readString(row, "actor_id"),
      occurredAt: readString(row, "occurred_at"),
      subjectType: readString(row, "subject_type"),
      subjectId: readString(row, "subject_id"),
      riskDecision: readOptionalString(row, "risk_decision"),
      operatorDecision: readOptionalString(row, "operator_decision"),
      operatorNotes: readOptionalString(row, "operator_notes"),
    });
  }

  return events;
}

async function loadExtraCitations(
  client: Client,
  recommendationId: string,
): Promise<RecommendationEvidenceCitation[]> {
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

async function resolvePaperTradeEvidence(
  client: Client,
  evidenceId: string,
  recommendation: {
    ticker: string;
    instrumentType: string;
    strategyVersionId: string;
  },
): Promise<{ item: RecommendationEvidenceItem; auditIds: string[] }> {
  const result = await client.execute({
    sql: `SELECT id, ticker, instrument_type, strategy_version_id, status,
        operator_approval_audit_log_id, entry_audit_log_id, exit_audit_log_id,
        live_trading_enabled, broker_execution, simulated_entry_price, quantity,
        closed_at, exit_price
      FROM paper_trades
      WHERE id = ?
      LIMIT 1`,
    args: [evidenceId],
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (row === undefined) {
    return {
      item: {
        kind: "paper_trade",
        id: evidenceId,
        status: "blocked",
        reasonCodes: ["paper_trade_evidence_missing"],
      },
      auditIds: [],
    };
  }

  const reasonCodes: RecommendationEvidenceReason[] = [];
  const status = readString(row, "status");
  const ticker = readString(row, "ticker");
  const instrumentType = readString(row, "instrument_type");
  const strategyVersionId = readString(row, "strategy_version_id");
  const liveTradingEnabledRaw = readNumber(row, "live_trading_enabled");
  const brokerExecutionRaw = readNumber(row, "broker_execution");

  if (status !== "closed") {
    reasonCodes.push("paper_trade_evidence_not_closed");
  }
  if (liveTradingEnabledRaw !== 0 || brokerExecutionRaw !== 0) {
    reasonCodes.push("paper_trade_evidence_unsafe");
  }
  if (
    ticker !== recommendation.ticker ||
    instrumentType !== recommendation.instrumentType ||
    strategyVersionId !== recommendation.strategyVersionId
  ) {
    reasonCodes.push("paper_trade_evidence_cohort_mismatch");
  }

  const simulatedEntryPrice = readNumber(row, "simulated_entry_price");
  const quantity = readNumber(row, "quantity");
  const exitPrice = readOptionalNumber(row, "exit_price");
  const verified = reasonCodes.length === 0;

  return {
    item: {
      kind: "paper_trade",
      id: evidenceId,
      status: verified ? "verified" : "blocked",
      reasonCodes: uniqueReasons(reasonCodes),
      ticker,
      instrumentType,
      strategyVersionId,
      closedAt: readOptionalString(row, "closed_at") ?? undefined,
      liveTradingEnabled: readSafeFalse(row, "live_trading_enabled"),
      brokerExecution: readSafeFalse(row, "broker_execution"),
      realizedPnl:
        exitPrice === null
          ? undefined
          : roundedCurrency((exitPrice - simulatedEntryPrice) * quantity),
      realizedReturnPct:
        exitPrice === null
          ? undefined
          : roundedPercent(((exitPrice - simulatedEntryPrice) / simulatedEntryPrice) * 100),
    },
    auditIds: [
      readString(row, "operator_approval_audit_log_id"),
      readString(row, "entry_audit_log_id"),
      readOptionalString(row, "exit_audit_log_id") ?? "",
    ].filter((id) => id.length > 0),
  };
}

export async function getRecommendationEvidenceDetail(
  client: Client,
  recommendationId: string,
): Promise<RecommendationEvidenceDetail> {
  const recommendationResult = await client.execute({
    sql: `SELECT id, ticker, instrument_type, strategy_version_id, decision, evidence_status,
        thesis, bull_case, bear_case, downside_scenario, invalidation_conditions_json,
        why_system_might_be_wrong, primary_citation_title, primary_citation_url,
        primary_citation_source, primary_citation_published_at,
        primary_citation_retrieved_at, freshness_status, freshness_as_of,
        freshness_notes_json, risk_score, confidence_score, liquidity_score,
        backtest_run_id, paper_trade_evidence_id, operator_audit_log_id
      FROM recommendations
      WHERE id = ?
      LIMIT 1`,
    args: [recommendationId],
  });
  const row = recommendationResult.rows[0] as Record<string, unknown> | undefined;
  if (row === undefined) {
    throw new Error(`Recommendation ${recommendationId} was not found.`);
  }

  const recommendation = {
    id: readString(row, "id"),
    ticker: readString(row, "ticker"),
    instrumentType: readString(row, "instrument_type"),
    strategyVersionId: readString(row, "strategy_version_id"),
    decision: readString(row, "decision"),
    evidenceStatus: readString(row, "evidence_status"),
    thesis: readString(row, "thesis"),
    bullCase: readString(row, "bull_case"),
    bearCase: readString(row, "bear_case"),
    downsideScenario: readString(row, "downside_scenario"),
    invalidationConditions: parseStringArray(
      readString(row, "invalidation_conditions_json"),
      "invalidation conditions",
    ),
    whySystemMightBeWrong: readString(row, "why_system_might_be_wrong"),
    scores: {
      risk: readNumber(row, "risk_score"),
      confidence: readNumber(row, "confidence_score"),
      liquidity: readNumber(row, "liquidity_score"),
    },
    evidenceIds: {
      backtestRunId: readOptionalString(row, "backtest_run_id"),
      paperTradeEvidenceId: readOptionalString(row, "paper_trade_evidence_id"),
    },
  };

  const evidence: RecommendationEvidenceItem[] = [];
  const auditIds = [readString(row, "operator_audit_log_id")];

  if (recommendation.evidenceIds.backtestRunId !== null) {
    evidence.push({
      kind: "backtest_run",
      id: recommendation.evidenceIds.backtestRunId,
      status: "unresolved",
      reasonCodes: ["backtest_resolver_not_available"],
    });
  }

  if (recommendation.evidenceIds.paperTradeEvidenceId !== null) {
    const resolved = await resolvePaperTradeEvidence(
      client,
      recommendation.evidenceIds.paperTradeEvidenceId,
      recommendation,
    );
    evidence.push(resolved.item);
    auditIds.push(...resolved.auditIds);
  }

  if (evidence.length === 0) {
    evidence.push({
      kind: "paper_trade",
      id: "none",
      status: "unresolved",
      reasonCodes: ["no_evidence_ids"],
    });
  }

  return {
    notRecommendation: true,
    evidenceGate: evidenceGateFor(evidence),
    reasonCodes: uniqueReasons(evidence.flatMap((item) => item.reasonCodes)),
    recommendation,
    citations: [
      {
        title: readString(row, "primary_citation_title"),
        url: readString(row, "primary_citation_url"),
        source: readString(row, "primary_citation_source"),
        publishedAt: readString(row, "primary_citation_published_at"),
        retrievedAt: readString(row, "primary_citation_retrieved_at"),
      },
      ...(await loadExtraCitations(client, recommendation.id)),
    ],
    dataFreshness: {
      status: readString(row, "freshness_status"),
      asOf: readString(row, "freshness_as_of"),
      notes: parseStringArray(readString(row, "freshness_notes_json"), "freshness notes"),
    },
    evidence,
    auditTrail: await loadAuditTrail(client, auditIds),
  };
}
