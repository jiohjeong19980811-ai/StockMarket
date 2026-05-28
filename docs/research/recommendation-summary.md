# External Research Recommendation Summary

Last updated: 2026-05-28T13:51:18-04:00

## Executive Decision

Proceed with a custom, modular MVP focused on research, explainability, paper trading, and auditability. Use external repositories and frameworks as references, not as the core product foundation. Do not implement live trading, broker order placement, crypto trading, autonomous portfolio management, or guaranteed-return language.

## Top 10 Repositories

1. [QuantConnect/Lean](https://github.com/QuantConnect/Lean)
2. [microsoft/qlib](https://github.com/microsoft/qlib)
3. [OpenBB-finance/OpenBB](https://github.com/OpenBB-finance/OpenBB)
4. [polakowo/vectorbt](https://github.com/polakowo/vectorbt)
5. [kernc/backtesting.py](https://github.com/kernc/backtesting.py)
6. [ranaroussi/yfinance](https://github.com/ranaroussi/yfinance)
7. [ranaroussi/quantstats](https://github.com/ranaroussi/quantstats)
8. [bukosabino/ta](https://github.com/bukosabino/ta)
9. [stefan-jansen/zipline-reloaded](https://github.com/stefan-jansen/zipline-reloaded)
10. [openai/openai-agents-python](https://github.com/openai/openai-agents-python)

## Top 10 Articles And Docs

1. [OpenAI Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
2. [OpenAI Codex Hooks](https://developers.openai.com/codex/hooks)
3. [OpenAI Codex MCP](https://developers.openai.com/codex/mcp)
4. [OpenAI Codex Skills](https://developers.openai.com/codex/skills)
5. [OpenAI Codex Subagents](https://developers.openai.com/codex/subagents)
6. [OpenAI Codex Memories](https://developers.openai.com/codex/memories)
7. [OpenAI Agents SDK](https://platform.openai.com/docs/guides/agents-sdk/)
8. [MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
9. [SEC Automated Investment Advice](https://www.sec.gov/about/divisions-offices/office-strategic-hub-innovation-financial-technology-finhub/automated-investment-advice)
10. [OCC Options Disclosure Document](https://www.theocc.com/Company-information/Documents-and-Archives/Options-Disclosure-Document)

## Recommended Data Providers

- Market/options first candidate: Polygon.io.
- Fundamentals, earnings, and news candidates: Financial Modeling Prep and Finnhub.
- Official filing verification: SEC EDGAR.
- Macro context: FRED.
- Future broker paper candidates only: Tradier and Alpaca.
- Future premium options candidate: Cboe DataShop.
- Future crypto research-only candidate: CoinGecko.

## Recommended MCP And Plugins

- Use now: repo-local hooks, repo skills, repo subagents, and official OpenAI docs lookup.
- Consider later: repo-scoped GitHub MCP, repo-scoped filesystem MCP, local UI/browser testing tools, and local development database inspection.
- Avoid in MVP: broker MCP servers, market-data MCP servers that require provider credentials in Codex config, broad filesystem MCP, and crypto exchange MCP.

## Use Now

- Official Codex setup: `AGENTS.md`, repo config, rules, hooks, skills, and subagents.
- Repo-local lifecycle hooks for safety, validation, status reminders, and handoff hygiene.
- Provider adapter architecture with mock providers.
- Postgres-style relational schema with migrations when implementation begins.
- Custom scoring, risk, recommendation, paper-trading, audit, and initial backtesting contracts.
- Official sources where available: SEC EDGAR for filings and FRED for macro data.
- Lightweight status files under `docs/status/`.

## Consider Later

- Polygon.io after plan/terms review.
- Financial Modeling Prep or Finnhub after data quality and licensing review.
- Tradier or Alpaca for future broker paper integration, with order endpoints disabled until approved.
- Cboe DataShop or premium options datasets for serious historical options research.
- TradingView Lightweight Charts, TanStack Table, shadcn/ui, and Recharts for UI implementation.
- QuantConnect LEAN, vectorbt, Qlib, Zipline Reloaded, or QuantStats for benchmark comparison or advanced research workflows.
- OpenAI Agents SDK or LangGraph if runtime agent orchestration becomes a product feature.

## Avoid

- Live broker trading in MVP.
- Broker MCP servers and order-placement tools.
- Crypto exchange execution APIs.
- AGPL dependencies as direct product dependencies without license review.
- Unofficial market-data scrapers as production sources.
- Black-box scores without component explanations.
- Recommendations without timestamps, source citations, downside scenarios, and risk/confidence scores.
- Heavy autonomous-agent memory systems before audit logs and deterministic workflows exist.

## Security Risks To Avoid

- Secret leakage through `.env`, prompts, logs, screenshots, MCP config, or repo history.
- Prompt injection from news, filings, web pages, or tool output.
- Excessive agent/tool permissions.
- Data licensing violations.
- Recommendations presented as guaranteed income or personalized advice.
- Options output without max-loss, expiration, liquidity, and spread risk.
- Broker or crypto execution paths before future approval.

## Things We Should Not Build Yet

- Live trading.
- Broker order placement.
- Crypto trading.
- Runtime autonomous trading agents.
- Strategy marketplace.
- Real-time execution dashboard.
- Advanced ML models before deterministic baselines.
- Full roadmap UI before the operator research and paper-trading workflow exists.

## Custom-Build

- Domain model and recommendation contract.
- Provider interfaces and normalization.
- Data freshness and quality checks.
- Explainable scoring engine.
- Risk manager and no-trade filters.
- Options liquidity, IV/RV, expiration, and max-loss analysis.
- Paper-trading ledger.
- MVP backtesting harness and metrics.
- Audit logs and operator workflow.

## Integrate From Existing Tools

- Financial charting: TradingView Lightweight Charts.
- Data tables: TanStack Table.
- UI primitives: shadcn/ui or equivalent React component system.
- Dashboard charts: Recharts.
- Future portfolio metrics: QuantStats-style metrics if dependency review passes.
- Future advanced backtesting: benchmark against LEAN/vectorbt/Zipline Reloaded after MVP.

## Codex / Agent Workflow Decisions

- Keep `AGENTS.md` as the top-level operating contract.
- Use skills for repeatable specialist workflows.
- Use subagents for review roles, not unsupervised autonomous trading.
- Use hooks for deterministic safety checks and reminders.
- Store decisions, lessons, open questions, and status in repo docs.
- Do not let Codex access broker credentials or real-money order tools.

## Application Decisions

- Every recommendation must include ticker, thesis, instrument type, strike/expiration logic when applicable, current context, news summary, earnings history, historical price behavior, volatility, liquidity, risk score, confidence score, bull case, bear case, risks, catalyst, invalidation, sizing framework for paper trading, alternatives, why the system might be wrong, and final decision.
- The system must be able to say `no good trades today`.
- Missing or stale data should reduce confidence or produce `needs more data`.
- Options are high risk and can expire worthless; the UI must show this risk near options ideas.
- No strategy can be promoted without backtest or paper-trading evidence.

## Final Implementation Priorities

1. Finish research-informed architecture and roadmap docs.
2. Scaffold the monorepo with type-safe app/API/packages.
3. Add database schema and migrations.
4. Add provider interfaces and mock providers.
5. Add ticker/price ingestion and data freshness checks.
6. Add news, earnings, fundamentals, and options ingestion adapters.
7. Add explainable scoring and risk/no-trade filters.
8. Add daily opportunity generation and audit logs.
9. Add operator dashboard and ticker/opportunity detail pages.
10. Add paper-trading ledger and basic backtesting harness.
