# Agent Team

## Codex Support Model

Codex supports checked-in `AGENTS.md`, repo skills in `.agents/skills`, project `.codex/config.toml`, and project-scoped custom agents in `.codex/agents`. Subagents run only when explicitly requested. This repo defines custom agents as task-specific reviewer and implementation roles, but they are not autonomous workers running in the background.

The current research summary is `docs/research/recommendation-summary.md`. Agents should consult it before proposing framework, provider, MCP, security, UI, or backtesting changes.

Official Codex setup references used for this design:

- https://developers.openai.com/codex/guides/agents-md
- https://developers.openai.com/codex/skills
- https://developers.openai.com/codex/subagents
- https://developers.openai.com/codex/mcp
- https://developers.openai.com/codex/permissions

## Roles

### CEO / Product Lead Agent

Owns roadmap, MVP scope, acceptance criteria, tradeoffs, release sequencing, and `docs/status/` visibility. Blocks scope creep that would bypass research, paper trading, or risk controls.

### Architect Agent

Owns system design, module boundaries, data contracts, scalability, maintainability, technical decisions, and research-informed build-vs-integrate choices.

### Market Research Agent

Owns news, earnings, fundamentals, macro context, sector context, ticker-specific research quality, and data-provider evidence notes.

### Options Strategy Agent

Owns options-chain analysis, expiration and strike logic, implied volatility, liquidity filters, defined-risk structures, and no-trade rules.

### Quant / Backtesting Agent

Owns strategy validation, historical simulation, assumptions, slippage, spread modeling, market-regime review, statistical rigor, and comparison against external backtesting references after MVP.

### Risk Manager Agent

Owns risk controls, position sizing framework, no-trade rules, drawdown logic, downside scenarios, and live-trading gates.

### UI/UX Agent

Owns dashboard layout, operator decision workflow, risk visibility, source visibility, scan-friendly information architecture, and the future Project Status / Roadmap dashboard.

### Data Engineering Agent

Owns ingestion, provider adapters, database schema, data quality checks, scheduling, idempotency, and observability.

### Security / Compliance Agent

Owns secrets, permissions, MCP boundaries, broker restrictions, audit logs, and live-trading safeguards.

### QA / Regression Agent

Owns test strategy, regression coverage, validation scripts, CI readiness, and release checks.

## How To Use The Team

Use a single agent for routine edits. Ask Codex to spawn subagents only for broad reviews or parallel research. Example:

```text
Spawn the architect, risk-manager, security-compliance, and qa-regression agents to review this branch for MVP readiness. Wait for all results and summarize blockers first.
```

## Repo Skills

The repo includes these checked-in skills:

- `market-research-skill`
- `options-analysis-skill`
- `earnings-analysis-skill`
- `backtesting-skill`
- `paper-trading-review-skill`
- `risk-review-skill`
- `ui-dashboard-review-skill`
- `data-quality-skill`
- `security-review-skill`
- `daily-report-skill`

Skills are workflow guides. Custom agents are role-specific reviewers or implementers. Use skills for repeatable task procedure and agents for independent perspective.

## Plugin And Skill Governance

Use `docs/plugin-skill-governance.md` for the current adoption policy for visible Codex plugins and skills. The main Codex operator remains the final decision-maker. Subagents may use approved tools only within their documented role, and no plugin or skill may bypass provider adapters, risk controls, evidence gates, audit logs, or the no-live-execution MVP boundary.

## Lifecycle Hook Support

Project hooks add guardrails around agent work:

- `SessionStart` reminds agents of core project state.
- `SubagentStart` injects MVP safety rules into spawned agents.
- `SubagentStop` requests structured handoff summaries.
- `Stop` reminds the lead agent to update decisions, lessons, open questions, and validation status.
- `Stop` also reminds the lead agent to update lightweight status files when current work, blockers, research progress, or validation state changes.

Agents should treat hook output as project policy context.
