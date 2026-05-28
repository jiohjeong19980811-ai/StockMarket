---
name: security-review-skill
description: Review secrets handling, API keys, broker credentials, environment variables, permissions, MCP configuration, dependency risk, audit logs, and prohibited live-trading actions. Use for security-sensitive changes.
---

# Security Review Skill

## Purpose

Protect secrets, permissions, broker boundaries, and auditability.

## Inputs

- Changed files.
- Environment variable usage.
- MCP configuration.
- Dependency changes.
- Broker or provider integration code.
- Audit-log behavior.

## Outputs

- Security findings.
- Secret exposure check.
- Permission boundary review.
- Broker safety review.
- Required remediation.

## Required Checks

- Confirm no secrets are committed.
- Confirm `.env.example` uses placeholders only.
- Confirm live trading remains disabled.
- Confirm MCP access is least-privilege.
- Confirm audit logs are not bypassed.
- Review new dependencies.

## Failure Conditions

- Real API key or credential in repo.
- Broker live credential usage.
- Broad filesystem or network access without approval.
- Live order path in MVP.
- Missing audit logs for recommendation or paper-trade actions.

## Example Usage

`Use security-review-skill to review a new provider adapter and its environment variable handling.`
