import { describe, expect, it } from "vitest";
import {
  ProviderNotConfiguredError,
  createFinancialModelingPrepProvider,
  createFinnhubProvider,
  createPolygonProvider,
} from "../src/index.js";

describe("provider adapter stubs", () => {
  it("exposes first-candidate provider metadata without broker execution methods", () => {
    const providers = [
      createPolygonProvider({}),
      createFinancialModelingPrepProvider({}),
      createFinnhubProvider({}),
    ];

    expect(providers.map((provider) => provider.providerName)).toEqual([
      "polygon",
      "financial-modeling-prep",
      "finnhub",
    ]);
    for (const provider of providers) {
      expect(provider.adapterVersion).toMatch(/^stub-v/);
      expect(
        Object.keys(provider).filter((key) => /order|trade|position|account|broker/i.test(key)),
      ).toEqual([]);
    }
  });

  it("rejects provider calls when required API keys are not configured", async () => {
    const polygon = createPolygonProvider({});
    const fmp = createFinancialModelingPrepProvider({});
    const finnhub = createFinnhubProvider({});

    await expect(
      polygon.getPriceBars({
        symbol: "MSFT",
        from: "2026-05-01",
        to: "2026-05-02",
        interval: "1d",
      }),
    ).rejects.toThrow(ProviderNotConfiguredError);
    await expect(fmp.getNewsArticles({ symbols: ["MSFT"] })).rejects.toThrow(
      ProviderNotConfiguredError,
    );
    await expect(finnhub.getEarningsEvents({ symbols: ["MSFT"] })).rejects.toThrow(
      ProviderNotConfiguredError,
    );
  });

  it("keeps configured HTTP adapters deferred until provider terms are reviewed", async () => {
    const polygon = createPolygonProvider({ apiKey: "local-placeholder-key" });

    await expect(
      polygon.getOptionQuotes({ underlyingSymbol: "MSFT", expiration: "2026-06-19" }),
    ).rejects.toThrow(/deferred until provider terms are reviewed/i);
  });
});
