---
name: ui-dashboard-review-skill
description: Review the operator dashboard, ticker pages, options pages, paper-trading views, backtest views, system-health views, and audit-log views for clarity, scanability, decision support, and risk visibility.
---

# UI Dashboard Review Skill

## Purpose

Ensure the UI functions as an operator console for research review and paper-trading decisions.

## Inputs

- Page or component screenshots.
- UI code paths.
- User workflow.
- Recommendation data contract.
- Risk, freshness, citation, and audit fields.

## Outputs

- Usability findings.
- Missing state or control list.
- Risk visibility review.
- Operator workflow recommendations.

## Required Checks

- Show top opportunities and no-trade states clearly.
- Make citations and timestamps inspectable.
- Make risk and confidence visible.
- Keep decision buttons clear: watch, paper trade, reject, needs review.
- Avoid marketing-style layouts for operational pages.
- Ensure text fits on mobile and desktop.

## Failure Conditions

- Risk hidden behind extra clicks.
- No data freshness status.
- No audit trail access.
- Recommendation cannot be rejected or marked needs review.
- UI implies guaranteed trade outcome.

## Example Usage

`Use ui-dashboard-review-skill to review the opportunities dashboard before MVP acceptance.`
