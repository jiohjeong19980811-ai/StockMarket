---
name: data-quality-skill
description: Validate ingestion, provider adapters, source timestamps, freshness, completeness, anomalies, normalization, lineage, and data quality logs. Use when reviewing market, options, news, earnings, fundamentals, or sentiment data.
---

# Data Quality Skill

## Purpose

Ensure recommendations are based on fresh, traceable, and trustworthy-enough data.

## Inputs

- Provider responses or normalized records.
- Retrieval timestamps.
- Provider timestamps.
- Data quality logs.
- Schema and migrations.
- Ingestion run results.

## Outputs

- Data quality status.
- Freshness assessment.
- Missing or anomalous field list.
- Provider disagreement notes.
- Recommendation impact.

## Required Checks

- Verify source and retrieval timestamps.
- Check required fields.
- Flag stale data.
- Flag empty or partial provider responses.
- Check options bid/ask, volume, open interest, and IV.
- Check duplicate or unparseable news and earnings data.

## Failure Conditions

- Missing timestamps.
- Provider data used without lineage.
- Data quality problems not reflected in confidence.
- Provider-specific fields leak across domain boundaries.

## Example Usage

`Use data-quality-skill to review today's options ingestion before scoring opportunities.`
