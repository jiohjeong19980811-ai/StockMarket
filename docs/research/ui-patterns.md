# UI Pattern Research

Last updated: 2026-05-28T13:38:53-04:00

## Product UI Principle

The UI should feel like a quiet operator console for financial research, not a marketing site. It should prioritize scan speed, data freshness, evidence, risk, and decision workflow.

## Recommended Libraries

| Library | Decision | Use |
| --- | --- | --- |
| [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/) | Use later | Interactive financial charts for ticker detail, price history, volatility overlays, and event markers. |
| [TanStack Table](https://tanstack.com/table/latest/docs/introduction) | Use later | Dense, sortable, filterable, virtualized tables for opportunities, watchlists, audit logs, options chains, and paper trades. |
| [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table) | Use later if React stack chosen | Good pattern for combining TanStack Table with accessible UI components. |
| [Recharts](https://recharts.org/) | Use later | General dashboard charts for score breakdowns, performance, and validation state. |

## Screen Patterns

| Page | Core pattern |
| --- | --- |
| `/dashboard` | Current focus, daily market context, top opportunities, no-trade state, data freshness, paper-trade summary. |
| `/opportunities` | Dense ranked table with risk, confidence, catalyst, instrument, liquidity status, and operator decision. |
| `/ticker/:symbol` | Price chart, news/catalyst timeline, fundamentals, earnings history, signal decomposition, bull/bear/risk panels. |
| `/options/:symbol` | Options chain summary with expiration/strike filters, bid/ask spread, volume, open interest, IV/RV comparison, expected move. |
| `/paper-trading` | Active/closed paper positions, thesis, entry/exit rules, P/L, lessons learned. |
| `/backtests` | Strategy runs, assumptions, metrics, drawdowns, regime slices, evidence gates. |
| `/system-health` | Data freshness, provider status, pipeline runs, quality warnings. |
| `/audit-log` | Searchable event ledger for pipeline runs, recommendations, operator decisions, and config changes. |
| Project Status / Roadmap dashboard | Current focus, roadmap items, research progress, open questions, decision log, validation state, and agent handoffs. |

## UX Guardrails

- Make `avoid` and `no good trades today` first-class outcomes.
- Show risk and data freshness beside every opportunity, not hidden in details.
- Use confidence as evidence quality, not as a promise of profit.
- Do not use green-only or profit-heavy visual language.
- Avoid hero sections, sales copy, and decorative layouts.
- Use compact panels, tables, tabs, filters, badges, and chart overlays.
- Every option idea must expose max loss, spread/liquidity, event risk, and why the system might be wrong.

## CEO / CTO Decision

When implementation begins, build a dashboard shell with real workflow surfaces rather than a landing page. Use simple responsive layouts first. Add financial charts and dense tables only when API contracts exist.
