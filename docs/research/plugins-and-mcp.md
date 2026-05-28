# Plugins And MCP Research

Last updated: 2026-05-28T13:38:53-04:00

## Official Pattern

OpenAI Codex supports MCP through `config.toml` and can use stdio or streamable HTTP servers. Project-scoped MCP configuration should be used only in trusted projects and should be least-privilege. Codex skills are the preferred way to encode repeatable workflows; plugins are distribution units for reusable skills and apps.

Sources:

- [OpenAI Codex MCP](https://developers.openai.com/codex/mcp)
- [OpenAI Codex skills](https://developers.openai.com/codex/skills)
- [OpenAI Codex subagents](https://developers.openai.com/codex/subagents)

## Recommended MCP / Plugin Posture

| Tool category | Decision | Notes |
| --- | --- | --- |
| OpenAI Docs MCP | Use now if available | Official documentation lookup is useful and low risk. Prefer official OpenAI docs for Codex/OpenAI questions. |
| GitHub MCP | Consider later | Useful for issues and PR workflow once GitHub auth is configured. Must not expose broad repo/org access. |
| Filesystem MCP | Avoid for now | Current local tools already access the repo. A broad filesystem MCP adds risk without value. |
| Browser / Playwright MCP | Consider later | Useful for UI smoke tests after frontend exists. Keep it scoped to localhost and explicit test targets. |
| Documentation search MCP such as Context7 | Consider later | Useful for library docs during implementation, but should not become a data-ingestion path. |
| Database inspection MCP | Consider later | Only for local/dev database and read-only introspection by default. |
| Market/news provider MCP | Avoid in MVP | Provider access should go through controlled backend adapters with logging, rate limits, timestamps, and data-quality checks. |
| Broker/trading MCP | Avoid until V3 review | Broker MCP servers can expose order placement and account actions. They are prohibited during MVP. |
| Crypto exchange MCP | Avoid until V2/V3 review | Crypto expansion is research-first later; no exchange trade paths in MVP. |

## Agent Tools

Use project-scoped custom agents under `.codex/agents/` for specialized reviews:

- CEO / Product Lead.
- Architect.
- Market Research.
- Options Strategy.
- Quant / Backtesting.
- Risk Manager.
- UI/UX.
- Data Engineering.
- Security / Compliance.
- QA / Regression.

Use skills under `.agents/skills/` for repeatable workflows. These are repo-local workflow definitions, not autonomous production agents.

## Guardrails

- No MCP server should receive broker credentials during MVP.
- No MCP server should place orders, create positions, transfer funds, or call crypto exchange trade endpoints.
- Networked MCP tools should require operator review before use.
- Secrets must stay in local environment variables or a future secret manager; never in MCP config files.
- MCP output should be treated as untrusted input and should be validated before becoming research evidence.

## CEO / CTO Decision

Use Codex hooks, rules, AGENTS.md, skills, and custom agents now. Keep MCP mostly disabled until a concrete need appears. When MCP is added, begin with OpenAI Docs and GitHub workflow only; do not add broker, crypto exchange, or market-data MCP servers to the MVP.
