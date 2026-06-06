# Plugin And Skill Governance

Last updated: 2026-06-05T21:07:16-04:00

## Purpose

This file records how the main Codex operator may use visible plugins and skills for StockMarket. The goal is to benefit from specialized tools without weakening the app's research-first, paper-trading-first, no-live-execution boundary.

Only plugins and skills visible in the current Codex session are evaluated here. Any newly installed plugin, connector, MCP server, or skill must be reviewed before use.

## Universal Rules

- The main Codex operator is the final decision-maker for tool adoption.
- Subagents may use approved skills only within their documented role.
- No plugin, skill, subagent, MCP server, or connector can bypass risk gates, evidence gates, audit logs, provider adapters, or operator decision records.
- Broker order placement, live-trading credentials, margin assumptions, naked options selling, and real-money execution remain prohibited in the MVP.
- Market data tools are research or provider-evaluation aids only until terms, entitlements, timestamps, storage rights, and adapter contracts are reviewed.
- Third-party tools must not receive secrets, `.env` contents, provider keys, broker credentials, private database dumps, or unredacted sensitive logs.
- All investment-facing output must include uncertainty, citations, source timestamps, freshness, downside, invalidation, liquidity/risk notes, and a non-advice framing.

## Plugin Decisions

| Plugin | What it does | Relevance | Access and risk | Decision | Primary user |
| --- | --- | --- | --- | --- | --- |
| Browser | Drives the in-app browser for localhost, file, and visible web UI inspection. | High for operator-console smoke tests and UI QA. | Can view local pages and screenshots; avoid exposing secrets in pages or screenshots. External web pages are untrusted. | Use now for local app UI testing and screenshots; external browsing only when task-relevant. | Frontend/UI agent, main Codex operator, QA. |
| Build Web Data Visualization | Guides chart, dashboard, map, report, accessibility, and visualization QA work. | High for future research dashboards, backtest views, and operator monitoring. | Uses provided or app data; risk is overstating analytical meaning or hiding caveats. | Use now for chart/design choices and dashboard QA, with citations and caveats preserved. | Frontend/UI agent, data engineering agent, main operator. |
| CodeRabbit | Runs third-party AI review over git diffs or PRs. | Useful for high-risk PR review and regression detection. | Sends code/diffs to a third-party review service; never include secrets or private data dumps. | Use selectively after local validation for significant PRs or explicit review requests; do not auto-run on secret-bearing diffs. | Main operator, QA, security reviewer. |
| Data Analytics | Builds source-backed analytical dashboards, reports, KPI frameworks, diagnostics, and charts. | Useful for internal project/status analytics, validation reports, backtest summaries, and operator dashboards. | May use connected business/data sources or generated artifacts; must not become an unreviewed market data source of truth. | Use selectively for dashboards/reports from reviewed app data; defer connector-heavy workflows until source access is approved. | Main operator, data engineering agent, frontend/UI agent, quant/backtesting agent. |
| LSEG | Financial market data, company intelligence, and news plugin. | Potentially high for future public-company research and provider evaluation. | Likely requires licensed data access and entitlement review. No callable LSEG tool is visible in this session. | Defer as an app data source. If callable access appears later, use only for manual research comparison until terms and backend adapter rules are approved. | Main operator and market research subagent for evaluation; data engineering for later adapter review. |
| Product Design | Product design research, UX audits, ideation, visual targets, and image-to-code prototype flows. | Useful for UI review and focused redesign work, but the app already has a codebase and workflow constraints. | Can generate visuals/prototypes; risk is replacing domain-specific operator workflows with generic product-design output. | Use selectively for UI audits or visual exploration when requested; do not let it override existing app patterns or finance risk visibility. | Frontend/UI agent, main operator. |
| Public Equity Investing | Routes listed-equity investor workflows such as thesis, earnings, valuation, catalysts, and position sizing. | Domain-relevant, but its outputs must be adapted to StockMarket's research-only and paper-only contracts. | May depend on connected source tools and investment framing; risk is advice-like recommendations or unsupported sizing. | Use selectively for explicit listed-equity research workflows after invoking repo risk/research skills; no direct strategy promotion or real-money sizing. | Market research subagent, risk review subagent, main operator. |
| Superpowers | Engineering process skills for TDD, debugging, planning, branch completion, code review, and verification. | High for software delivery discipline. | No market data access by itself; risk is process overhead or subagent overuse. | Use now for development workflow where the matching skill applies. | Main operator and implementation/review agents. |

## Repo Skill Decisions

| Skill | What it does | Decision | Primary user |
| --- | --- | --- | --- |
| `market-research-skill` | Guides cited ticker/company research, catalysts, timestamps, and uncertainty. | Use now for ticker research and opportunity narratives. | Market research subagent, main operator. |
| `options-analysis-skill` | Reviews options chains, strikes, expirations, IV, liquidity, spreads, theta, event risk, and max loss. | Use now for options review, but options paper candidates remain deferred until data and validation gates support them. | Options analysis subagent, risk review subagent. |
| `earnings-analysis-skill` | Reviews earnings events, surprises, guidance, run-up behavior, and IV crush risk. | Use now for earnings context and catalyst review. | Market research subagent, options analysis subagent. |
| `backtesting-skill` | Reviews strategy evidence, assumptions, promotion gates, metrics, and sample quality. | Use now for backtest design and validation gates. | Backtesting/quant validation subagent. |
| `paper-trading-review-skill` | Reviews simulated entries/exits, P/L, thesis quality, stops, targets, and lessons learned. | Use now for paper-trade evaluation and auditability. | Risk review subagent, main operator. |
| `risk-review-skill` | Enforces downside, invalidation, confidence, no-trade rules, paper sizing, and no-live-trading boundaries. | Use now on recommendation, scoring, options, and paper-trading changes. | Risk review subagent, main operator. |
| `ui-dashboard-review-skill` | Reviews operator dashboard and detail pages for scanability, risk visibility, and decision support. | Use now for UI changes. | Frontend/UI agent, main operator. |
| `data-quality-skill` | Reviews ingestion, provider adapters, timestamps, freshness, normalization, anomalies, and lineage. | Use now for provider/data workflows. | Data engineering agent. |
| `security-review-skill` | Reviews secrets, credentials, permissions, MCP configuration, dependency risk, and prohibited order paths. | Use now for plugin/provider/security-sensitive changes. | Security reviewer, main operator. |
| `daily-report-skill` | Guides daily research reports with ranked opportunities, no-good-trades outcomes, citations, risks, and actions. | Use once daily opportunity reporting is active; useful now for report contract checks. | Market research subagent, risk review subagent, main operator. |

## System Skill Decisions

| Skill | What it does | Decision | Primary user |
| --- | --- | --- | --- |
| `imagegen` | Generates or edits bitmap images. | Defer for the core app; use only for non-data visual assets when a bitmap is genuinely useful. Never use it for financial charts or evidence. | Frontend/UI agent. |
| `openai-docs` | Fetches current OpenAI/Codex documentation. | Use now for OpenAI API, Codex, MCP, or hook documentation questions. | Main operator, architect. |
| `plugin-creator` | Scaffolds Codex plugins and marketplace entries. | Defer until the operator explicitly wants a project plugin. | Main operator only. |
| `skill-creator` | Creates or updates Codex skills. | Defer until a repo skill needs an explicit update. | Main operator only. |
| `skill-installer` | Installs curated or repo-based Codex skills. | Use only with explicit operator approval because it changes local capability surface. | Main operator only. |

## Plugin Skill Decisions

| Skill | What it does | Decision | Primary user |
| --- | --- | --- | --- |
| `browser:control-in-app-browser` | Opens, clicks, inspects, and screenshots local/browser targets. | Use now for local UI smoke tests and focused browser inspection. | Frontend/UI agent, QA, main operator. |
| `build-web-data-visualization:data-visualization` | Chooses visualization routes, encodings, mobile/accessibility rules, QA, and export strategy. | Use now for research/backtest/dashboard visualizations. | Frontend/UI agent, data engineering, quant/backtesting. |
| `coderabbit:code-review` | Runs CodeRabbit AI review and summarizes issues. | Use selectively for significant PRs or explicit review requests; avoid when diffs contain secrets or private data. | QA, security reviewer, main operator. |
| `data-analytics:index` | Routes broad source-backed analytics work. | Use selectively for app/project analytics, not as a market data source of truth. | Main operator, data engineering. |
| `data-analytics:build-dashboard` | Builds analytical dashboards and monitoring views. | Use for future status, backtest, and research dashboards once source data is reviewed. | Frontend/UI agent, data engineering. |
| `data-analytics:build-report` | Builds polished evidence-backed analytical reports. | Use for internal validation or project reports; finance-facing reports need risk/compliance review. | Main operator, quant/backtesting, market research. |
| `data-analytics:design-kpis` | Designs KPI frameworks and measurement plans. | Use for product/engineering KPIs, not for claiming strategy profitability. | Main operator, product lead. |
| `data-analytics:kpi-reporting` | Produces KPI scorecards and performance updates. | Use for project/MVP status reporting after metrics exist. | Main operator, product lead. |
| `data-analytics:market-sizing` | Estimates TAM/SAM/SOM and opportunity size. | Not needed for current MVP implementation; use only for product/business planning. | Main operator, product lead. |
| `data-analytics:metric-diagnostics` | Diagnoses why metrics moved. | Use after telemetry, paper-trade metrics, or validation metrics exist. | Data engineering, quant/backtesting. |
| `data-analytics:product-business-analysis` | Analyzes product/business data and recommendations. | Use for product roadmap decisions, not for investment recommendations. | Main operator, product lead. |
| `data-analytics:visualize-data` | Designs and QA's charts. | Use for charts backed by reviewed app data. | Frontend/UI agent, quant/backtesting. |
| `product-design:index` | Routes Product Design workflows. | Use only for explicit UX/design work, not routine app implementation. | Frontend/UI agent, main operator. |
| `product-design:get-context` | Confirms design brief before visual work. | Use when starting a Product Design workflow. | Frontend/UI agent. |
| `product-design:ideate` | Generates visual alternatives after a confirmed brief. | Defer unless the operator asks for design variants. | Frontend/UI agent. |
| `product-design:image-to-code` | Implements a selected visual target. | Defer unless a chosen mockup/screenshot/Figma target exists. | Frontend/UI agent. |
| `public-equity-investing:public-equity-investing` | Routes explicit listed-equity investment workflows. | Use selectively for public-company research with repo risk/research rules layered on top; avoid position-sizing or recommendation outputs that imply real-money action. | Market research subagent, risk review subagent. |
| `superpowers:using-superpowers` | Requires applicable skills to be used. | Use as the default skill-selection guardrail. | Main operator. |
| `superpowers:brainstorming` | Explores requirements before creative/product work. | Use for material feature or UX behavior changes; keep concise for narrow roadmap items. | Main operator, product lead, frontend/UI. |
| `superpowers:test-driven-development` | Drives red-green-refactor implementation. | Use for feature and bugfix code changes. | Main operator, implementation agents. |
| `superpowers:systematic-debugging` | Guides investigation before fixes. | Use for failing tests, bugs, or unexpected behavior. | Main operator, QA, implementation agents. |
| `superpowers:verification-before-completion` | Requires validation evidence before completion claims. | Use before marking items complete, committing, PR creation, or merge. | Main operator, QA. |
| `superpowers:writing-plans` | Creates implementation plans for multi-step work. | Use for larger features or cross-module changes. | Main operator, architect. |
| `superpowers:executing-plans` | Executes an existing written plan with checkpoints. | Use when a plan exists and work is substantial. | Main operator, implementation agents. |
| `superpowers:dispatching-parallel-agents` | Coordinates independent parallel agent tasks. | Use only when subagent delegation is explicitly requested and tasks are independent. | Main operator. |
| `superpowers:subagent-driven-development` | Manages multi-subagent implementation. | Defer unless the user explicitly asks for subagents or a broad parallel review. | Main operator. |
| `superpowers:requesting-code-review` | Requests review before merge or major completion. | Use for significant branches and merge readiness. | Main operator, QA. |
| `superpowers:receiving-code-review` | Evaluates review feedback rigorously. | Use when external or subagent review feedback arrives. | Main operator. |
| `superpowers:finishing-a-development-branch` | Guides PR/merge/cleanup after implementation passes. | Use when a development branch is ready for integration. | Main operator. |
| `superpowers:using-git-worktrees` | Creates isolated worktrees when useful. | Use only when isolation is needed; current repo branch workflow is sufficient. | Main operator. |
| `superpowers:writing-skills` | Creates or edits skills safely. | Defer until repo skill maintenance is explicitly needed. | Main operator. |

## Agent Access Map

| Role | Approved plugin/skill families |
| --- | --- |
| Main Codex operator | All approved skills as needed; final authority over adoption, docs, status, commits, PRs, and merges. |
| Market research subagent | Repo market/earnings/daily-report skills; Public Equity Investing only for explicit public-security research; LSEG only after access is visible and terms are reviewed. |
| Options analysis subagent | Repo options and earnings skills; Public Equity Investing only for context, not options promotion; no broker/order tools. |
| Backtesting/quant validation subagent | Backtesting skill, Data Analytics for reviewed metrics/reports, Build Web Data Visualization for charts; no provider bypass. |
| Risk review subagent | Risk, security, paper-trading review, options review, Public Equity Investing for investment-framing critique only. |
| Frontend/UI agent | UI dashboard skill, Browser, Build Web Data Visualization, selected Data Analytics chart/dashboard skills, Product Design only for explicit design work. |
| Data engineering agent | Data-quality skill, Data Analytics validation/reporting, LSEG only for future adapter evaluation after entitlement review. |
| Not used by default | Plugin/skill installation, plugin creation, Product Design image-to-code, CodeRabbit, and LSEG/Public Equity data access unless a task explicitly requires them and safety gates are satisfied. |

## Required Documentation Updates When Adopting A Tool

- Update `docs/plugin-skill-governance.md` with the adoption decision.
- Update `docs/security.md` when a tool changes permissions, external data flow, third-party code sharing, MCP scope, or credential handling.
- Update `docs/data-sources.md` before any provider-like tool influences app data, storage, backtests, or recommendations.
- Update `docs/agent-team.md` when a tool changes agent responsibilities.
- Update `docs/open-questions.md` for unresolved terms, entitlements, data rights, provider access, or review-process questions.
- Update `docs/decision-log.md` for durable policy decisions.
