# Current Work Status

Last updated: 2026-06-05T16:25:00-04:00

## Current Focus

| Field | Value |
| --- | --- |
| Current phase | Milestone 7: Backtesting |
| Current task | Add mock API read model for durable stock backtest runs |
| Owner/agent | Codex acting as founding CTO / lead architect / principal engineer / risk reviewer / quantitative research lead |
| Status | Needs Review |
| Priority | High |
| Category | Backtesting API visibility |
| Blockers | Root CI dependency audit stops on an existing `vitest@3.2.4` dev-tooling advisory; `npm install --save-dev vitest@^4.1.8` was blocked by the current permission policy; runtime dependency audit with `--omit=dev` is clean. |
| Next step | Run an approved Vitest upgrade to a non-vulnerable release, then rerun root CI before PR merge. Autonomous PR/merge policy is documented in `docs/codex-setup.md` and `docs/decision-log.md`. |
| Related docs/files | `packages/db/src/backtest-run-ledger.ts`, `packages/db/test/backtest-run-ledger.test.ts`, `apps/api/src/server.ts`, `apps/api/test/backtesting.test.ts`, `docs/backtesting-and-validation.md`, `docs/risk-and-compliance.md`, `docs/product-roadmap.md`, `docs/codex-setup.md`, `docs/decision-log.md`, `docs/open-questions.md` |
| Validation required | Focused DB/API tests, type check, lint, format check, root tests, hook tests, build, API smoke, status JSON parse, secret scan, live-trading surface scan, and dependency audit resolution before PR merge. |

## Status Vocabulary

- Planned
- In Progress
- Blocked
- Needs Review
- Completed
- Deferred

## Update Rule

Update this file when the active phase, task, blocker, owner, or validation state changes. Keep it short enough for a future Project Status / Roadmap dashboard to parse or summarize.
