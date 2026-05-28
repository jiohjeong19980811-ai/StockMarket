# Codex Setup

## Source Of Truth

This setup follows current OpenAI Codex documentation:

- AGENTS.md: https://developers.openai.com/codex/guides/agents-md
- Config basics: https://developers.openai.com/codex/config-basic
- Config reference: https://developers.openai.com/codex/config-reference
- Permissions: https://developers.openai.com/codex/permissions
- Rules: https://developers.openai.com/codex/rules
- MCP: https://developers.openai.com/codex/mcp
- OpenAI Docs MCP: https://developers.openai.com/learn/docs-mcp
- Skills: https://developers.openai.com/codex/skills
- Subagents: https://developers.openai.com/codex/subagents
- Memories: https://developers.openai.com/codex/memories
- Sandbox: https://developers.openai.com/codex/concepts/sandboxing

## Repo Files

- `AGENTS.md` gives durable repo guidance for all future Codex sessions.
- `.codex/config.toml` defines project-scoped permissions, agent limits, and the read-only OpenAI docs MCP server.
- `.codex/hooks.json` registers official Codex lifecycle hooks for project guardrails.
- `.codex/hooks/` contains deterministic local hook scripts, tests, and policies.
- `.codex/rules/stockmarket.rules` prompts for remote publishing, GitHub issue/PR creation, and dependency installation.
- `.codex/agents/*.toml` defines explicit custom subagent roles for reviews and parallel work.
- `.agents/skills/*/SKILL.md` defines repeatable workflows for research, options, earnings, backtesting, paper trading, risk, UI, data quality, security, and daily reports.
- `docs/status/` tracks current work, roadmap item status, research progress, and validation state for future project-status UI use.
- `docs/research/` contains the external research phase and CEO/CTO implementation recommendations.

## Permission Model

The project profile is intentionally narrow:

- Workspace writes are allowed.
- Common secret files are denied.
- Network is allowlisted for OpenAI docs/API, GitHub, and package registries.
- No broker, trading, or broad filesystem MCP servers are configured.

Future market data provider domains should be added deliberately with a matching adapter and security review.

## Memory And Rules

Required team guidance belongs in checked-in files, especially `AGENTS.md` and `docs/`. Codex memories can help local recall if the operator enables them, but they are not the primary control surface for mandatory project rules.

Current durable memory files:

- `docs/decision-log.md`
- `docs/lessons-learned.md`
- `docs/open-questions.md`
- `docs/status/current-work.md`
- `docs/status/work-items.json`
- `docs/status/research-progress.md`
- `docs/status/validation-status.md`

## Validation

Current setup validation:

- Skill validator passes for all repo skills.
- Project TOML files parse successfully.
- `.codex/hooks.json` parses successfully.
- Hook policy unit tests pass with `python -m unittest discover .codex/hooks/tests`.
- Placeholder scan is clean.
- Basic secret-pattern scan is clean.
- Status JSON should parse after every edit to `docs/status/work-items.json`.

Application type checks, tests, builds, migrations, and UI smoke tests will be added once the app scaffold exists.
