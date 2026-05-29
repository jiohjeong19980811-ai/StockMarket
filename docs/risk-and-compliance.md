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
- Strategy evidence gates before `paper trade` eligibility.
- Paper-only exposure limits and drawdown pause rules.
- Options max-loss, breakeven, IV, liquidity, event, and theta checks.
- Cost/slippage/spread stress tests before strategy promotion.

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
- Strategy family and strategy version.
- Backtest or paper-trade evidence run ID when available.
- Liquidity pass/fail and data freshness pass/fail.

Scoring semantics:

- `scores.risk` is a risk-control quality score where higher means safer controls and fewer unresolved gate failures. It is not a prediction of upside.
- `scores.confidence` summarizes bounded research signal strength and must be reduced by stale data, missing evidence, or weak source quality.
- `scores.liquidity` summarizes tradability and must not bypass options bid/ask, volume, open-interest, IV, max-loss, event-risk, or theta-risk gates.
- No score can override hard gates for missing citations, stale or missing data, missing evidence, options risk gaps, or paper exposure breaches.
- The scoring layer also enforces an MVP strategy policy gate. Strategy families marked `context_only`, `test_later`, or `control_layer` cannot promote to `paper_trade` unless a future documented policy explicitly allows it.

## Quant Strategy Risk Controls

MVP strategy risk stance:

- Test first: liquid stock/ETF PEAD, earnings surprise continuation, momentum, volatility-adjusted mean reversion, news-confirmed watchlist signals, value/quality context, and portfolio risk overlays.
- Defer: options recommendations until historical options chains and realistic fill modeling exist; sector rotation until portfolio risk views exist; pairs/stat-arb until short/borrow assumptions can be safely modeled; ML until deterministic baselines and validation gates exist; crypto until a future research-only phase.
- Avoid: live trading, broker order placement, margin, leverage, naked options, short volatility, 0DTE, HFT, market making, crypto execution, and strategies dependent on optimistic fills or ignored costs.

Milestone 4 encodes the first deterministic strategy policy catalog in `@stockmarket/scoring` and exposes it through `/strategies/policies`:

- `test_now`: earnings, momentum, and mean reversion may become paper-trade candidates only after evidence, citations, freshness, liquidity, and paper-exposure gates pass.
- `context_only`: volatility, news/sentiment, and value/quality can influence watchlist/scoring context but cannot stand alone as MVP paper-trade strategies.
- `test_later`: options and sector/macro require stronger data and validation before promotion. Options remain blocked from automatic paper-trade promotion until a future options policy review; contract-level historical options evidence and defined-risk structures are prerequisites for that future review.
- `control_layer`: portfolio risk is a required guardrail, not a standalone opportunity strategy.

Initial paper-only default limits should be conservative and revisited after paper-trade evidence:

- Max risk per idea: 0.25%-0.50% of paper equity.
- Max single-name notional exposure: 5%.
- Max sector exposure: 20%.
- Max correlated cluster exposure: 15%.
- Max aggregate options premium at risk: 2%-3%.
- Max daily paper loss pause: 1%-2%.

Initial liquidity defaults:

- Stocks: price above $5 and average daily dollar volume above $20M.
- Options: each leg should have open interest at least 500, volume at least 100, and bid/ask spread no wider than 10% of mid or an explicit dollar cap.

Hard no-trade gates:

- Missing citations, source timestamps, provider lineage, downside, invalidation, risk score, confidence score, or final decision.
- Stale data or provider disagreement that materially affects the thesis.
- Options without bid/ask, IV, volume, open interest, expiration, strike, max loss, breakeven, event risk, and theta risk.
- Earnings/event uncertainty when the strategy depends on event timing.
- Backtest evidence based on lookahead, survivorship bias, insufficient sample, or unmodeled transaction costs.
- Options proxy analysis presented as real options evidence.

## Promotion Gates

A strategy can move from research candidate to paper-trade candidate only when:

- Inputs are fresh enough for the strategy.
- Sources and timestamps are present.
- Backtesting or paper-trading evidence exists.
- Liquidity and risk filters pass.
- The downside case is documented.
- The risk manager does not block it.
- Out-of-sample or walk-forward validation exists when the strategy has been tuned.
- Parameter trials and rejected variants are tracked.
- Cost, spread, slippage, and liquidity assumptions survive sensitivity checks.
- Options strategies use contract-level historical chain data, not underlying-only proxies.

No strategy can move to live trading until a future phase adds production-grade backtesting, paper-trading performance, broker sandbox integration, approval workflow, kill switch, max daily loss, max position sizing, full audit logs, and explicit operator approval.

## Paper-Trading Contract Controls

The first paper-trading package slice is simulated-only. Opening a paper position requires:

- A core `paper_trade` eligible recommendation.
- Operator approval metadata and audit log ID.
- Thesis snapshot, stop rule, target rule, numeric stop-loss price, numeric profit-target price, and time stop.
- Valid paper equity, entry price, quantity, and max loss.
- Paper exposure inside the conservative MVP caps.
- No broker, live account, external order, or execution-shaped fields.

Durable paper-trade rows must also preserve recommendation, approval, and entry audit references. The database constrains paper trades to stock-only MVP entries, rejects non-paper or broker-execution flags, rejects ineligible recommendations, and enforces max idea risk, single-name exposure, sector exposure, correlated exposure, and daily paper-loss caps.

Options paper trades remain rejected until the options strategy policy is explicitly promoted after historical options chain and fill-model validation.

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
