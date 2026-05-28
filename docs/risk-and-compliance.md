# Risk And Compliance

## Scope

This platform provides investing research signals for operator review. It does not provide personalized financial advice, guaranteed income, or autonomous trade execution.

## Research Basis

Risk and compliance posture is informed by SEC automated investment advice materials, SEC electronic investment advice risk alerts, OCC standardized options risk disclosures, SEC/FINRA options education, CFTC virtual currency risk guidance, OWASP LLM risks, and NIST AI RMF. See `docs/research/security-and-compliance.md`.

## Required User-Facing Disclosures

Every recommendation view and daily report must make these points clear:

- Outputs are research signals, not financial advice.
- Stocks and options involve risk.
- Options are high risk and can expire worthless.
- Past performance and backtests do not guarantee future results.
- Data may be stale, incomplete, delayed, adjusted, or wrong.
- The operator is responsible for any investment decision.

## MVP Prohibitions

The MVP must not include:

- Live broker order placement.
- Live broker credentials.
- Auto-trading.
- Margin assumptions.
- Naked options selling.
- Guaranteed-return language.
- Recommendations without citations and timestamps.
- Recommendations without downside scenarios.
- Recommendations without risk and confidence scores.

## Required Risk Controls

From day one, the system must enforce:

- No real-money trade execution.
- Paper-trading-only position actions.
- Liquidity filters for options.
- Bid/ask spread limits.
- Minimum volume and open-interest checks.
- Data freshness checks.
- No-trade outcomes.
- Source citation requirements.
- Downside scenario requirements.
- Operator decision logging.

## Codex Hook Guardrails

Codex lifecycle hooks provide an additional local guardrail layer during development. They block or warn on attempts to:

- Enable live trading during MVP.
- Add or run broker order placement paths.
- Paste or print secret-like values.
- Bypass risk controls, audit logging, approvals, or paper-trading requirements.
- Use guaranteed-profit or guaranteed-income language.
- Run destructive commands that could damage the repository.

Hooks do not replace product controls. The application must still enforce risk controls in code, tests, database constraints, and operator workflows.

## Recommendation Risk Fields

Every opportunity must include:

- Risk score.
- Confidence score.
- Liquidity score.
- Bull case.
- Bear case.
- Key risks.
- Why the system might be wrong.
- Invalidation conditions.
- Expected catalyst and catalyst uncertainty.
- Suggested paper position sizing framework.
- Max loss for options where applicable.
- Final decision: `watchlist`, `paper trade`, `avoid`, or `needs more data`.

## Promotion Gates

A strategy can move from research candidate to recommended paper-trade candidate only when:

- Inputs are fresh enough for the strategy.
- Sources and timestamps are present.
- Backtesting or paper-trading evidence exists.
- Liquidity and risk filters pass.
- The downside case is documented.
- The risk manager does not block it.

No strategy can move to live trading until a future phase adds production-grade backtesting, paper-trading performance, broker sandbox integration, approval workflow, kill switch, max daily loss, max position sizing, full audit logs, and explicit operator approval.

## Audit Requirements

Audit records must capture:

- Pipeline run ID.
- Strategy/scoring version.
- Data provider and source timestamps.
- AI model and prompt version when AI is used.
- Raw source references.
- Generated scores and explanations.
- Risk manager decisions.
- Operator actions.
- Paper-trade entries, exits, and lessons learned.

## Compliance Review Triggers

Require a security and compliance review before:

- Adding a broker integration.
- Enabling paper broker API writes.
- Adding any live-trading code path.
- Adding margin, shorting, or options selling assumptions.
- Using paid data provider terms that restrict redistribution or storage.
- Changing recommendation language or risk disclosure behavior.

## Research-Informed Deferrals

Do not build these until after MVP evidence, controls, and operator workflow are production-grade:

- Live trading.
- Broker order placement.
- Broker MCP servers.
- Crypto exchange execution.
- Naked options selling.
- Margin or shorting assumptions.
- Runtime autonomous agent execution of trading workflows.
- Public performance claims based only on paper trading or backtests.
