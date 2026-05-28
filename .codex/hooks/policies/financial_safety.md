# Financial Safety Policy

The MVP is research and paper trading only.

Hooks must block or warn on:

- Attempts to enable live trading.
- Attempts to submit, place, send, or execute broker orders.
- Broker or crypto exchange order endpoints.
- Attempts to bypass risk controls.
- Attempts to bypass audit logging.
- Attempts to bypass paper-trading requirements.
- Language claiming guaranteed income, guaranteed profit, or guaranteed returns.
- Options recommendations that remove risk scoring, liquidity checks, max-loss checks, or downside scenarios.

Hooks are a guardrail, not a substitute for code review, tests, risk review, or operator approval.
