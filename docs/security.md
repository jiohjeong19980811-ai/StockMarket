# Security

## Security Goals

- Keep secrets out of the repository.
- Keep Codex and automation access least-privilege.
- Prevent accidental live trading.
- Preserve auditability for data, recommendations, and operator actions.
- Make risky actions explicit and reviewable.

## Secrets Management

- Never commit `.env`, API keys, broker tokens, private keys, local database dumps, or provider credentials.
- Use `.env.example` only for placeholder names.
- Validate required environment variables at runtime.
- Store production secrets in a managed secret store when deployed.
- Rotate a secret immediately if it is exposed in logs, commits, screenshots, or artifacts.

## Codex Permissions

The project `.codex/config.toml` uses a workspace-scoped permission profile and denies common secret file patterns. It configures the OpenAI developer docs MCP server only. Do not add broad filesystem, browser, broker, or trading MCP servers without explicit operator approval.

Routine in-repository work may be auto-approved by the `PermissionRequest` hook when it is limited to local tests, builds, CI, hook validation, status/diff inspection, branch switching, commits, or lockfile-based dependency installation. Dependency additions, remote publication, GitHub issue/PR creation, out-of-repository writes, secret access, and live-trading/order paths remain prompt-gated or blocked.

## Research Basis

Security decisions are informed by OWASP LLM guidance, NIST AI RMF guidance, MCP security best practices, GitHub secret scanning guidance, SEC automated investment advice materials, and official options/crypto risk disclosures. See `docs/research/security-and-compliance.md`.

## Lifecycle Hooks

The project uses official Codex lifecycle hooks in `.codex/hooks.json` with scripts under `.codex/hooks/`.

Hooks detect or block:

- Secret-like prompt text and `.env` reads.
- Dangerous deletion commands.
- Global git config changes.
- Remote script execution with `curl | bash` or equivalent.
- Broad or out-of-repo write attempts.
- Live-trading enablement during MVP.
- Broker order placement patterns.
- Requests to bypass risk, approval, audit, or paper-trading controls.

Hooks do not send prompts, code, or trade ideas to third-party services. They are local deterministic checks and reminders.

## MCP Policy

Allowed by default:

- OpenAI developer documentation MCP for read-only documentation search.

Possible later with review:

- GitHub MCP for issues and PRs.
- Local database inspection for a development database only.
- Browser tooling for local UI testing.

Prohibited in MVP:

- Broker live-trading MCP servers.
- MCP servers with broad machine-wide filesystem access.
- MCP servers that can submit real orders.
- Market provider MCP servers that bypass backend provider adapters.

## AI And Prompt-Injection Controls

- Treat news articles, filings, provider payloads, web pages, and MCP/tool output as untrusted data.
- Keep system rules, risk controls, and execution permissions outside retrieved content.
- Require source citations and timestamps for AI-generated summaries.
- Do not let AI generate quantitative prices, IV, Greeks, earnings dates, or options-chain values without deterministic source data.
- Do not send prompts, trade ideas, or source data to third-party services beyond approved model/provider workflows.

## Secret Scanning Plan

- Continue local regex-based scans during foundation work.
- Add a dedicated secret scanner such as GitHub secret scanning/push protection, `detect-secrets`, `git-secrets`, or equivalent once CI is configured.
- Rotate immediately if any real key appears in repo history, prompts, logs, screenshots, or artifacts.

## Broker And Trading Safeguards

MVP must not contain live trading code. Future paper broker integration must:

- Use paper credentials only.
- Be disabled by default.
- Require explicit configuration.
- Write complete audit logs.
- Never place live orders.

Future live trading requires a separate approval milestone and must include a kill switch, max daily loss, max position size, trade approval queue, and incident rollback process.

## Audit Logging

Audit logs must capture:

- Data ingestion runs.
- Provider responses and timestamps.
- Scoring versions.
- AI prompt/model versions when used.
- Recommendations and risk decisions.
- Operator actions.
- Paper-trading entries and exits.
- Configuration changes affecting risk or execution.

## Dependency Security

- Review new dependencies before adding them.
- Prefer mature, maintained packages.
- Track licenses.
- Run dependency audit tools in CI once the stack is chosen.
- Avoid installing packages during production runs.

## Prohibited Actions

- Committing secrets.
- Logging secrets.
- Using live broker credentials in development.
- Adding code that can place a live order in MVP.
- Disabling audit logs for recommendation or paper-trading flows.
- Using undocumented data sources in recommendations.
- Returning trade ideas without risk, citations, timestamps, and uncertainty.
