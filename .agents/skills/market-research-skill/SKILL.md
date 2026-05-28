---
name: market-research-skill
description: Research public-company opportunities using news, earnings, fundamentals, macro context, catalysts, source citations, timestamps, uncertainty, and no-financial-advice framing. Use when preparing ticker research, daily opportunity narratives, source summaries, or bull/bear cases.
---

# Market Research Skill

## Purpose

Produce sourced market research for stocks and options candidates. Keep outputs framed as research signals, not financial advice.

## Inputs

- Ticker or watchlist.
- News articles and timestamps.
- Earnings dates, surprises, and guidance.
- Fundamental metrics.
- Sector and macro context.
- Prior recommendation history when available.

## Outputs

- Concise market context.
- News and catalyst summary with citations.
- Earnings and fundamentals summary.
- Bull case and bear case.
- Key risks and why the thesis might be wrong.
- Data gaps and freshness issues.

## Required Checks

- Verify every factual claim has a source or stored data reference.
- Include source timestamps.
- Distinguish confirmed facts from inference.
- Flag stale, missing, or low-quality data.
- Include a downside scenario.
- Avoid guaranteed-return language.

## Failure Conditions

- Missing sources or timestamps.
- Unsupported catalyst claims.
- One-sided thesis without bear case.
- Output sounds like personalized financial advice.

## Example Usage

`Use market-research-skill to summarize today's NVDA catalysts and explain the bull and bear cases for an operator review.`
