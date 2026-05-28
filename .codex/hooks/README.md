# Codex Lifecycle Hooks

## Overview

This directory contains project-local Codex lifecycle hooks configured by `.codex/hooks.json`. The setup uses the official Codex hook mechanism, not a custom replacement.

Codex requires non-managed project hooks to be reviewed and trusted before they run. Use `/hooks` in Codex to inspect, trust, or disable changed hook definitions.

## Hook Events

- `SessionStart`: surfaces core project guidance and checks durable project memory files.
- `UserPromptSubmit`: blocks secret-like prompt text, live-trading requests, risk-control bypass requests, and repo-out-of-scope requests.
- `PreToolUse`: blocks dangerous shell or edit operations before they run.
- `PermissionRequest`: denies clearly unsafe escalation requests, auto-approves routine in-repository workflow commands, and lets normal approvals handle dependency additions, remote publication, or other non-blocked risky requests.
- `PostToolUse`: detects meaningful repository changes and adds validation context.
- `Stop`: reminds Codex to run/report validation, update docs, capture decisions, and refresh lightweight status files when phase, task, blocker, or validation state changes.
- `SubagentStart`: injects project safety context into subagents.
- `SubagentStop`: asks for a structured handoff summary when subagent output is incomplete.

## Safety Rules

Hooks must not:

- Store secrets.
- Print secrets.
- Send prompts, code, or trade ideas to third-party services.
- Make broker API calls.
- Place trades.
- Mutate project files.
- Run expensive commands after every tool call.

Hooks may:

- Block clearly unsafe commands.
- Add developer-visible context.
- Remind the agent to validate and document changes.
- Run lightweight local checks.

## Policy Tests

Run hook policy tests:

```powershell
python -m unittest discover .codex/hooks/tests
```

The tests cover safe commands, dangerous deletion, `.env` reads, secret-like prompts, live-trading requests, repo-out-of-scope prompts, validation reminders, and source-change classification.

## Maintenance

Keep hook behavior simple and deterministic. When changing policy behavior:

1. Update `policy.py`.
2. Add or update tests.
3. Run the hook tests.
4. Update this README if operator-facing behavior changes.
5. Review and re-trust hooks in Codex because changed hook hashes require trust review.
