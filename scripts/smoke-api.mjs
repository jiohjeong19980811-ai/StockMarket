const { buildServer } = await import("../apps/api/dist/server.js");

const server = buildServer({
  APP_ENV: "test",
  API_PORT: 4010,
  LIVE_TRADING_ENABLED: false,
});

try {
  const response = await server.inject({
    method: "GET",
    url: "/health",
  });

  if (response.statusCode !== 200) {
    throw new Error(`Expected /health to return 200, got ${response.statusCode}`);
  }

  const body = response.json();
  if (body.service !== "stockmarket-api" || body.liveTradingEnabled !== false) {
    throw new Error(`Unexpected /health response: ${response.body}`);
  }

  const providerSelectionResponse = await server.inject({
    method: "GET",
    url: "/providers/selection",
  });

  if (providerSelectionResponse.statusCode !== 200) {
    throw new Error(
      `Expected /providers/selection to return 200, got ${providerSelectionResponse.statusCode}`,
    );
  }

  const providerSelectionBody = providerSelectionResponse.json();
  if (
    providerSelectionBody.requiresEnv !== false ||
    providerSelectionBody.liveTradingEnabled !== false ||
    providerSelectionBody.providerKeysRequiredNow?.length !== 0 ||
    !providerSelectionBody.useNow?.includes("mock")
  ) {
    throw new Error(`Unexpected provider selection response: ${providerSelectionResponse.body}`);
  }

  const dryRunResponse = await server.inject({
    method: "POST",
    url: "/ingestion/mock-dry-run",
  });

  if (dryRunResponse.statusCode !== 200) {
    throw new Error(
      `Expected /ingestion/mock-dry-run to return 200, got ${dryRunResponse.statusCode}`,
    );
  }

  const dryRunBody = dryRunResponse.json();
  if (
    dryRunBody.requiresEnv !== false ||
    dryRunBody.liveTradingEnabled !== false ||
    dryRunBody.persistence?.durable !== false ||
    dryRunBody.persistedInMemory?.ingestionRuns !== 4
  ) {
    throw new Error(`Unexpected mock dry-run response: ${dryRunResponse.body}`);
  }

  const scoringResponse = await server.inject({
    method: "GET",
    url: "/scoring/mock-evaluation",
  });

  if (scoringResponse.statusCode !== 200) {
    throw new Error(
      `Expected /scoring/mock-evaluation to return 200, got ${scoringResponse.statusCode}`,
    );
  }

  const scoringBody = scoringResponse.json();
  if (
    scoringBody.requiresEnv !== false ||
    scoringBody.liveTradingEnabled !== false ||
    scoringBody.notRecommendation !== true ||
    scoringBody.result?.decision !== "watchlist" ||
    scoringBody.result?.strategyPolicy?.family !== "momentum"
  ) {
    throw new Error(`Unexpected mock scoring response: ${scoringResponse.body}`);
  }

  const strategyPoliciesResponse = await server.inject({
    method: "GET",
    url: "/strategies/policies",
  });

  if (strategyPoliciesResponse.statusCode !== 200) {
    throw new Error(
      `Expected /strategies/policies to return 200, got ${strategyPoliciesResponse.statusCode}`,
    );
  }

  const strategyPoliciesBody = strategyPoliciesResponse.json();
  if (
    strategyPoliciesBody.requiresEnv !== false ||
    strategyPoliciesBody.liveTradingEnabled !== false ||
    strategyPoliciesBody.paperTradeFirst !== true ||
    !strategyPoliciesBody.policies?.some(
      (policy) => policy.family === "momentum" && policy.mvpDecision === "test_now",
    )
  ) {
    throw new Error(`Unexpected strategy policies response: ${strategyPoliciesResponse.body}`);
  }

  console.log("API smoke ok");
} finally {
  await server.close();
}
