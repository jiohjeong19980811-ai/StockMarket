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
