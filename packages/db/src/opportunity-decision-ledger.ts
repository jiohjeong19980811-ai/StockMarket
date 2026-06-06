import type { Client } from "@libsql/client";
import type { OpportunityDecision } from "@stockmarket/core";

export interface PersistOpportunityDecisionInput {
  id: string;
  recommendationId: string;
  auditLogId: string;
  decidedBy: string;
  decidedAt: string;
  decision: OpportunityDecision;
  riskDecision: string;
  reasonCodes: string[];
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OpportunityDecisionReadModel {
  id: string;
  recommendationId: string;
  ticker: string;
  instrumentType: "stock";
  strategyVersionId: string;
  mode: "paper";
  operatorDecision: OpportunityDecision;
  notRecommendation: true;
  liveTradingEnabled: false;
  brokerExecution: false;
  reasonCodes: string[];
  evidenceStatus: string;
  evidenceGate: string;
  thesis: string;
  downsideScenario: string;
  invalidationConditions: string[];
  whySystemMightBeWrong: string;
  scores: {
    risk: number;
    confidence: number;
    liquidity: number;
  };
  sourceCitation: {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    retrievedAt: string;
  };
  dataFreshness: {
    status: string;
    asOf: string;
    notes: string[];
  };
  audit: {
    auditLogId: string;
    eventType: string;
    actorType: "operator";
    actorId: string;
    occurredAt: string;
    subjectType: "recommendation";
    subjectId: string;
    riskDecision: string;
    operatorDecision: OpportunityDecision;
    operatorNotes: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ListPersistedOpportunityDecisionFilters {
  recommendationId?: string;
  ticker?: string;
  operatorDecision?: OpportunityDecision;
  limit?: number;
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected ${key} to be a nonempty string.`);
  }
  return value;
}

function readNullableString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`Expected ${key} to be a string or null.`);
  }
  return value;
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
    throw new Error(`Unsafe opportunity decision has ${key} enabled.`);
  }
  return false;
}

function readSafeTrue(row: Record<string, unknown>, key: string): true {
  if (readNumber(row, key) !== 1) {
    throw new Error(`Unsafe opportunity decision has ${key} disabled.`);
  }
  return true;
}

function parseStringArray(value: string, label: string, allowEmpty = false): string[] {
  const parsed = JSON.parse(value) as unknown;
  if (
    !Array.isArray(parsed) ||
    (!allowEmpty && parsed.length === 0) ||
    parsed.some((item) => typeof item !== "string" || item.length === 0)
  ) {
    throw new Error(`Persisted opportunity decision has invalid ${label}.`);
  }
  return parsed;
}

function normalizeOperatorDecision(value: string): OpportunityDecision {
  if (
    value === "watchlist" ||
    value === "paper_trade" ||
    value === "avoid" ||
    value === "needs_more_data"
  ) {
    return value;
  }
  throw new Error(`Unsupported opportunity decision: ${value}`);
}

function readStockInstrument(row: Record<string, unknown>): "stock" {
  const instrumentType = readString(row, "instrument_type");
  if (instrumentType !== "stock") {
    throw new Error(`Only stock opportunity decision read models are supported: ${instrumentType}`);
  }
  return "stock";
}

function mapOpportunityDecisionReadModel(
  row: Record<string, unknown>,
): OpportunityDecisionReadModel {
  const mode = readString(row, "mode");
  if (mode !== "paper") {
    throw new Error(`Unsupported opportunity decision mode: ${mode}`);
  }

  const operatorDecision = normalizeOperatorDecision(readString(row, "operator_decision"));
  const auditOperatorDecision = normalizeOperatorDecision(
    readString(row, "audit_operator_decision"),
  );

  return {
    id: readString(row, "id"),
    recommendationId: readString(row, "recommendation_id"),
    ticker: readString(row, "ticker"),
    instrumentType: readStockInstrument(row),
    strategyVersionId: readString(row, "strategy_version_id"),
    mode,
    operatorDecision,
    notRecommendation: readSafeTrue(row, "not_recommendation"),
    liveTradingEnabled: readSafeFalse(row, "live_trading_enabled"),
    brokerExecution: readSafeFalse(row, "broker_execution"),
    reasonCodes: parseStringArray(readString(row, "reason_codes_json"), "reason codes"),
    evidenceStatus: readString(row, "evidence_status"),
    evidenceGate: readString(row, "evidence_gate"),
    thesis: readString(row, "thesis"),
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
    sourceCitation: {
      title: readString(row, "primary_citation_title"),
      url: readString(row, "primary_citation_url"),
      source: readString(row, "primary_citation_source"),
      publishedAt: readString(row, "primary_citation_published_at"),
      retrievedAt: readString(row, "primary_citation_retrieved_at"),
    },
    dataFreshness: {
      status: readString(row, "freshness_status"),
      asOf: readString(row, "freshness_as_of"),
      notes: parseStringArray(readString(row, "freshness_notes_json"), "freshness notes", true),
    },
    audit: {
      auditLogId: readString(row, "audit_log_id"),
      eventType: readString(row, "event_type"),
      actorType: "operator",
      actorId: readString(row, "actor_id"),
      occurredAt: readString(row, "occurred_at"),
      subjectType: "recommendation",
      subjectId: readString(row, "subject_id"),
      riskDecision: readString(row, "audit_risk_decision"),
      operatorDecision: auditOperatorDecision,
      operatorNotes: readNullableString(row, "operator_notes") ?? "",
    },
    createdAt: readString(row, "created_at"),
    updatedAt: readString(row, "updated_at"),
  };
}

const opportunityDecisionReadColumns = `
  opportunity_decisions.rowid AS rowid,
  opportunity_decisions.id,
  opportunity_decisions.recommendation_id,
  opportunity_decisions.audit_log_id,
  opportunity_decisions.mode,
  opportunity_decisions.operator_decision,
  opportunity_decisions.reason_codes_json,
  opportunity_decisions.live_trading_enabled,
  opportunity_decisions.broker_execution,
  opportunity_decisions.not_recommendation,
  opportunity_decisions.created_at,
  opportunity_decisions.updated_at,
  recommendations.ticker,
  recommendations.instrument_type,
  recommendations.strategy_version_id,
  recommendations.evidence_status,
  recommendations.evidence_gate,
  recommendations.thesis,
  recommendations.downside_scenario,
  recommendations.invalidation_conditions_json,
  recommendations.why_system_might_be_wrong,
  recommendations.primary_citation_title,
  recommendations.primary_citation_url,
  recommendations.primary_citation_source,
  recommendations.primary_citation_published_at,
  recommendations.primary_citation_retrieved_at,
  recommendations.freshness_status,
  recommendations.freshness_as_of,
  recommendations.freshness_notes_json,
  recommendations.risk_score,
  recommendations.confidence_score,
  recommendations.liquidity_score,
  audit_logs.event_type,
  audit_logs.actor_id,
  audit_logs.occurred_at,
  audit_logs.subject_id,
  audit_logs.risk_decision AS audit_risk_decision,
  audit_logs.operator_decision AS audit_operator_decision,
  audit_logs.operator_notes
`;

export async function persistOpportunityDecision(
  client: Client,
  decision: PersistOpportunityDecisionInput,
): Promise<void> {
  await client.batch(
    [
      {
        sql: `INSERT INTO audit_logs
          (id, event_type, actor_type, actor_id, occurred_at, subject_type, subject_id,
           risk_decision, operator_decision, operator_notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          decision.auditLogId,
          "operator_decision",
          "operator",
          decision.decidedBy,
          decision.decidedAt,
          "recommendation",
          decision.recommendationId,
          decision.riskDecision,
          decision.decision,
          decision.notes,
        ],
      },
      {
        sql: `INSERT INTO opportunity_decisions
          (id, recommendation_id, audit_log_id, mode, operator_decision,
           reason_codes_json, live_trading_enabled, broker_execution,
           not_recommendation, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          decision.id,
          decision.recommendationId,
          decision.auditLogId,
          "paper",
          decision.decision,
          JSON.stringify(decision.reasonCodes),
          0,
          0,
          1,
          decision.createdAt,
          decision.updatedAt ?? decision.createdAt,
        ],
      },
    ],
    "write",
  );
}

export async function listPersistedOpportunityDecisions(
  client: Client,
  filters: ListPersistedOpportunityDecisionFilters = {},
): Promise<OpportunityDecisionReadModel[]> {
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (filters.recommendationId !== undefined) {
    conditions.push("opportunity_decisions.recommendation_id = ?");
    args.push(filters.recommendationId);
  }
  if (filters.ticker !== undefined) {
    conditions.push("recommendations.ticker = ?");
    args.push(filters.ticker);
  }
  if (filters.operatorDecision !== undefined) {
    conditions.push("opportunity_decisions.operator_decision = ?");
    args.push(filters.operatorDecision);
  }

  const safeLimit =
    filters.limit !== undefined && Number.isFinite(filters.limit) && filters.limit > 0
      ? Math.min(Math.floor(filters.limit), 100)
      : 50;
  args.push(safeLimit);

  const result = await client.execute({
    sql: `SELECT ${opportunityDecisionReadColumns}
      FROM opportunity_decisions
      JOIN recommendations
        ON recommendations.id = opportunity_decisions.recommendation_id
      JOIN audit_logs
        ON audit_logs.id = opportunity_decisions.audit_log_id
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY opportunity_decisions.created_at DESC, opportunity_decisions.rowid DESC
      LIMIT ?`,
    args,
  });

  return result.rows.map((row) => mapOpportunityDecisionReadModel(row as Record<string, unknown>));
}

export async function getPersistedOpportunityDecisionById(
  client: Client,
  id: string,
): Promise<OpportunityDecisionReadModel | null> {
  const result = await client.execute({
    sql: `SELECT ${opportunityDecisionReadColumns}
      FROM opportunity_decisions
      JOIN recommendations
        ON recommendations.id = opportunity_decisions.recommendation_id
      JOIN audit_logs
        ON audit_logs.id = opportunity_decisions.audit_log_id
      WHERE opportunity_decisions.id = ?
      LIMIT 1`,
    args: [id],
  });
  const row = result.rows[0];
  return row === undefined ? null : mapOpportunityDecisionReadModel(row as Record<string, unknown>);
}
