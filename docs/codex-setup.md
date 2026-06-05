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
- Routine in-repository commands such as tests, builds, CI, `npm ci`, status checks, branch switching, and hook validation may be auto-approved by the `PermissionRequest` hook.
- `approval_policy.granular.sandbox_approval` is enabled so the `PermissionRequest` hook can resolve routine sandbox prompts without waiting on the operator when the hook policy allows them.
- Common secret files are denied.
- Network is allowlisted for OpenAI docs/API, GitHub, and package registries.
- No broker, trading, or broad filesystem MCP servers are configured.

Future market data provider domains should be added deliberately with a matching adapter and security review.

Codex hooks use the canonical `[features] hooks = true` feature key. If Codex reports a deprecated `[features].codex_hooks` warning, check user, profile, system, or launch-flag configuration outside this repository; the project-local config does not use that deprecated key.

## Autonomous PR And Merge Policy

The lead Codex operator should use feature branches for implementation work and may prepare PR-tracked handoffs when work is ready. A branch is ready for PR/merge only after the current item is documented in `docs/status/`, the worktree is clean, and the required validation gate is green.

Required local gate before merge:

- `npm.cmd run ci`.
- `python -m json.tool docs/status/work-items.json`.
- `git diff --check`.
- Secret-pattern scan over changed code, scripts, docs, hooks, and config.
- Live-trading/order-surface scan over changed code, scripts, docs, hooks, and config.

If GitHub branch protection or CI checks are configured, those checks must also pass before merge. As of 2026-06-05, `main` is not protected on GitHub and the authenticated viewer has `ADMIN`, so repo policy is stricter than GitHub's current server-side gate.

Current permission boundary:

- `.codex/rules/stockmarket.rules` prompts for `git push`, `gh pr create`, and dependency installation.
- In sessions where approval prompts cannot be answered, prompted actions fail instead of running.
- To make PR creation and merge autonomous, the operator must explicitly approve either a session/profile permission mode that can answer those prompts or a narrow project rule change that allows `git push`, `gh pr create`, and `gh pr merge` for this repository after the local gate passes.
- Dependency changes should remain reviewed unless the operator approves a narrow security-remediation allowance, such as upgrading a vulnerable direct dev dependency after audit output identifies the fixed version.

Actions that still require explicit operator approval:

- Any live trading, broker credential, broker order placement, margin, shorting, naked options, or crypto trading work.
- Real provider keys, paid-provider terms acceptance, or broad data-provider network activation.
- Broad MCP/server access, non-workspace filesystem access, or new secret storage.
- Destructive repository actions such as discard, force-push, branch deletion, history rewrite, or production credential changes.
- Dependency additions that are not narrow security remediations or already covered by an approved implementation plan.

After each merge, the lead Codex operator should choose the next task from `docs/status/work-items.json` by clearing `Blocked` or `Needs Review` items first, then the highest-priority planned item in milestone order. Later milestones should not start while the current milestone has unresolved blockers unless `docs/open-questions.md` or the operator explicitly defers the blocker.

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
