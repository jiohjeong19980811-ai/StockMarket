# Validation Status

Last updated: 2026-05-29T09:17:05-04:00

## Current State

| Field | Value |
| --- | --- |
| Current phase | Milestone 6 paper trading validation |
| Current task | Add durable paper-trade read model and mock API dry run |
| Owner/agent | Codex founding CTO / lead architect / risk reviewer / quantitative research lead |
| Status | Completed |
| Priority | High |
| Category | Paper trading read model and validation evidence |
| Blockers | None |
| Next step | Commit the read-model slice, then continue Milestone 6 with UI/read API integration or backtesting ingestion of paper-trade evidence. |
| Related docs/files | `packages/db/src/paper-trade-ledger.ts`, `packages/db/test/paper-trade-ledger.test.ts`, `apps/api/src/server.ts`, `apps/api/test/paper-trading.test.ts`, `scripts/smoke-api.mjs`, `docs/status/` |

## Checks

| Check | Status | Last result | Command or method |
| --- | --- | --- | --- |
| Milestone 6 paper-trade read model aggregate CI | Completed | Typecheck, lint, format, 122 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding the DB read helper and `/paper-trading/mock-read-model-dry-run` | `npm.cmd run ci` |
| Milestone 6 paper-trade read model DB focused test | Completed | Red-green DB paper-trade ledger tests passed for listing persisted trades, reading by ID, audit links, parsed invalidation conditions, safe flags, and computed closed outcomes | `npm.cmd run test --workspace @stockmarket/db -- paper-trade-ledger` |
| Milestone 6 paper-trade read model API focused test | Completed | Red-green API paper-trading tests passed for the mock read-model dry run after refreshing the DB package build output | `npm.cmd run test --workspace @stockmarket/api -- paper-trading` |
| Milestone 6 paper-trade read model status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-014 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trade read model whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trade read model secret-pattern scan | Completed | No secret-shaped tokens found in changed API/DB/smoke/status/doc files | `rg` secret-pattern scan |
| Milestone 6 paper-trade read model live-trading surface scan | Completed | Matches are documented prohibitions, explicit no-broker wording, or safety assertions; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trade evidence summary UI aggregate CI | Completed | Typecheck, lint, format, 119 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding the operator evidence summary panel | `npm.cmd run ci` |
| Milestone 6 paper-trade evidence summary UI focused test | Completed | Red-green web test passed for API-online evidence summary metrics and API-offline evidence fallback snapshot | `npm.cmd run test --workspace @stockmarket/web -- App` |
| Milestone 6 paper-trade evidence summary UI status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-013 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trade evidence summary UI whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trade evidence summary UI secret-pattern scan | Completed | No secret-shaped tokens found in changed web/status/doc files | `rg` secret-pattern scan |
| Milestone 6 paper-trade evidence summary UI live-trading surface scan | Completed | Matches are documented prohibitions, explicit no-broker wording, or existing safety copy; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trade evidence summary UI local web smoke | Completed | Existing Vite dev server on `http://127.0.0.1:3001` returned HTTP 200 after the evidence summary panel update | `Invoke-WebRequest http://127.0.0.1:3001` |
| Milestone 6 paper-trade evidence summary API aggregate CI | Completed | Typecheck, lint, format, 119 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding `/paper-trading/mock-evidence-summary` | `npm.cmd run ci` |
| Milestone 6 paper-trade evidence summary API focused test | Completed | Red-green API paper-trading route tests passed for mock evidence summary output with open/closed counts and review-gated status | `npm.cmd run test --workspace @stockmarket/api -- paper-trading` |
| Milestone 6 paper-trade evidence summary API status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-012 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trade evidence summary API whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trade evidence summary API secret-pattern scan | Completed | No secret-shaped tokens found in changed API/smoke/status/doc files | `rg` secret-pattern scan |
| Milestone 6 paper-trade evidence summary API live-trading surface scan | Completed | Matches are documented prohibitions, explicit no-broker wording, or existing safety copy; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trade evidence summary aggregate CI | Completed | Typecheck, lint, format, 118 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding evidence summary metrics | `npm.cmd run ci` |
| Milestone 6 paper-trade evidence summary focused test | Completed | Red-green paper-trading package tests passed for closed-trade metrics, ready-for-review sample threshold, and broker/live-shaped record blocking | `npm.cmd run test --workspace @stockmarket/paper-trading -- paper-trading` |
| Milestone 6 paper-trade evidence summary status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-011 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trade evidence summary whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trade evidence summary secret-pattern scan | Completed | No secret-shaped tokens found in changed paper-trading/status/doc files | `rg` secret-pattern scan |
| Milestone 6 paper-trade evidence summary live-trading surface scan | Completed | Matches are documented prohibitions, explicit no-broker wording, or existing safety copy; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 local API CORS aggregate CI | Completed | Typecheck, lint, format, 115 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding local CORS handling | `npm.cmd run ci` |
| Milestone 6 local API CORS focused test | Completed | Red-green API tests passed for allowed local web origin, POST preflight, and disallowed arbitrary browser origin | `npm.cmd run test --workspace @stockmarket/api -- cors` |
| Milestone 6 local API CORS status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-010 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 local API CORS whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 local API CORS secret-pattern scan | Completed | No secret-shaped tokens found in changed API/status/doc files | `rg` secret-pattern scan |
| Milestone 6 local API CORS live-trading surface scan | Completed | Matches are documented prohibitions, explicit no-broker wording, or existing safety copy; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 local API CORS HTTP smoke | Completed | Temporary Fastify listener returned CORS headers for local web GET and POST preflight requests | Node HTTP smoke against built API server |
| Milestone 6 local API CORS web smoke | Completed | Existing Vite dev server on `http://127.0.0.1:3001` returned HTTP 200 after the CORS update | `Invoke-WebRequest http://127.0.0.1:3001` |
| Milestone 6 paper-trade close UI aggregate CI | Completed | Typecheck, lint, format, 112 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding the paper-trade close outcome panel | `npm.cmd run ci` |
| Milestone 6 paper-trade close UI focused test | Completed | Red-green web test passed for API-online simulated close outcome display and API-offline close fallback snapshot | `npm.cmd run test --workspace @stockmarket/web -- App` |
| Milestone 6 paper-trade close UI status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-009 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trade close UI whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trade close UI secret-pattern scan | Completed | No secret-shaped tokens found in changed web/status/doc files | `rg` secret-pattern scan |
| Milestone 6 paper-trade close UI live-trading surface scan | Completed | Matches are documented prohibitions or explicit no-broker-execution UI/test copy; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trade close UI local web smoke | Completed | Existing Vite dev server on `http://127.0.0.1:3001` returned HTTP 200 after the close-outcome panel update | `Invoke-WebRequest http://127.0.0.1:3001` |
| Milestone 6 paper-trade close API aggregate CI | Completed | Typecheck, lint, format, 112 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding `/paper-trading/mock-close-dry-run` | `npm.cmd run ci` |
| Milestone 6 paper-trade close API focused test | Completed | 3 API paper-trading route tests passed, including mock open, ledger dry run, and close dry run with close audit linkage | `npm.cmd run test --workspace @stockmarket/api -- paper-trading` |
| Milestone 6 paper-trade close API status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-008 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trade close API whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trade close API secret-pattern scan | Completed | No secret-shaped tokens found in changed API, smoke, and status/doc files | `rg` secret-pattern scan |
| Milestone 6 paper-trade close API live-trading surface scan | Completed | Matches are documented prohibitions, negative tests, or explicit no-broker-execution wording; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 DB paper-trade close persistence aggregate CI | Completed | Typecheck, lint, format, 111 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding close persistence | `npm.cmd run ci` |
| Milestone 6 DB paper-trade close persistence DB package tests | Completed | 38 DB tests passed across migrations, ingestion sink, and paper-trade ledger persistence | `npm.cmd run test --workspace @stockmarket/db` |
| Milestone 6 DB paper-trade close persistence migration tests | Completed | 29 migration tests passed, including `0003_paper_trade_closes.sql` and close audit linkage rejection | `npm.cmd run test --workspace @stockmarket/db -- migration` |
| Milestone 6 DB paper-trade close persistence ledger tests | Completed | 4 ledger tests passed, including close persistence and duplicate-close rejection | `npm.cmd run test --workspace @stockmarket/db -- paper-trade-ledger` |
| Milestone 6 DB paper-trade close persistence status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-007 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 DB paper-trade close persistence whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 DB paper-trade close persistence secret-pattern scan | Completed | No secret-shaped tokens found in changed DB and status/doc files | `rg` secret-pattern scan |
| Milestone 6 DB paper-trade close persistence live-trading surface scan | Completed | Matches are documented prohibitions, broker-field rejection tests, or explicit no-broker-execution wording; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trade close contract aggregate CI | Completed | Typecheck, lint, format, 108 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding the simulated paper-trade close contract | `npm.cmd run ci` |
| Milestone 6 paper-trade close contract focused tests | Completed | 9 paper-trading tests passed, including close with timestamped exit evidence, P/L, lessons learned, missing-exit rejection, invalid-price rejection, and duplicate-close rejection | `npm.cmd run test --workspace @stockmarket/paper-trading` |
| Milestone 6 paper-trade close contract typecheck | Completed | Paper-trading package typecheck passed after adding close lifecycle types | `npm.cmd run typecheck --workspace @stockmarket/paper-trading` |
| Milestone 6 paper-trade close contract status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-006 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trade close contract whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trade close contract secret-pattern scan | Completed | No secret-shaped tokens found in changed paper-trading and status/doc files | `rg` secret-pattern scan |
| Milestone 6 paper-trade close contract live-trading surface scan | Completed | Matches are documented prohibitions, broker-field rejection tests, or explicit no-broker-execution wording; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trade ledger API aggregate CI | Completed | Typecheck, lint, format, 105 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding `/paper-trading/mock-ledger-dry-run` | `npm.cmd run ci` |
| Milestone 6 paper-trade ledger API focused test | Completed | 2 API paper-trading route tests passed, including the in-memory ledger dry run with one persisted paper trade and no provider keys or broker execution | `npm.cmd run test --workspace @stockmarket/api -- paper-trading` |
| Milestone 6 paper-trade ledger API status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-005 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trade ledger API whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trade ledger API secret-pattern scan | Completed | No secret-shaped tokens found in changed API, smoke, and status/doc files | `rg` secret-pattern scan |
| Milestone 6 paper-trade ledger API live-trading surface scan | Completed | Matches are documented prohibitions, negative tests, or explicit no-broker-execution wording; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trade persistence aggregate CI | Completed | Typecheck, lint, format, 104 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after adding the durable paper-trade ledger | `npm.cmd run ci` |
| Milestone 6 paper-trade persistence DB package tests | Completed | 35 DB tests passed across migrations, ingestion sink, and paper-trade ledger persistence | `npm.cmd run test --workspace @stockmarket/db` |
| Milestone 6 paper-trade persistence DB migration tests | Completed | 28 migration tests passed, including `0002_paper_trades.sql`, paper-only flags, eligible-recommendation trigger, risk-percent consistency, options deferral, and required stop/target/time-stop constraints | `npm.cmd run test --workspace @stockmarket/db -- migration` |
| Milestone 6 paper-trade persistence DB ledger tests | Completed | 2 ledger tests passed for durable paper-only audit-linked row insertion and inherited DB rejection of non-paper-trade-eligible recommendations | `npm.cmd run test --workspace @stockmarket/db -- paper-trade-ledger` |
| Milestone 6 paper-trade persistence package tests | Completed | 6 paper-trading tests passed, including numeric stop-loss/profit-target validation and time-stop enforcement | `npm.cmd run test --workspace @stockmarket/paper-trading` |
| Milestone 6 paper-trade persistence API focused test | Completed | Mock paper-trading API test passed after adding numeric stop-loss and profit-target fields to the request contract | `npm.cmd run test --workspace @stockmarket/api -- paper-trading` |
| Milestone 6 paper-trade persistence status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after adding M6-004 | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trade persistence whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trade persistence secret-pattern scan | Completed | No secret-shaped tokens found in changed app, package, and status/doc files | `rg` secret-pattern scan |
| Milestone 6 paper-trade persistence live-trading surface scan | Completed | Matches are documented prohibitions, broker-field rejection tests, or explicit no-broker-execution UI/test copy; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trading UI aggregate CI | Completed | Typecheck, lint, format, 95 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after the console paper-trading panel update | `npm.cmd run ci` |
| Milestone 6 paper-trading UI status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after paper-trading UI status updates | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trading UI whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trading UI secret-pattern scan | Completed | No secret-shaped tokens found in changed web/status files | `rg` secret-pattern scan |
| Milestone 6 paper-trading UI live-trading surface scan | Completed | Matches are documented prohibitions or explicit broker-execution negative copy; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trading UI local web smoke | Completed | Existing Vite dev server on `http://127.0.0.1:3001` returned HTTP 200 after the paper-trading panel update | `Invoke-WebRequest http://127.0.0.1:3001` |
| Milestone 6 paper-trading UI focused test | Completed | Red-green web test passed for API-online paper-trading contract display and API-offline paper fallback snapshot | `npm.cmd run test --workspace @stockmarket/web -- App` |
| Milestone 6 paper-trading API aggregate CI | Completed | Typecheck, lint, format, 95 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed; smoke now checks `/paper-trading/mock-decision` | `npm.cmd run ci` |
| Milestone 6 paper-trading API status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after mock paper-trading API status updates | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trading API whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trading API secret-pattern scan | Completed | No secret-shaped tokens found in changed API, docs, smoke, or package-lock files | `rg` secret-pattern scan |
| Milestone 6 paper-trading API live-trading surface scan | Completed | Matches are documented prohibitions or explicit broker-execution negative assertions; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trading API focused test | Completed | Red-green API test passed for `/paper-trading/mock-decision`, returning no provider keys, live trading disabled, non-durable persistence, and a simulated paper entry | `npm.cmd run test --workspace @stockmarket/api -- paper-trading` |
| Milestone 6 paper-trading aggregate CI | Completed | Typecheck, lint, format, 94 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed | `npm.cmd run ci` |
| Milestone 6 paper-trading status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after paper-trading status updates | `python -m json.tool docs/status/work-items.json` |
| Milestone 6 paper-trading whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 6 paper-trading secret-pattern scan | Completed | No secret-shaped tokens found in changed paper-trading, docs, or package-lock files | `rg` secret-pattern scan |
| Milestone 6 paper-trading live-trading surface scan | Completed | Matches are documented prohibitions or explicit broker-field rejection tests; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 6 paper-trading focused tests | Completed | Red-green tests passed for simulated stock paper entry, ineligible recommendation rejection, broker-shaped field rejection, exposure-limit rejection, and options deferral | `npm.cmd run test --workspace @stockmarket/paper-trading -- paper-trading` |
| Milestone 4 strategy policy aggregate CI | Completed | Typecheck, lint, format, 89 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed; smoke now checks strategy policies | `npm.cmd run ci` |
| Milestone 4 strategy policy status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after strategy policy status updates | `python -m json.tool docs/status/work-items.json` |
| Milestone 4 strategy policy whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown/status files | `git diff --check` |
| Milestone 4 strategy policy secret-pattern scan | Completed | No secret-shaped tokens found; NIST URL references remain known false positives | `rg` secret-pattern scan |
| Milestone 4 strategy policy live-trading surface scan | Completed | Matches are documented guardrails, tests, safety docs, or explicit prohibited-strategy notes; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 4 strategy policy local web smoke | Completed | Existing Vite dev server on `http://127.0.0.1:3001` returned HTTP 200 after the policy dashboard update | `Invoke-WebRequest http://127.0.0.1:3001` |
| Milestone 4 strategy policy scoring tests | Completed | Red-green scoring tests now verify strategy policy metadata and context-only strategy families remain watchlist-blocked by policy | `npm.cmd run test --workspace @stockmarket/scoring -- scoring` |
| Milestone 4 strategy policy API test | Completed | Red-green API test verified `/strategies/policies` returns policy decisions without provider keys or live trading | `npm.cmd run build --workspace @stockmarket/scoring`; `npm.cmd run test --workspace @stockmarket/api -- strategy-policies` |
| Milestone 4 strategy policy web test | Completed | Red-green web test verified the operator console displays the active strategy policy and MVP status | `npm.cmd run test --workspace @stockmarket/web -- App` |
| Milestone 4 scoring UI tests | Completed | 2 web dashboard tests passed for API-online scoring display and API-offline fallback snapshot | `npm.cmd run test --workspace @stockmarket/web -- App` |
| Milestone 4 scoring UI aggregate CI | Completed | Typecheck, lint, format, 86 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed | `npm.cmd run ci` |
| Milestone 4 scoring UI status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after scoring UI status updates | `python -m json.tool docs/status/work-items.json` |
| Milestone 4 scoring UI whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed status files | `git diff --check` |
| Milestone 4 scoring UI secret-pattern scan | Completed | No secret-shaped tokens found in app, package, docs, Codex config, env example, or package files | `rg` secret-pattern scan |
| Milestone 4 scoring UI live-trading surface scan | Completed | Matches are documented guardrails, env rejection tests, safety docs, or deferred future-phase references; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 4 scoring UI local web smoke | Completed | Existing Vite dev server on `http://127.0.0.1:3001` returned HTTP 200 after the dashboard update | `Invoke-WebRequest http://127.0.0.1:3001` |
| Milestone 4 scoring API test | Completed | Mock scoring route returned `requiresEnv: false`, no provider keys, live trading disabled, `notRecommendation: true`, and a watchlist scoring result with risk/confidence/liquidity scores | `npm.cmd run test --workspace @stockmarket/api -- scoring` |
| Milestone 4 scoring API aggregate CI | Completed | Typecheck, lint, format, 85 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed; smoke now checks `/scoring/mock-evaluation` | `npm.cmd run ci` |
| Milestone 4 scoring API status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after scoring API status updates | `python -m json.tool docs/status/work-items.json` |
| Milestone 4 scoring API whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed status Markdown files | `git diff --check` |
| Milestone 4 scoring API secret-pattern scan | Completed | No secret-shaped tokens found in app, package, docs, Codex config, env example, or package files | `rg` secret-pattern scan |
| Milestone 4 scoring API live-trading surface scan | Completed | Matches are documented guardrails, env rejection tests, safety docs, or deferred future-phase references; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 4 scoring package tests | Completed | 7 scoring tests passed for paper-trade eligible stock candidates, research-only watchlist cap, missing citation/freshness needs-more-data gates, paper exposure avoid gates, options risk-detail gates, complete options evidence, and score clamping | `npm.cmd run test --workspace @stockmarket/scoring -- scoring` |
| Milestone 4 scoring aggregate CI | Completed | Typecheck, lint, format, 84 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed | `npm.cmd run ci` |
| Milestone 4 status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after scoring status updates | `python -m json.tool docs/status/work-items.json` |
| Milestone 4 whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown files | `git diff --check` |
| Milestone 4 secret-pattern scan | Completed | No secret-shaped tokens found in app, package, docs, Codex config, env example, or package files | `rg` secret-pattern scan |
| Milestone 4 live-trading surface scan | Completed | Matches are documented guardrails, env rejection tests, safety docs, or deferred future-phase references; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 3 review-fix aggregate CI | Completed | Typecheck, lint, format, 77 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after ingestion quarantine, lineage, idempotency, and provider terms-gate fixes | `npm.cmd run ci` |
| Milestone 3 review-fix DB migration tests | Completed | 22 migration tests passed, including dataset-specific provider lineage triggers and natural-key normalized price deduplication | `npm.cmd run test --workspace @stockmarket/db -- migration` |
| Milestone 3 review-fix DB ingestion sink tests | Completed | 5 ingestion sink tests passed, including idempotent retries, preserved audit trails for rejected data, duplicate-news quarantine, and invalid option-quote quarantine | `npm.cmd run test --workspace @stockmarket/db -- ingestion-sink` |
| Milestone 3 review-fix data ingestion tests | Completed | 13 data ingestion tests passed, including run ID uniqueness, empty provider responses, missing/future timestamps, invalid price bars, duplicate news, invalid earnings dates, and options quote traps | `npm.cmd run test --workspace @stockmarket/data -- ingestion` |
| Milestone 3 review-fix provider adapter tests | Completed | 4 provider adapter tests passed; paid-provider stubs remain deferred until terms review and do not require local keys today | `npm.cmd run test --workspace @stockmarket/data -- provider-adapters` |
| Milestone 3 review-fix API dry-run test | Completed | Mock dry-run API passed without provider keys or broker execution and now reports in-memory non-durable persistence explicitly | `npm.cmd run test --workspace @stockmarket/api -- mock-ingestion` |
| Milestone 3 review-fix whitespace check | Completed | No whitespace errors; Windows line-ending warnings reviewed for changed Markdown files | `git diff --check` |
| Milestone 3 review-fix status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after review-fix status updates | `python -m json.tool docs/status/work-items.json` |
| Milestone 3 review-fix secret-pattern scan | Completed | No secret-shaped tokens found in app, package, docs, Codex config, env example, or package files | `rg` secret-pattern scan |
| Milestone 3 review-fix live-trading surface scan | Completed | Matches are documented guardrails, env rejection tests, safety docs, or deferred future-phase references; no live order implementation was introduced | `rg` live-trading/order-surface scan |
| Milestone 3 provider selection API test | Completed | Route returns provider decisions with `requiresEnv: false`, no provider keys required now, mock as the only use-now provider, paid candidates evaluate-first, and broker-adjacent providers deferred | `npm.cmd run test --workspace @stockmarket/api -- provider-selection` |
| Milestone 3 provider status API aggregate CI | Completed | Typecheck, lint, format, 68 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed; smoke now checks `/providers/selection` | `npm.cmd run ci` |
| Milestone 3 provider selection tests | Completed | Red-green tests verified only mock providers are `use_now`, paid candidates remain provider-specific `evaluate_first`, broker-adjacent candidates defer, and official-source adapters remain later candidates | `npm.cmd run test --workspace @stockmarket/data -- provider-selection` |
| Milestone 3 provider selection aggregate CI | Completed | Typecheck, lint, format, 67 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed | `npm.cmd run ci` |
| Milestone 3 dataset-specific freshness tests | Completed | Red-green tests verified options quotes stale after the delayed-quote window and earnings calendar records use a slower freshness window | `npm.cmd run test --workspace @stockmarket/data -- ingestion` |
| Milestone 3 freshness aggregate CI | Completed | Typecheck, lint, format, 63 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed after making the mock dry-run clock deterministic | `npm.cmd run ci` |
| Milestone 3 mock ingestion API dry run | Completed | Focused API test passed; route persists 4 mock ingestion runs and 5 normalized provider records to an in-memory DB while reporting `requiresEnv: false` and no provider keys | `npm.cmd run test --workspace @stockmarket/api -- mock-ingestion` |
| Milestone 3 mock ingestion aggregate CI | Completed | Typecheck, lint, format, 61 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed; API smoke now exercises `/ingestion/mock-dry-run` | `npm.cmd run ci` |
| Milestone 3 source artifact cleanup check | Completed | Removed untracked generated `.js`, `.d.ts`, and `.d.ts.map` artifacts from `packages/data/src` and `packages/db/src`; root typecheck/build did not recreate them | `npm.cmd run typecheck`; post-build source artifact scan |
| Milestone 3 provider environment clarification | Completed | Confirmed local `.env` is not required; provider-specific optional placeholders documented; generic provider keys removed from `.env.example`; root CI passed with 60 unit tests and 16 hook tests | Status JSON parse, whitespace check, provider-key naming scan, secret scan, live-trading scan, `npm.cmd run ci` |
| Milestone 3 provider adapter tests | Completed | 3 tests passed for provider metadata, absence of broker execution methods, missing-key rejection, and configured HTTP deferral until terms review | `npm.cmd run test --workspace @stockmarket/data -- provider-adapters` |
| Milestone 3 data package tests | Completed | 10 tests passed across provider adapter and mock ingestion suites | `npm.cmd run test --workspace @stockmarket/data` |
| Milestone 3 DB ingestion sink tests | Completed | 3 tests passed for transactional price batch persistence, data quality event persistence, and rollback on duplicate normalized news inserts | `npm.cmd run test --workspace @stockmarket/db -- ingestion-sink` |
| Milestone 3 DB package tests | Completed | 23 tests passed across migration and ingestion-sink suites | `npm.cmd run test --workspace @stockmarket/db` |
| Milestone 3 aggregate CI | Completed | Typecheck, lint, format, 60 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed | `npm.cmd run ci` |
| Milestone 3 data ingestion tests | Completed | 7 tests passed for provider-neutral mock providers, no broker execution methods, content hashes, missing timestamp flags, duplicate news flags, earnings date flags, and options liquidity/spread flags | `npm.cmd run test --workspace @stockmarket/data -- ingestion` |
| Milestone 3 DB migration tests | Completed | 20 tests passed, including normalized price/news/earnings/options tables, provider lineage constraints, duplicate news rejection, and unsafe market-data rejection | `npm.cmd run test --workspace @stockmarket/db -- migration` |
| Pre-merge review aggregate CI | Completed | Typecheck, lint, format, 43 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed | `npm.cmd run ci` |
| Pre-merge core schema regression | Completed | 7 core schema tests passed, including malformed ISO timestamp rejection | `npm.cmd run test --workspace @stockmarket/core -- schemas` |
| Pre-merge DB migration and gate regression | Completed | 16 DB migration tests passed, including checksum tamper detection, transactional rollback, nonempty invalidation conditions, and paper-trade liquidity threshold | `npm.cmd run test --workspace @stockmarket/db -- migration` |
| Pre-merge hook policy regression | Completed | 16 hook policy tests passed, including secret-file staging blocks, `.env.example` allowance, narrowed auto-allow rules, and relative out-of-repo write blocks | `python -m unittest discover .codex/hooks/tests` |
| Pre-merge JSON/TOML parse | Completed | `docs/status/work-items.json`, `.codex/hooks.json`, `.codex/config.toml`, and custom agent TOML files parsed successfully | `python -m json.tool`; Python `tomllib` |
| Pre-merge whitespace check | Completed | No whitespace errors; only Git line-ending warnings on Windows working copy | `git diff --check` |
| Pre-merge secret-pattern scan | Completed | No secret-shaped tokens found in changed files | Strict changed-file scan |
| Pre-merge live-trading surface scan | Completed | Matches in app/package code were the API broker/env guardrail and its test only | `rg` live-trading/order-surface scan over `apps`, `packages`, and `.env.example` |
| Deprecated hook feature-key assignment scan | Completed | No deprecated hook feature assignment found in project Codex config; project uses `[features] hooks = true` | `rg -n "codex_hooks\\s*=" .codex AGENTS.md package.json` |
| Hook policy tests | Completed | 16 tests passed after latest permission autonomy and review-blocker hook update | `python -m unittest discover .codex/hooks/tests` |
| Codex permission autonomy hook tests | Completed | 16 tests passed; routine project permission requests allow, dependency additions, commits, merges, and remote publication defer, broker order requests block | `python -m unittest discover .codex/hooks/tests` |
| Codex permission config parse | Completed | `.codex/config.toml` and custom agent TOML files parsed successfully after enabling sandbox approval for hook-resolved routine prompts | Python `tomllib` parse |
| Hook JSON parse after permission update | Completed | `.codex/hooks.json` parsed successfully | `python -m json.tool .codex/hooks.json` |
| Permission autonomy aggregate CI | Completed | Typecheck, lint, format, 43 unit tests, 16 hook tests, dependency audit, production build, and API smoke passed | `npm.cmd run ci` |
| Hook script compile | Completed | Hook Python scripts compiled successfully | `python -m py_compile .codex/hooks/*.py` equivalent |
| Hook smoke test | Completed | `SessionStart` and `Stop` hooks returned expected context/reminders | Direct hook script execution with sample event |
| Hook config parse | Completed | `.codex/hooks.json` parsed successfully | Python JSON parse |
| Codex config parse | Completed | `.codex/config.toml` and all `.codex/agents/*.toml` parsed successfully | Python `tomllib` parse |
| Skill validation | Completed | All 10 repo skills have required metadata | Python metadata check |
| Secret-pattern scan | Completed | No matches with stricter secret-shaped token scan | `rg` secret-pattern scan |
| Unfinished-marker scan | Completed | No matches | `rg` unfinished-marker scan |
| Status JSON parse | Completed | `docs/status/work-items.json` parsed successfully | Python JSON parse |
| Research source review | Completed | Source links, license notes, and CEO/CTO decisions documented in `docs/research/` | Manual source review |
| Quant strategy source review | Completed | Strategy categories, source links, risk controls, and CEO/CTO decisions documented in `docs/research/quant-strategies.md` | Web research plus subagent handoff review |
| Quant docs JSON parse | Completed | `docs/status/work-items.json` parsed successfully after quant addendum updates | `python -m json.tool docs/status/work-items.json` |
| Quant docs whitespace check | Completed | No whitespace errors; only Git line-ending warnings on Windows working copy | `git diff --check` |
| Quant docs secret-pattern scan | Completed | No matches after secret-shaped pattern scan | `rg` secret-pattern scan over changed docs |
| Quant docs unfinished-marker scan | Completed | No matches after unfinished-marker scan | `rg` unfinished-marker scan over changed docs |
| Quant docs ASCII scan | Completed | No non-ASCII characters found in changed docs | `rg "[^\\x00-\\x7F]"` over changed docs |
| Foundation review hook tests | Completed | 11 tests passed, including `.env.*` variant coverage | `python -m unittest discover .codex/hooks/tests` |
| Foundation review hook syntax | Completed | 9 hook Python files parse with `compile(...)`; bytecode compile skipped because local `__pycache__` write hit a permission error | Python syntax compile over `.codex/hooks/*.py` |
| Foundation review config parse | Completed | `.codex/hooks.json`, `.codex/config.toml`, and agent TOML files parse | `python -m json.tool`; Python `tomllib` |
| Foundation review secret scan | Completed | No real secret patterns found; env-example and NIST URL false positives were reviewed | `rg` secret-pattern scan |
| Foundation review `.env.*` hook check | Completed | `.env`, `.env.local`, `.env.production`, `.env.test`, and `.env.development` read commands return `block` | Direct `classify_command` check |
| `.env.*` regression test | Completed | Regression test failed before policy change and passed after policy change | `python -m unittest discover .codex/hooks/tests -k test_env_reading_is_blocked` |
| Milestone 1 plan status JSON parse | Completed | `docs/status/work-items.json` parsed successfully | `python -m json.tool docs/status/work-items.json` |
| Milestone 1 plan whitespace check | Completed | No whitespace errors; only Git line-ending warnings on Windows working copy | `git diff --check` |
| Milestone 1 plan unfinished-marker scan | Completed | No unfinished markers found after wording cleanup | `rg` scan over plan and status docs |
| Milestone 1 plan secret-pattern scan | Completed | No secret-shaped tokens found | `rg` secret-pattern scan over plan and status docs |
| Milestone 1 plan safety scan | Completed | Only matched the safety-scan command embedded in the plan itself | `rg` live-trading/order-surface scan over plan and status docs |
| Milestone 1 plan ASCII scan | Completed | No non-ASCII characters found | `rg "[^\\x00-\\x7F]"` over plan and status docs |
| Milestone 1 dependency install | Completed | npm installed workspace dependencies and reported 0 vulnerabilities | `npm.cmd install` |
| Milestone 1 typecheck | Completed | TypeScript project references passed | `npm.cmd run typecheck` |
| Milestone 1 unit tests | Completed | 16 tests passed across core, API, and web projects; run escalated because sandbox blocked Vitest config reads on Windows | `npm.cmd run test` |
| Milestone 1 lint | Completed | ESLint passed after nested `dist` directories were ignored | `npm.cmd run lint` |
| Milestone 1 format check | Completed | Prettier check passed for scaffold code/config files | `npm.cmd run format:check` |
| Milestone 1 build | Completed | API, web, and package builds passed; run escalated because sandbox blocked Vite config reads on Windows | `npm.cmd run build` |
| Milestone 1 hook regression | Completed | 11 hook tests passed | `python -m unittest discover .codex/hooks/tests` |
| Milestone 1 HTTP UI smoke | Completed | Vite dev server returned HTTP 200 at `http://127.0.0.1:3001` | `Invoke-WebRequest http://127.0.0.1:3001` |
| Milestone 1 web port adjustment | Completed | StockMarket web moved from port 3000 to strict port 3001 to avoid another local UI | `apps/web/vite.config.ts` and `apps/web/package.json` |
| Milestone 1 browser smoke | Skipped | Browser plugin loaded, but no browser backends were available in this session | Browser backend list returned `[]` |
| Milestone 1 status JSON parse | Completed | `docs/status/work-items.json` parsed successfully | `python -m json.tool docs/status/work-items.json` |
| Milestone 1 whitespace check | Completed | No whitespace errors; only Git line-ending warnings on Windows working copy | `git diff --check` |
| Milestone 1 unfinished-marker scan | Completed | No unfinished markers found in scaffold files or status docs | `rg` unfinished-marker scan |
| Milestone 1 secret-pattern scan | Completed | No secret-shaped tokens found in scaffold files, docs, hooks, or package files | `rg` secret-pattern scan |
| Milestone 1 safety scan | Completed | Matches were expected guardrails or plan/spec safety-scan text; no live order implementation exists | `rg` live-trading/order-surface scan |
| Milestone 1 ASCII scan | Completed | No non-ASCII characters found in scaffold and status files | `rg "[^\\x00-\\x7F]"` over changed scaffold/status files |
| Milestone 1 review ESM runtime regression | Completed | Built API/core ESM imports load under Node after switching Node packages to NodeNext-compatible imports | `node -e "import('./packages/core/dist/index.js')"` and API server import/injection smoke |
| Milestone 1 review broker env rejection | Completed | API rejects broker credential-style environment variables such as `ALPACA_API_KEY` in MVP | `npm.cmd run test --workspace @stockmarket/api -- env` |
| Milestone 1 review `.env.*` hook bypass regression | Completed | Read commands for `.env.local`, `.env.production`, and `.env.test` variants are blocked | `python -m unittest discover .codex/hooks/tests -k test_env_reading_is_blocked` |
| Milestone 1 review eligibility gates | Completed | Paper-trade eligibility now requires fresh data, audit record, score bounds, liquidity threshold, narratives, finite options max loss, and options evidence fields | `npm.cmd run test --workspace @stockmarket/core -- recommendation` |
| Milestone 1 aggregate CI | Completed | Typecheck, lint, format, unit tests, hook tests, dependency audit, build, and API smoke all passed | `npm.cmd run ci` |
| Milestone 1 review dependency audit | Completed | npm reported 0 vulnerabilities after registry-access retry | `npm.cmd run audit:deps` |
| Milestone 1 review API smoke | Completed | Built API health route returned expected response with live trading disabled | `npm.cmd run smoke:api` |
| Milestone 1 review secret-pattern scan | Completed | No secret-shaped tokens or broker credential assignments found; scan returned no matches | `rg` secret-pattern scan |
| Milestone 2 data subagent handoff | Completed | Data engineering recommended Drizzle, committed SQL migrations, strong provider lineage, and explicit DB constraints | Multi-agent `data-engineering` handoff |
| Milestone 2 security subagent handoff | Completed | Security/compliance approved research-only M2 with stricter audit, options, retention, and broker/env guardrails | Multi-agent `security-compliance` handoff |
| Milestone 2 design spec | Completed | Domain/database design written with Drizzle/libSQL local MVP decision and Postgres future path | `docs/superpowers/specs/2026-05-28-milestone-2-domain-db-design.md` |
| Milestone 2 implementation plan | Completed | Implementation plan written for runtime schemas, DB migrations, env guardrails, docs, and validation | `docs/superpowers/plans/2026-05-28-milestone-2-domain-db.md` |
| Milestone 2 planning status JSON parse | Completed | `docs/status/work-items.json` parsed successfully | `python -m json.tool docs/status/work-items.json` |
| Milestone 2 planning whitespace check | Completed | No whitespace errors; only Git line-ending warnings on Windows working copy | `git diff --check` |
| Milestone 2 planning unfinished-marker scan | Completed | No unfinished markers found in planning/status docs | `rg` unfinished-marker scan |
| Milestone 2 planning secret-pattern scan | Completed | No token-shaped secret matches found in planning/status docs | stricter `rg` secret-pattern scan |
| Milestone 2 dependency install | Completed | Added `zod`, `drizzle-orm`, and `@libsql/client`; removed Drizzle Kit after audit findings; final audit clean | `npm.cmd install`; `npm.cmd uninstall drizzle-kit`; `npm.cmd run audit:deps` |
| Milestone 2 core contract tests | Completed | 21 core tests passed, including runtime schema, strict ISO timestamp parsing, paper-trade schema gates, options liquidity gates, and no-trade options records with failed liquidity | `npm.cmd run test --workspace @stockmarket/core` |
| Milestone 2 DB migration tests | Completed | 16 DB tests passed for clean migration, checksum integrity, transactional rollback, uniqueness, score checks, no generic metadata columns, citation requirements, nonempty invalidation conditions, liquidity threshold gates, options risk details, explicit NULL guards, nonempty evidence gates, and citation insert | `npm.cmd run test --workspace @stockmarket/db` |
| Milestone 2 API env guardrail tests | Completed | 4 API env tests passed, including expanded broker/execution prefix rejection without value disclosure | `npm.cmd run test --workspace @stockmarket/api -- env` |
| Milestone 2 full unit tests | Completed | 43 tests passed across API, web, core, and DB projects | `npm.cmd run test` |
| Milestone 2 typecheck | Completed | TypeScript project references passed after Drizzle check helper fix | `npm.cmd run typecheck` |
| Milestone 2 lint | Completed | ESLint passed | `npm.cmd run lint` |
| Milestone 2 format check | Completed | Prettier check passed after formatting touched files | `npm.cmd run format:check` |
| Milestone 2 dependency audit | Completed | npm reported 0 vulnerabilities after Drizzle Kit removal | `npm.cmd run audit:deps` |
| Milestone 2 production build | Completed | API, web, and package builds passed | `npm.cmd run build` |
| Milestone 2 API smoke | Completed | Built API health route returned expected response with live trading disabled | `npm.cmd run smoke:api` |
| Milestone 2 aggregate CI | Completed | Typecheck, lint, format, 43 tests, 16 hook tests, dependency audit, build, and API smoke passed after security, QA, and architecture review fixes | `npm.cmd run ci` |
| Milestone 2 security review fixes | Completed | Added DB option-risk persistence gates, required primary citation fields, runtime paper-trade schema gates, no-trade options liquidity support, explicit SQLite NULL guards, nonempty evidence checks, and removal of generic metadata JSON columns | Security/compliance review handoff plus focused tests |
| Milestone 2 status JSON parse | Completed | `docs/status/work-items.json` parsed successfully after implementation status updates | `python -m json.tool docs/status/work-items.json` |
| Milestone 2 whitespace check | Completed | No whitespace errors; only Git line-ending warnings on Windows working copy | `git diff --check` |
| Milestone 2 secret-pattern scan | Completed | No token-shaped secret matches found | stricter `rg` secret-pattern scan |
| Milestone 2 live-trading safety scan | Completed | Matches were expected hook/test/spec guardrail text only; no live order implementation exists | `rg` live-trading/order-surface scan |
| Milestone 2 security re-review | Completed | Security/compliance reviewer reported no remaining blockers after explicit NULL/evidence guards and metadata column removal | Multi-agent `security-compliance` re-review |

## Rule

When source code, hooks, configuration, status files, or research docs change, update this file with what was validated, what was skipped, and why.
