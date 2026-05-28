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
- Daily opportunity generation.
- Dashboard shell with top opportunities.
- Ticker and opportunity detail pages.
- Paper-trading ledger.
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
- Backtesting framework exists.
- Secrets are protected.
- Tests and validation commands pass.

## Research-Informed Direction

Use `docs/research/recommendation-summary.md` as the current CEO/CTO decision summary. The MVP should custom-build the core research contracts, provider interfaces, scoring, risk gates, paper-trading ledger, audit logs, and initial backtesting harness. Heavy quant platforms, runtime agent frameworks, broker integrations, and crypto trading are deferred until the research product proves reliability through validation and paper trading.

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
5. Architecture and risk documentation updates from research.
6. Database schema and migrations.
7. Provider interfaces.
8. Basic ticker and price ingestion.
9. News ingestion.
10. Earnings ingestion.
11. Options-chain ingestion.
12. Scoring engine skeleton.
13. Daily opportunity generation.
14. Backend API.
15. UI dashboard shell.
16. Ticker detail page.
17. Opportunity detail page.
18. Paper-trading module.
19. Backtesting framework.
20. Risk manager module.
21. Daily report generation.
22. Alerts and monitoring.
23. Security hardening.
24. Regression testing.
25. Documentation cleanup.

## Project Status Visibility

During foundation work, project status is tracked in simple files under `docs/status/`:

- `current-work.md` for the active task, owner, blockers, next step, and validation needs.
- `work-items.json` for machine-readable roadmap items using the statuses Planned, In Progress, Blocked, Needs Review, Completed, and Deferred.
- `research-progress.md` for external research coverage.
- `validation-status.md` for checks run, checks skipped, and follow-up validation.

The future UI should expose this as a Project Status / Roadmap dashboard with current focus, roadmap items, research progress, open questions, decision log entries, validation state, and agent handoffs. This should stay lightweight until the core investing research and paper-trading workflow is usable.
