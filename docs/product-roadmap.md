# Product Roadmap

## Product Positioning

StockMarket helps an operator find, review, and paper-trade potential stock and options opportunities. It is a decision-support and research platform. It is not financial advice and must not promise guaranteed income.

## MVP

Goal: produce ranked, explainable research opportunities and support paper-trading review.

Capabilities:

- Manual daily research pipeline.
- Provider interface layer for prices, options, news, earnings, fundamentals, and sentiment.
- Database schema and migrations.
- Basic ticker and price ingestion.
- News, earnings, and options ingestion.
- Explainable scoring skeleton.
- Strategy registry and evidence gates for earnings, momentum, mean reversion, volatility, options, news/sentiment, value/quality, sector/macro, and portfolio risk.
- Strategy policy catalog exposed through API/UI so MVP-testable, context-only, deferred, and control-layer strategy families are visible to the operator.
- Initial MVP strategy tests focused on liquid stock/ETF hypotheses: PEAD, earnings surprise continuation, momentum, volatility-adjusted mean reversion, news-confirmed watchlist signals, and value/quality context.
- Daily opportunity generation.
- Dashboard shell with top opportunities.
- Ticker and opportunity detail pages.
- Paper-trading ledger contracts and durable DB rows, starting stock-only and simulated-only.
- Basic backtesting framework.
- Risk manager module and no-trade rules.
- Data freshness and audit logs.
- Lightweight Project Status / Roadmap dashboard after the core operator workflow exists.
- No live trading capability.

Acceptance criteria:

- One command can ingest or update data.
- Dashboard shows ranked opportunities or `no good trades today`.
- Each opportunity includes explanation, citations, timestamps, risk, and confidence.
- Options ideas include liquidity, spread, IV, and max-loss checks.
- Recommendations are stored historically.
- Operator can paper trade a recommendation.
- Paper-trade performance is visible.
- Paper-trade entries require operator approval metadata, explicit stop/target/time-stop rules, audit references, and conservative paper exposure limits.
- Paper-trade closes require timestamped exit prices, exit reasons, lessons learned, and simulated P/L calculations before outcomes feed validation.
- DB paper-trade closes require close audit linkage and reject duplicate close attempts.
- Durable paper-trade records remain paper-only, stock-only for MVP, and cannot store live-trading or broker-execution flags.
- Paper-trade contracts reject understated max loss, invalid or unordered timestamps, nested broker/order-shaped fields, and mixed-cohort evidence summaries.
- Paper-trade audit IDs point to semantically correct approval, entry, and close audit events before records are accepted.
- API smoke can verify a mock paper-trade decision is persisted through an in-memory ledger dry run without provider keys or broker execution.
- API smoke can verify a mock paper trade opens and closes through the in-memory ledger with close audit linkage.
- API smoke can verify persisted paper trades can be read back through a safe paper-only read model with audit links and computed simulated outcomes.
- API smoke can verify a mock paper-trade evidence summary with closed-trade metrics and review-gated status.
- API smoke can verify recommendation evidence detail resolves a closed paper-trade evidence ID with citations, freshness, reason codes, and audit trail while keeping the route in-memory and mock-only.
- Operator console can show simulated paper-trade close outcome, P/L, return percent, exit price, and lessons from the mock close dry run.
- Operator console can show paper-trade evidence summary metrics, including closed/open counts, win rate, realized P/L, review status, and validation-only messaging.
- Operator console can show mock persisted ledger readback details, including paper-only status, close audit ID, entry/exit prices, simulated P/L, return, and risk percent.
- Operator console can show recommendation evidence detail with source timestamps, freshness, downside/invalidation text, resolved paper-trade evidence, and audit events while keeping decision buttons disabled until audit-backed writes exist.
- Operator console hides sample paper-trade metrics when the API is unavailable and shows `Data unavailable` / `No operational decision` instead of an actionable-looking fallback.
- Paper-trade evidence summaries aggregate closed simulated trades for validation metrics while remaining non-recommendation and review-gated.
- Backtesting framework exists.
- Initial backtesting framework can evaluate stock-only closed trade observations with documented assumptions, source citations, data freshness, anti-bias controls, and cost sensitivity while returning `notRecommendation`.
- Strategies cannot produce `paper trade` candidates without stored backtesting or paper-trading evidence.
- Context-only and deferred strategy families cannot bypass the scoring strategy-policy gate.
- Options strategies remain research/manual review only until historical options chains and realistic fill assumptions are available.
- Secrets are protected.
- Tests and validation commands pass.

## Research-Informed Direction

Use `docs/research/recommendation-summary.md` as the current CEO/CTO decision summary. The MVP should custom-build the core research contracts, provider interfaces, scoring, risk gates, paper-trading ledger, audit logs, and initial backtesting harness. Heavy quant platforms, runtime agent frameworks, broker integrations, and crypto trading are deferred until the research product proves reliability through validation and paper trading.

Use `docs/research/quant-strategies.md` as the current strategy research addendum. The first strategy work should test liquid stock/ETF hypotheses before options, ML, stat-arb, or crypto. Strategy families should appear in the product as research categories, not as guaranteed-return products.

Milestone 1 stack decision: use npm workspaces with TypeScript, Fastify for `apps/api`, Vite React for `apps/web`, and shared workspace packages under `packages/`. This keeps setup compatible with the local environment and preserves the modular architecture.

Initial provider evaluation should focus on:

- Polygon.io for market and options data.
- Financial Modeling Prep or Finnhub for fundamentals, earnings, analyst, and news data.
- SEC EDGAR for official filings.
- FRED for macro context.
- Tradier or Alpaca only later for broker paper integration, with order endpoints disabled until explicitly approved.

## V1

Goal: improve evidence quality, usability, and strategy coverage.

Capabilities:

- More robust backtesting with slippage, spreads, fees, and market regimes.
- More data providers and provider fallback.
- Sector rotation and macro context.
- Portfolio and watchlist risk dashboard.
- Alerting.
- Advanced options strategies, with spreads preferred where risk is better defined.
- Earnings-specific models.
- Sector rotation and long-only factor/quality strategy evaluation.
- Options strategy evaluation with historical chain data, realistic bid/ask fills, and defined-risk structures only.
- Sentiment trend tracking.
- Better report automation.
- External backtest comparison against at least one mature framework.

## V2

Goal: expand automation while remaining paper-first.

Capabilities:

- Broker paper-trading integration.
- Crypto research module.
- Real-time or near-real-time alerts.
- Strategy registry.
- Automated daily report.
- More advanced ML models.
- Model and prompt versioning.
- Deeper data quality monitoring.
- Runtime agent orchestration only if deterministic workflows and audit logs are already strong.

## V3 And Later

Goal: limited live trading only after production-grade proof and explicit approval.

Required before any live trading:

- Written operator approval to begin live-trading implementation.
- Broker integration in a separate gated module.
- Kill switch.
- Max daily loss.
- Max position size.
- Trade approval queue.
- No naked options selling unless a future compliance review explicitly approves it.
- Full audit logs.
- Canary mode.
- Rollback controls.
- Compliance review.
- Production incident process.

## Implementation Order

1. Repo and Codex configuration.
2. Codex lifecycle hooks, hook documentation, and hook tests.
3. Lightweight project status files for current work, work items, research progress, and validation state.
4. Structured external research phase.
5. Quant strategy research addendum.
6. Architecture and risk documentation updates from research.
7. Database schema and migrations.
8. Provider interfaces.
9. Basic ticker and price ingestion.
10. News ingestion.
11. Earnings ingestion.
12. Options-chain ingestion.
13. Strategy registry and evidence gate contracts.
14. Scoring engine skeleton.
15. Daily opportunity generation.
16. Backend API.
17. UI dashboard shell.
18. Ticker detail page.
19. Opportunity detail page.
20. Paper-trading module.
21. Backtesting framework.
22. Risk manager module.
23. Daily report generation.
24. Alerts and monitoring.
25. Security hardening.
26. Regression testing.
27. Documentation cleanup.

## Project Status Visibility

During foundation work, project status is tracked in simple files under `docs/status/`:

- `current-work.md` for the active task, owner, blockers, next step, and validation needs.
- `work-items.json` for machine-readable roadmap items using the statuses Planned, In Progress, Blocked, Needs Review, Completed, and Deferred.
- `research-progress.md` for external research coverage.
- `validation-status.md` for checks run, checks skipped, and follow-up validation.

The future UI should expose this as a Project Status / Roadmap dashboard with current focus, roadmap items, research progress, open questions, decision log entries, validation state, and agent handoffs. This should stay lightweight until the core investing research and paper-trading workflow is usable.
