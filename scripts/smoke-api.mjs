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

  console.log("API smoke ok");
} finally {
  await server.close();
}
