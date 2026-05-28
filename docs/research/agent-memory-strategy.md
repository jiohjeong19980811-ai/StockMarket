# Agent Memory Strategy Research

Last updated: 2026-05-28T13:38:53-04:00

## Official Codex Guidance

Codex memories can carry useful context across threads, but required project guidance should live in `AGENTS.md` and checked-in documentation. Memories are a helper layer, not the source of mandatory rules.

Sources:

- [OpenAI Codex memories](https://developers.openai.com/codex/memories)
- [OpenAI Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [OpenAI Codex subagents](https://developers.openai.com/codex/subagents)
- [OpenAI Codex skills](https://developers.openai.com/codex/skills)

## Durable Project Memory

Use checked-in files as durable memory:

- `AGENTS.md`: non-negotiable behavior and project operating rules.
- `docs/decision-log.md`: durable decisions, date, rationale, and consequences.
- `docs/lessons-learned.md`: reusable validation, architecture, data, and workflow lessons.
- `docs/open-questions.md`: unresolved risks, blockers, and questions.
- `docs/status/current-work.md`: current phase and active work.
- `docs/status/work-items.json`: machine-readable roadmap/work item status.
- `docs/status/research-progress.md`: external research coverage.
- `docs/status/validation-status.md`: validation state.

## Subagent Memory And Handoffs

Subagents should receive project context from:

- `AGENTS.md`.
- `.codex/agents/*.toml` developer instructions.
- `SubagentStart` hook reminders.
- Task-specific prompt.

Subagents should return:

- What was reviewed or changed.
- Files touched.
- Key findings.
- Risks discovered.
- Tests run.
- Tests not run.
- Recommendations.
- Open questions.

## App-Level Memory Later

When the application exists, runtime memory should be explicit data, not hidden agent recall:

- Stored recommendations.
- Stored daily scores.
- Stored paper trades.
- Stored backtest runs.
- Stored audit logs.
- Stored operator decisions.
- Stored source citations and timestamps.

This is essential because financial research must be auditable and reproducible.

## CEO / CTO Decision

Use repo documentation and status files as the primary memory system. Allow Codex personal memories only as convenience. Do not depend on personal memory for financial safety, architecture, provider choices, or compliance boundaries.
