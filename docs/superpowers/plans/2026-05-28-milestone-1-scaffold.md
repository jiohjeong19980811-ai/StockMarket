# Milestone 1 Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first npm-workspaces TypeScript scaffold for StockMarket with safe API/UI shells, shared domain contracts, validation commands, and no live-trading surface.

**Architecture:** The repo will become a modular TypeScript monorepo with `apps/api`, `apps/web`, and shared packages under `packages/`. `packages/core` owns domain contracts used by the API, web app, and future scoring/backtesting modules. The API starts with health/env validation only; the web app starts as a static operator console shell with no recommendation generation.

**Tech Stack:** npm workspaces, TypeScript, Fastify, Vite React, Vitest, ESLint, Prettier, Zod.

---

## File Structure

- Create `package.json`: root workspace scripts and dependency catalog.
- Create `tsconfig.base.json`: shared strict TypeScript compiler settings.
- Create `tsconfig.json`: root TypeScript build references.
- Create `vitest.workspace.ts`: workspace-aware Vitest projects.
- Create `eslint.config.mjs`: root lint config for TypeScript and React.
- Create `.prettierrc.json` and `.prettierignore`: deterministic code formatting without reformatting existing docs.
- Create `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/vitest.config.ts`, `apps/api/src/env.ts`, `apps/api/src/server.ts`, `apps/api/src/index.ts`, `apps/api/test/env.test.ts`, and `apps/api/test/health.test.ts`.
- Create `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/tsconfig.node.json`, `apps/web/vitest.config.ts`, `apps/web/vite.config.ts`, `apps/web/index.html`, `apps/web/src/App.tsx`, `apps/web/src/main.tsx`, `apps/web/src/styles.css`, and `apps/web/test/App.test.tsx`.
- Create package stubs for `packages/core`, `packages/data`, `packages/db`, `packages/scoring`, `packages/backtesting`, `packages/paper-trading`, and `packages/agents`.
- Modify `docs/status/current-work.md`, `docs/status/work-items.json`, and `docs/status/validation-status.md` after scaffold validation.

### Task 1: Root Workspace Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `tsconfig.json`
- Create: `vitest.workspace.ts`
- Create: `eslint.config.mjs`
- Create: `.prettierrc.json`
- Create: `.prettierignore`

- [ ] **Step 1: Write root package and config files**

Create `package.json`:

```json
{
  "name": "stockmarket",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "npm@11.9.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "lint": "eslint .",
    "format:check": "prettier \"apps/**/*.{ts,tsx,css,html,json}\" \"packages/**/*.{ts,json}\" \"*.{json,ts,mjs}\" --check",
    "format": "prettier \"apps/**/*.{ts,tsx,css,html,json}\" \"packages/**/*.{ts,json}\" \"*.{json,ts,mjs}\" --write"
  },
  "engines": {
    "node": ">=24.0.0",
    "npm": ">=11.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react-hooks": "^7.0.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "fastify": "^5.0.0",
    "globals": "^16.0.0",
    "jsdom": "^27.0.0",
    "prettier": "^3.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "typescript-eslint": "^8.0.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0",
    "zod": "^4.0.0"
  }
}
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@stockmarket/core": ["packages/core/src/index.ts"],
      "@stockmarket/data": ["packages/data/src/index.ts"],
      "@stockmarket/db": ["packages/db/src/index.ts"],
      "@stockmarket/scoring": ["packages/scoring/src/index.ts"],
      "@stockmarket/backtesting": ["packages/backtesting/src/index.ts"],
      "@stockmarket/paper-trading": ["packages/paper-trading/src/index.ts"],
      "@stockmarket/agents": ["packages/agents/src/index.ts"]
    }
  }
}
```

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/data" },
    { "path": "./packages/db" },
    { "path": "./packages/scoring" },
    { "path": "./packages/backtesting" },
    { "path": "./packages/paper-trading" },
    { "path": "./packages/agents" },
    { "path": "./apps/api" },
    { "path": "./apps/web" }
  ]
}
```

Create `vitest.workspace.ts`:

```ts
import { defineWorkspace } from "vitest/config";

export default defineWorkspace(["packages/*/vitest.config.ts", "apps/*/vitest.config.ts"]);
```

Create `eslint.config.mjs`:

```js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "build",
      "coverage",
      "node_modules",
      ".codex/hooks/__pycache__",
      "docs"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
    }
  }
);
```

Create `.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100
}
```

Create `.prettierignore`:

```text
node_modules
dist
build
coverage
docs
.agents
.codex/hooks/__pycache__
```

- [ ] **Step 2: Install root dependencies**

Run:

```powershell
npm.cmd install
```

Expected: `package-lock.json` is created, dependencies install, and no install script asks for secrets or broker credentials.

- [ ] **Step 3: Commit root config**

Run:

```powershell
git add package.json package-lock.json tsconfig.base.json tsconfig.json vitest.workspace.ts eslint.config.mjs .prettierrc.json .prettierignore
git commit -m "chore: add workspace tooling"
```

### Task 2: Core Domain Contracts

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/src/recommendation.ts`
- Create: `packages/core/src/strategy.ts`
- Create: `packages/core/src/risk.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/test/recommendation.test.ts`

- [ ] **Step 1: Write package config and failing contract tests**

Create `packages/core/package.json`:

```json
{
  "name": "@stockmarket/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "dependencies": {}
}
```

Create `packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
  },
  "include": ["src"],
  "references": []
}
```

Create `packages/core/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"]
  }
});
```

Create `packages/core/test/recommendation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  isPaperTradeEligible,
  opportunityDecisions,
  type Recommendation
} from "../src/index";

const baseRecommendation: Recommendation = {
  id: "rec_test_1",
  ticker: "MSFT",
  thesis: "Post-earnings drift research candidate after a positive surprise.",
  instrumentType: "stock",
  strategyFamily: "earnings",
  strategyVersion: "earnings-pead-v0",
  decision: "watchlist",
  evidenceStatus: "watchlist_eligible",
  sourceCitations: [
    {
      title: "Example earnings release",
      url: "https://example.com/earnings",
      source: "example",
      publishedAt: "2026-05-01T12:00:00Z",
      retrievedAt: "2026-05-01T12:05:00Z"
    }
  ],
  dataFreshness: {
    status: "fresh",
    asOf: "2026-05-01T12:05:00Z",
    notes: []
  },
  scores: {
    risk: 45,
    confidence: 62,
    liquidity: 88
  },
  bullCase: "Positive surprise and strong liquidity support follow-through research.",
  bearCase: "The surprise may already be priced in.",
  downsideScenario: "Shares reverse below the post-earnings gap.",
  invalidationConditions: ["Close below post-earnings low"],
  whySystemMightBeWrong: "Guidance quality may matter more than headline surprise.",
  createdAt: "2026-05-01T12:10:00Z",
  updatedAt: "2026-05-01T12:10:00Z"
};

describe("recommendation contract", () => {
  it("keeps no-trade outcomes first class", () => {
    expect(opportunityDecisions).toEqual([
      "watchlist",
      "paper_trade",
      "avoid",
      "needs_more_data"
    ]);
  });

  it("allows stock paper trades only when evidence and risk fields are present", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_123"
    };

    expect(isPaperTradeEligible(recommendation)).toBe(true);
  });

  it("blocks paper trade eligibility when evidence is missing", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      decision: "paper_trade",
      evidenceStatus: "watchlist_eligible"
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });

  it("blocks options paper trades without historical options evidence", () => {
    const recommendation: Recommendation = {
      ...baseRecommendation,
      instrumentType: "long_call",
      strategyFamily: "options",
      decision: "paper_trade",
      evidenceStatus: "paper_trade_eligible",
      backtestRunId: "bt_456",
      optionsRiskDetails: {
        maxLoss: 250,
        expiration: "2026-06-19",
        strikeLogic: "Delta-targeted long call research candidate.",
        spreadRisk: "Bid/ask spread above target threshold.",
        eventRisk: "Earnings event occurs before expiration.",
        thetaRisk: "Theta decay accelerates inside 30 DTE."
      }
    };

    expect(isPaperTradeEligible(recommendation)).toBe(false);
  });
});
```

Run:

```powershell
npm.cmd install
npm.cmd run test --workspace @stockmarket/core -- recommendation
```

Expected: FAIL because `packages/core/src/index.ts` does not exist.

- [ ] **Step 2: Implement core contracts**

Create `packages/core/src/strategy.ts`:

```ts
export const strategyFamilies = [
  "earnings",
  "momentum",
  "mean_reversion",
  "volatility",
  "options",
  "news_sentiment",
  "value_quality",
  "sector_macro",
  "portfolio_risk"
] as const;

export type StrategyFamily = (typeof strategyFamilies)[number];

export const evidenceStatuses = [
  "research_only",
  "watchlist_eligible",
  "paper_trade_eligible",
  "avoid",
  "needs_more_data"
] as const;

export type EvidenceStatus = (typeof evidenceStatuses)[number];
```

Create `packages/core/src/risk.ts`:

```ts
export interface ScoreSet {
  risk: number;
  confidence: number;
  liquidity: number;
}

export interface DataFreshness {
  status: "fresh" | "stale" | "partial" | "missing";
  asOf: string;
  notes: string[];
}
```

Create `packages/core/src/recommendation.ts`:

```ts
import type { DataFreshness, ScoreSet } from "./risk";
import type { EvidenceStatus, StrategyFamily } from "./strategy";

export const opportunityDecisions = [
  "watchlist",
  "paper_trade",
  "avoid",
  "needs_more_data"
] as const;

export type OpportunityDecision = (typeof opportunityDecisions)[number];

export type InstrumentType = "stock" | "long_call" | "long_put" | "debit_spread";

export interface SourceCitation {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  retrievedAt: string;
}

export interface OptionsRiskDetails {
  maxLoss: number;
  expiration: string;
  strikeLogic: string;
  spreadRisk: string;
  eventRisk: string;
  thetaRisk: string;
  historicalOptionsEvidenceId?: string;
}

export interface Recommendation {
  id: string;
  ticker: string;
  thesis: string;
  instrumentType: InstrumentType;
  strategyFamily: StrategyFamily;
  strategyVersion: string;
  decision: OpportunityDecision;
  evidenceStatus: EvidenceStatus;
  sourceCitations: SourceCitation[];
  dataFreshness: DataFreshness;
  scores: ScoreSet;
  bullCase: string;
  bearCase: string;
  downsideScenario: string;
  invalidationConditions: string[];
  whySystemMightBeWrong: string;
  backtestRunId?: string;
  paperTradeEvidenceId?: string;
  optionsRiskDetails?: OptionsRiskDetails;
  createdAt: string;
  updatedAt: string;
}

function isOptionsInstrument(instrumentType: InstrumentType): boolean {
  return instrumentType === "long_call" || instrumentType === "long_put" || instrumentType === "debit_spread";
}

export function isPaperTradeEligible(recommendation: Recommendation): boolean {
  if (recommendation.decision !== "paper_trade") {
    return false;
  }
  if (recommendation.evidenceStatus !== "paper_trade_eligible") {
    return false;
  }
  if (!recommendation.backtestRunId && !recommendation.paperTradeEvidenceId) {
    return false;
  }
  if (recommendation.sourceCitations.length === 0) {
    return false;
  }
  if (recommendation.invalidationConditions.length === 0) {
    return false;
  }
  if (isOptionsInstrument(recommendation.instrumentType)) {
    return Boolean(recommendation.optionsRiskDetails?.historicalOptionsEvidenceId);
  }
  return true;
}
```

Create `packages/core/src/index.ts`:

```ts
export * from "./recommendation";
export * from "./risk";
export * from "./strategy";
```

- [ ] **Step 3: Verify core tests pass**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/core
```

Expected: PASS with `4` tests.

- [ ] **Step 4: Commit core contracts**

Run:

```powershell
git add packages/core package-lock.json
git commit -m "feat: add core recommendation contracts"
```

### Task 3: API Scaffold

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/env.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/test/env.test.ts`
- Create: `apps/api/test/health.test.ts`

- [ ] **Step 1: Write package config and failing API tests**

Create `apps/api/package.json`:

```json
{
  "name": "@stockmarket/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -b",
    "dev": "node --watch --import tsx src/index.ts",
    "start": "node dist/index.js",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "dependencies": {}
}
```

Create `apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/core" }]
}
```

Create `apps/api/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"]
  }
});
```

Create `apps/api/test/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/env";

describe("API environment validation", () => {
  it("rejects live trading", () => {
    expect(() =>
      loadEnv({
        APP_ENV: "development",
        API_PORT: "4000",
        LIVE_TRADING_ENABLED: "true"
      })
    ).toThrow("LIVE_TRADING_ENABLED must remain false in MVP");
  });

  it("loads safe development defaults", () => {
    const env = loadEnv({
      APP_ENV: "development",
      API_PORT: "4000",
      LIVE_TRADING_ENABLED: "false"
    });

    expect(env.APP_ENV).toBe("development");
    expect(env.API_PORT).toBe(4000);
    expect(env.LIVE_TRADING_ENABLED).toBe(false);
  });
});
```

Create `apps/api/test/health.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server";

describe("health route", () => {
  it("returns service health without trading endpoints", async () => {
    const server = buildServer({
      APP_ENV: "test",
      API_PORT: 4000,
      LIVE_TRADING_ENABLED: false
    });

    const response = await server.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      service: "stockmarket-api",
      status: "ok",
      appEnv: "test",
      liveTradingEnabled: false
    });
  });
});
```

Run:

```powershell
npm.cmd install
npm.cmd run test --workspace @stockmarket/api
```

Expected: FAIL because `apps/api/src/env.ts` and `apps/api/src/server.ts` do not exist.

- [ ] **Step 2: Implement API scaffold**

Create `apps/api/src/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LIVE_TRADING_ENABLED: z
    .enum(["false", "False", "FALSE", "0", "true", "True", "TRUE", "1"])
    .default("false")
    .transform((value) => value === "true" || value === "True" || value === "TRUE" || value === "1")
});

export type ApiEnv = {
  APP_ENV: "development" | "test" | "production";
  API_PORT: number;
  LIVE_TRADING_ENABLED: boolean;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  const parsed = envSchema.parse(source);
  if (parsed.LIVE_TRADING_ENABLED) {
    throw new Error("LIVE_TRADING_ENABLED must remain false in MVP");
  }
  return parsed;
}
```

Create `apps/api/src/server.ts`:

```ts
import fastify from "fastify";
import type { ApiEnv } from "./env";

export function buildServer(env: ApiEnv) {
  const server = fastify({
    logger: env.APP_ENV !== "test"
  });

  server.get("/health", async () => ({
    service: "stockmarket-api",
    status: "ok",
    appEnv: env.APP_ENV,
    liveTradingEnabled: env.LIVE_TRADING_ENABLED,
    timestamp: new Date().toISOString()
  }));

  return server;
}
```

Create `apps/api/src/index.ts`:

```ts
import { loadEnv } from "./env";
import { buildServer } from "./server";

const env = loadEnv();
const server = buildServer(env);

await server.listen({ port: env.API_PORT, host: "127.0.0.1" });
```

- [ ] **Step 3: Verify API tests pass**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/api
```

Expected: PASS with `3` tests.

- [ ] **Step 4: Commit API scaffold**

Run:

```powershell
git add apps/api package-lock.json
git commit -m "feat: add safe API scaffold"
```

### Task 4: Web Scaffold

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/styles.css`
- Create: `apps/web/test/App.test.tsx`

- [ ] **Step 1: Write package config and failing web test**

Create `apps/web/package.json`:

```json
{
  "name": "@stockmarket/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -b && vite build",
    "dev": "vite --host 127.0.0.1",
    "preview": "vite preview --host 127.0.0.1",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "dependencies": {
    "@stockmarket/core": "0.1.0"
  }
}
```

Create `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/core" }]
}
```

Create `apps/web/tsconfig.node.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

Create `apps/web/vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.tsx"]
  }
});
```

Create `apps/web/vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3000
  }
});
```

Create `apps/web/test/App.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("operator console shell", () => {
  it("shows research-first safety posture", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "StockMarket Operator Console" })).toBeInTheDocument();
    expect(screen.getByText("Research first. Paper trading first. Live trading prohibited.")).toBeInTheDocument();
    expect(screen.getByText("No good trades today is a valid outcome.")).toBeInTheDocument();
  });
});
```

Run:

```powershell
npm.cmd install
npm.cmd run test --workspace @stockmarket/web
```

Expected: FAIL because `apps/web/src/App.tsx` does not exist.

- [ ] **Step 2: Implement web scaffold**

Create `apps/web/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StockMarket Operator Console</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `apps/web/src/App.tsx`:

```tsx
const panels = [
  {
    title: "Daily Opportunities",
    body: "No recommendations are generated until data, citations, risk, and evidence gates exist."
  },
  {
    title: "Strategy Evidence",
    body: "Strategies start as hypotheses and require reproducible validation before paper-trade eligibility."
  },
  {
    title: "Data Freshness",
    body: "Provider timestamps and quality checks will drive confidence and no-trade outcomes."
  },
  {
    title: "Paper Trading",
    body: "Simulated decisions will be recorded before any future broker integration is considered."
  }
];

export function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Milestone 1</p>
          <h1>StockMarket Operator Console</h1>
        </div>
        <span className="status-pill">Research MVP</span>
      </header>

      <section className="summary-band">
        <p>Research first. Paper trading first. Live trading prohibited.</p>
        <p>No good trades today is a valid outcome.</p>
      </section>

      <section className="panel-grid" aria-label="Operator workflow preview panels">
        {panels.map((panel) => (
          <article className="panel" key={panel.title}>
            <h2>{panel.title}</h2>
            <p>{panel.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
```

Create `apps/web/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Create `apps/web/src/styles.css`:

```css
:root {
  color: #172026;
  background: #f4f7f6;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.topbar {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin: 0 auto 24px;
  max-width: 1120px;
}

.eyebrow {
  color: #49645c;
  font-size: 0.8rem;
  font-weight: 700;
  margin: 0 0 4px;
  text-transform: uppercase;
}

h1 {
  font-size: 2rem;
  line-height: 1.15;
  margin: 0;
}

.status-pill {
  border: 1px solid #a4b8b0;
  border-radius: 999px;
  color: #24443a;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 8px 12px;
}

.summary-band {
  background: #ffffff;
  border: 1px solid #d9e2de;
  border-radius: 8px;
  display: grid;
  gap: 8px;
  margin: 0 auto 20px;
  max-width: 1120px;
  padding: 18px;
}

.summary-band p {
  margin: 0;
}

.panel-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin: 0 auto;
  max-width: 1120px;
}

.panel {
  background: #ffffff;
  border: 1px solid #d9e2de;
  border-radius: 8px;
  padding: 16px;
}

.panel h2 {
  font-size: 1rem;
  margin: 0 0 8px;
}

.panel p {
  color: #49645c;
  line-height: 1.5;
  margin: 0;
}
```

- [ ] **Step 3: Verify web tests pass**

Run:

```powershell
npm.cmd run test --workspace @stockmarket/web
```

Expected: PASS with `1` test.

- [ ] **Step 4: Commit web scaffold**

Run:

```powershell
git add apps/web package-lock.json
git commit -m "feat: add operator web scaffold"
```

### Task 5: Package Stubs

**Files:**
- Create: `packages/data/package.json`, `packages/data/tsconfig.json`, `packages/data/src/index.ts`
- Create: `packages/db/package.json`, `packages/db/tsconfig.json`, `packages/db/src/index.ts`
- Create: `packages/scoring/package.json`, `packages/scoring/tsconfig.json`, `packages/scoring/src/index.ts`
- Create: `packages/backtesting/package.json`, `packages/backtesting/tsconfig.json`, `packages/backtesting/src/index.ts`
- Create: `packages/paper-trading/package.json`, `packages/paper-trading/tsconfig.json`, `packages/paper-trading/src/index.ts`
- Create: `packages/agents/package.json`, `packages/agents/tsconfig.json`, `packages/agents/src/index.ts`

- [ ] **Step 1: Create data package stub**

Create `packages/data/package.json`:

```json
{
  "name": "@stockmarket/data",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint ."
  },
  "dependencies": {
    "@stockmarket/core": "0.1.0"
  }
}
```

Create `packages/data/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../core" }]
}
```

Create `packages/data/src/index.ts`:

```ts
export interface ProviderMetadata {
  providerName: string;
  retrievedAt: string;
  providerTimestamp?: string;
  qualityStatus: "fresh" | "stale" | "partial" | "missing";
}
```

- [ ] **Step 2: Create db package stub**

Create `packages/db/package.json`:

```json
{
  "name": "@stockmarket/db",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint ."
  },
  "dependencies": {
    "@stockmarket/core": "0.1.0"
  }
}
```

Create `packages/db/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../core" }]
}
```

Create `packages/db/src/index.ts`:

```ts
export const databasePackageStatus = "schema-deferred-to-milestone-2" as const;
```

- [ ] **Step 3: Create scoring package stub**

Create `packages/scoring/package.json`:

```json
{
  "name": "@stockmarket/scoring",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint ."
  },
  "dependencies": {
    "@stockmarket/core": "0.1.0"
  }
}
```

Create `packages/scoring/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../core" }]
}
```

Create `packages/scoring/src/index.ts`:

```ts
export const scoringPackageStatus = "scoring-deferred-to-milestone-4" as const;
```

- [ ] **Step 4: Create backtesting package stub**

Create `packages/backtesting/package.json`:

```json
{
  "name": "@stockmarket/backtesting",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint ."
  },
  "dependencies": {
    "@stockmarket/core": "0.1.0"
  }
}
```

Create `packages/backtesting/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../core" }]
}
```

Create `packages/backtesting/src/index.ts`:

```ts
export const backtestingPackageStatus = "backtesting-deferred-to-milestone-7" as const;
```

- [ ] **Step 5: Create paper-trading package stub**

Create `packages/paper-trading/package.json`:

```json
{
  "name": "@stockmarket/paper-trading",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint ."
  },
  "dependencies": {
    "@stockmarket/core": "0.1.0"
  }
}
```

Create `packages/paper-trading/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../core" }]
}
```

Create `packages/paper-trading/src/index.ts`:

```ts
export const paperTradingPackageStatus = "paper-trading-deferred-to-milestone-6" as const;
```

- [ ] **Step 6: Create agents package stub**

Create `packages/agents/package.json`:

```json
{
  "name": "@stockmarket/agents",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint ."
  },
  "dependencies": {
    "@stockmarket/core": "0.1.0"
  }
}
```

Create `packages/agents/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../core" }]
}
```

Create `packages/agents/src/index.ts`:

```ts
export const agentsPackageStatus = "runtime-agent-orchestration-deferred" as const;
```

- [ ] **Step 7: Verify package type checking**

Run:

```powershell
npm.cmd install
npm.cmd run typecheck
```

Expected: PASS with all workspace projects.

- [ ] **Step 8: Commit package stubs**

Run:

```powershell
git add packages/data packages/db packages/scoring packages/backtesting packages/paper-trading packages/agents package-lock.json
git commit -m "chore: add shared package stubs"
```

### Task 6: Full Scaffold Validation And Status

**Files:**
- Modify: `docs/status/current-work.md`
- Modify: `docs/status/work-items.json`
- Modify: `docs/status/validation-status.md`

- [ ] **Step 1: Run full validation**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run lint
npm.cmd run format:check
npm.cmd run build
python -m unittest discover .codex/hooks/tests
python -m json.tool docs/status/work-items.json
```

Expected:

- Type check passes.
- Unit tests pass.
- Lint passes.
- Format check passes.
- Build passes.
- Hook tests pass.
- Status JSON parses.

- [ ] **Step 2: Update status docs**

Set the active focus row values in `docs/status/current-work.md` to:

```markdown
| Current phase | Milestone 1: Project Scaffold |
| Current task | npm-workspaces TypeScript scaffold completed |
| Owner/agent | Codex founding CTO / lead architect |
| Status | Needs Review |
| Priority | High |
| Category | Application scaffold implementation |
| Blockers | None |
| Next step | Review scaffold, then begin Milestone 2 domain/database contracts |
| Related docs/files | `docs/superpowers/plans/2026-05-28-milestone-1-scaffold.md`, `package.json`, `apps/api`, `apps/web`, `packages/` |
| Validation required | Completed: typecheck, lint, format check, unit tests, build, hook tests, status JSON parse |
```

Set the `M1-001` object in `docs/status/work-items.json` to:

```json
{
  "id": "M1-001",
  "title": "Begin main application scaffold",
  "phase": "Milestone 1",
  "owner": "Architect Agent, Data Engineering Agent, UI/UX Agent",
  "status": "Needs Review",
  "priority": "High",
  "category": "Application implementation",
  "blockers": [],
  "nextStep": "Review scaffold, then begin Milestone 2 domain/database contracts.",
  "relatedDocs": [
    "docs/implementation-plan.md",
    "docs/product-roadmap.md",
    "docs/superpowers/specs/2026-05-28-milestone-1-scaffold-design.md",
    "docs/superpowers/plans/2026-05-28-milestone-1-scaffold.md",
    "package.json",
    "apps/api",
    "apps/web",
    "packages/"
  ],
  "validationRequired": [
    "Stack decision",
    "Scaffold validation commands",
    "Type check",
    "Lint",
    "Unit tests",
    "Build"
  ]
}
```

Add validation rows to `docs/status/validation-status.md`:

```markdown
| Milestone 1 typecheck | Completed | TypeScript project references passed | `npm.cmd run typecheck` |
| Milestone 1 unit tests | Completed | Core, API, and web tests passed | `npm.cmd run test` |
| Milestone 1 lint | Completed | ESLint passed for workspace TS/TSX files | `npm.cmd run lint` |
| Milestone 1 format check | Completed | Prettier check passed for scaffold code/config files | `npm.cmd run format:check` |
| Milestone 1 build | Completed | API, web, and package builds passed | `npm.cmd run build` |
| Milestone 1 hook regression | Completed | Codex hook tests still passed | `python -m unittest discover .codex/hooks/tests` |
| Milestone 1 status JSON parse | Completed | `docs/status/work-items.json` parsed successfully | `python -m json.tool docs/status/work-items.json` |
```

- [ ] **Step 3: Final secret and safety scan**

Run:

```powershell
rg -n "\bsk-[A-Za-z0-9_-]{20,}|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9_]{20,}\b|\bxox[baprs]-[A-Za-z0-9-]{20,}\b|-----BEGIN (RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----" AGENTS.md .env.example .codex .agents apps packages docs -g "!**/__pycache__/**" -g "!**/*.pyc" -g "!node_modules/**"
rg -n "(?i)\b(live[_ -]?trading[_ -]?enabled\s*[:=]\s*true|place_order|submit_order|create_order|/orders)\b" AGENTS.md .env.example .codex .agents apps packages docs -g "!**/__pycache__/**" -g "!**/*.pyc" -g "!node_modules/**"
```

Expected: no real secret matches and no live order path matches except hook policy/test guardrail text.

- [ ] **Step 4: Commit validation/status updates**

Run:

```powershell
git add docs/status/current-work.md docs/status/work-items.json docs/status/validation-status.md
git commit -m "docs: update scaffold validation status"
```

## Self-Review

- Spec coverage: The plan covers root tooling, core contracts, API health/env safety, web shell, package stubs, validation, and status docs.
- Unfinished-marker scan: The plan avoids unspecified implementation markers and includes exact code for every new file.
- Type consistency: Package names, script names, enums, and recommendation field names are consistent across tasks.
- Safety check: The plan adds no live trading, broker order placement, margin assumptions, naked options selling, crypto execution, or recommendation generation.
