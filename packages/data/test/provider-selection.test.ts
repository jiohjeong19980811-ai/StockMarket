import { describe, expect, it } from "vitest";
import { evaluateProviderCandidates, providerSelectionCandidates } from "../src/index.js";

describe("provider selection scoring", () => {
  it("keeps mock providers as the only use-now provider without environment variables", () => {
    const evaluations = evaluateProviderCandidates(providerSelectionCandidates);
    const useNow = evaluations.filter((evaluation) => evaluation.decision === "use_now");

    expect(useNow.map((evaluation) => evaluation.id)).toEqual(["mock"]);
    expect(useNow[0]?.requiredEnv).toEqual([]);
    expect(useNow[0]?.blockers).toEqual([]);
  });

  it("keeps paid market and news candidates in evaluate-only status until terms review", () => {
    const evaluations = evaluateProviderCandidates(providerSelectionCandidates);
    const paidCandidates = evaluations.filter((evaluation) =>
      ["polygon", "financial-modeling-prep", "finnhub"].includes(evaluation.id),
    );

    expect(paidCandidates.map((evaluation) => evaluation.decision)).toEqual([
      "evaluate_first",
      "evaluate_first",
      "evaluate_first",
    ]);
    expect(paidCandidates.map((evaluation) => evaluation.requiredEnv)).toEqual([
      ["POLYGON_API_KEY"],
      ["FMP_API_KEY"],
      ["FINNHUB_API_KEY"],
    ]);
    expect(paidCandidates.flatMap((evaluation) => evaluation.requiredEnv)).not.toContain(
      "NEWS_API_KEY",
    );
  });

  it("defers broker-adjacent providers even when market data may be useful", () => {
    const evaluations = evaluateProviderCandidates(providerSelectionCandidates);
    const brokerAdjacent = evaluations.filter((evaluation) =>
      ["tradier", "alpaca"].includes(evaluation.id),
    );

    expect(brokerAdjacent.map((evaluation) => evaluation.decision)).toEqual(["defer", "defer"]);
    expect(brokerAdjacent.flatMap((evaluation) => evaluation.blockers)).toContain(
      "Broker or order-placement surface must stay isolated from MVP ingestion.",
    );
  });

  it("keeps official source adapters later without requiring paid provider keys now", () => {
    const evaluations = evaluateProviderCandidates(providerSelectionCandidates);
    const secEdgar = evaluations.find((evaluation) => evaluation.id === "sec-edgar");
    const fred = evaluations.find((evaluation) => evaluation.id === "fred");

    expect(secEdgar?.decision).toBe("evaluate_later");
    expect(secEdgar?.requiredEnv).toEqual(["SEC_EDGAR_USER_AGENT"]);
    expect(fred?.decision).toBe("evaluate_later");
    expect(fred?.requiredEnv).toEqual(["FRED_API_KEY"]);
  });
});
