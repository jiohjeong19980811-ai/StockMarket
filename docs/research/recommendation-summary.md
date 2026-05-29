# External Research Recommendation Summary

Last updated: 2026-05-29T12:48:32-04:00

## Executive Decision

Proceed with a custom, modular MVP focused on research, explainability, paper trading, and auditability. Use external repositories and frameworks as references, not as the core product foundation. Do not implement live trading, broker order placement, crypto trading, autonomous portfolio management, or guaranteed-return language.

Quant strategy research has been added in `docs/research/quant-strategies.md`. Strategy families are hypotheses only. No strategy should be shown as guaranteed profitable, promoted as passive income, or allowed to produce `paper trade` candidates without reproducible backtesting or paper-trading evidence.

## Quant Strategy Decisions

Test first in MVP:

- Stock-only post-earnings announcement drift and earnings surprise continuation with strict event timestamp rules.
- Liquid stock/ETF momentum and relative strength with capped turnover.
- Volatility-adjusted mean reversion on large liquid stocks/ETFs only.
- News and sentiment as catalyst/watchlist context, not as a standalone trade generator.
- Value and quality as context for confidence and risk, not as standalone short-term timing.
- Portfolio and risk overlays: max paper position size, sector exposure limits, drawdown guard, stale-data gate, and `no good trades today`.

Defer:

- Options recommendations until historical options chains, bid/ask, IV, Greeks, open interest, volume, and realistic fill assumptions are available.
- Sector rotation until sector/macro data and portfolio-risk views exist.
- Pairs/stat-arb until shorting, borrow, and portfolio risk can be modeled without implying live trading.
- ML strategy research until deterministic baselines, feature lineage, trial tracking, and walk-forward validation exist.
- Crypto research until the equities/options MVP is stable; crypto execution remains out of scope.

Avoid in MVP:

- Naked options, short volatility, 0DTE, market making, HFT, margin, leverage, broker order placement, crypto exchange execution, and any strategy that depends on optimistic fills or ignored costs.

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
- Strategy registry fields and evidence gates for earnings, momentum, mean reversion, volatility, options, news/sentiment, value/quality, sector/macro, and portfolio risk.
- MVP strategy tests limited to liquid stock/ETF strategies until options-chain evidence is available.
- Durable evidence resolution for paper-trade evidence IDs before any recommendation or strategy promotion trusts paper-trade outcomes.
- Official sources where available: SEC EDGAR for filings and FRED for macro data.
- Lightweight status files under `docs/status/`.

## Consider Later

- Polygon.io after plan/terms review.
- Financial Modeling Prep or Finnhub after data quality and licensing review.
- Tradier or Alpaca for future broker paper integration, with order endpoints disabled until approved.
- Cboe DataShop or premium options datasets for serious historical options research.
- TradingView Lightweight Charts, TanStack Table, shadcn/ui, and Recharts for UI implementation.
- QuantConnect LEAN, vectorbt, Qlib, Zipline Reloaded, or QuantStats for benchmark comparison or advanced research workflows.
- PyPortfolioOpt or cvxportfolio for later portfolio-construction references after MVP risk controls are proven.
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
- Options recommendations from underlying-only proxy backtests.
- Strategies selected from broad parameter sweeps without trial tracking, out-of-sample validation, and overfitting skepticism.

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
- Strategy registry and evidence gates.
- Event-study rules for earnings and news catalysts.
- Point-in-time validation checks for fundamentals, earnings, news, and options.
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
- Paper-trading evidence must resolve to persisted, closed, paper-only, broker-disabled records in the same ticker/instrument/strategy cohort before it can count as verified evidence.

## Final Implementation Priorities

1. Finish research-informed architecture and roadmap docs.
2. Scaffold the monorepo with type-safe app/API/packages.
3. Add database schema and migrations.
4. Add provider interfaces and mock providers.
5. Add ticker/price ingestion and data freshness checks.
6. Add news, earnings, fundamentals, and options ingestion adapters.
7. Add strategy registry, evidence gates, and point-in-time backtest contracts.
8. Add explainable scoring and risk/no-trade filters.
9. Add daily opportunity generation and audit logs.
10. Add operator dashboard and ticker/opportunity detail pages.
11. Add paper-trading ledger and basic backtesting harness.
