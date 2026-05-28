# Articles And Documentation Research

Last updated: 2026-05-28T13:38:53-04:00

## Top 10 Useful Docs And Articles

| Rank | Source | Use decision | Key takeaway |
| --- | --- | --- | --- |
| 1 | [OpenAI Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md) | Use now | Codex reads `AGENTS.md` before work and layers project guidance from repo root downward. This justifies a strong repo-level operating manual. |
| 2 | [OpenAI Codex hooks](https://developers.openai.com/codex/hooks) | Use now | Use the official lifecycle hook mechanism for deterministic local guardrails. Do not invent a parallel hook system. |
| 3 | [OpenAI Codex MCP](https://developers.openai.com/codex/mcp) | Use now, limited | MCP can add third-party tools and context, but project config should remain least-privilege and avoid broker/trading tools in MVP. |
| 4 | [OpenAI Codex skills](https://developers.openai.com/codex/skills) | Use now | Skills are reusable workflows with `SKILL.md`, optional scripts, references, and assets. The repo skills should remain workflow checklists until app code exists. |
| 5 | [OpenAI Codex subagents](https://developers.openai.com/codex/subagents) | Use now, cautiously | Project-scoped `.codex/agents/*.toml` is the closest official pattern for the requested agent team. Subagents should be used for reviews/research, not autonomous trading. |
| 6 | [OpenAI Codex memories](https://developers.openai.com/codex/memories) | Use cautiously | Memories are helpful local recall, but required rules belong in `AGENTS.md` and checked-in docs. Do not rely on memory for safety rules. |
| 7 | [OpenAI Codex permissions](https://developers.openai.com/codex/permissions) | Use now where supported | Permission profiles provide least-privilege filesystem and network boundaries. Hooks and rules supplement them. |
| 8 | [OpenAI Codex rules](https://developers.openai.com/codex/rules) | Use now | Rules can control command approval outside the sandbox; they complement hooks for command hygiene. |
| 9 | [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) | Use as governance reference | Use risk governance language around validity, reliability, transparency, accountability, and human oversight. |
| 10 | [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | Use now | Prompt injection, sensitive information disclosure, insecure plugin design, excessive agency, and overreliance are directly relevant to AI-assisted investing. |

## Financial Risk And Investor Protection References

- [OCC Characteristics and Risks of Standardized Options](https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document): options risk disclosure baseline; options can involve substantial risk and may expire worthless.
- [SEC Investor Bulletin: An Introduction to Options](https://www.sec.gov/investor/alerts/ib_options.pdf): investor education reference for options risk framing.
- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces): official source for filings and XBRL company facts.
- [FRED API](https://fred.stlouisfed.org/docs/api/fred/): official macroeconomic data source.

## Research Conclusions

- Official Codex docs are the source of truth for repo setup, hooks, skills, MCP, subagents, permissions, rules, and memory.
- Financial outputs must be constrained by documented risk language, evidence tracking, and source timestamps.
- AI-generated text should summarize and explain, while deterministic code owns calculations.
- Future app-level agent orchestration should wait until provider ingestion, scoring, risk, backtesting, and paper trading are auditable.
