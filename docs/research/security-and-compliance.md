# Security And Compliance Research

Last updated: 2026-05-28T13:38:53-04:00

## Core References

- [OWASP Top 10 for Large Language Model Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [OCC Characteristics and Risks of Standardized Options](https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document)
- [SEC Investor Bulletin: An Introduction to Options](https://www.sec.gov/investor/alerts/ib_options.pdf)
- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [GitHub secret scanning docs](https://docs.github.com/en/code-security/secret-scanning)

## Security Risks To Avoid

- Prompt injection from news articles, filings, provider metadata, or web content.
- Sensitive information disclosure through prompts, logs, summaries, screenshots, or model memory.
- Insecure plugin/MCP design that gives tools broader access than required.
- Excessive agency, especially any ability to place orders, transfer funds, or modify broker settings.
- Overreliance on AI outputs without deterministic calculations and source verification.
- Provider credential leakage in `.env`, logs, test snapshots, or docs.
- Hidden live-trading paths in MVP.
- Recommendations without downside scenario, source timestamps, and uncertainty.
- Removing audit logs, risk controls, or paper-trading gates without review.

## Compliance And Product Boundary

The MVP is a research and paper-trading tool. It must not:

- Present outputs as financial advice.
- Promise guaranteed income, passive income, or certain returns.
- Place live trades.
- Assume margin use unless explicitly configured in a future phase.
- Recommend naked options selling in early versions.
- Recommend illiquid contracts or contracts with wide spreads.
- Recommend anything without citations, timestamps, risk score, confidence score, and a downside scenario.

## Audit Requirements

Audit logs must eventually cover:

- Pipeline run start and finish.
- Provider calls and data timestamps.
- Data quality warnings.
- Scoring versions and input features.
- AI prompt/model versions where AI is used.
- Recommendation decisions.
- Operator actions.
- Paper-trade entries/exits.
- Backtest configurations and results.
- Security-sensitive configuration changes.

## Secrets Requirements

- `.env` stays local and untracked.
- `.env.example` contains placeholder names only.
- No broker credentials in repo.
- No API keys in docs, tests, fixtures, logs, MCP config, or screenshots.
- Provider tokens should be read from environment variables and later from a secret manager.
- Hooks should block obvious prompt and command secret leakage, but runtime code must also validate and redact.

## CEO / CTO Decision

Use OWASP LLM risks and NIST AI RMF as engineering guardrails. Keep live trading disabled by architecture, configuration, hooks, tests, and documentation. Treat all research output as uncertain evidence that requires operator review and paper-trading validation.
