import { describe, expect, it } from "vitest";
import { formatMoney, minorToInput, parseMoneyInput } from "./money";

describe("money", () => {
  it.each([
    ["1234", 123400],
    ["1,234.56", 123456],
    ["0.1", 10],
    ["0.07", 7],
    ["200", 20000],
    [" 19.99 ", 1999],
  ])("parses %j exactly", (input, minor) => {
    expect(parseMoneyInput(input)).toBe(minor);
  });

  it("avoids floating-point errors that naive parsing would introduce", () => {
    // parseFloat("0.29") * 100 === 28.999999999999996
    expect(parseMoneyInput("0.29")).toBe(29);
    expect(parseMoneyInput("4.35")).toBe(435);
  });

  it.each(["", "-5", "1.234", "abc", "1e5", "12.", ".5", "99999999999"])("rejects %j", (input) => {
    expect(parseMoneyInput(input)).toBeNull();
  });

  it("formats with the currency code and grouping", () => {
    expect(formatMoney(123456, "GBP")).toBe("GBP 1,234.56");
    expect(formatMoney(5, "USD")).toBe("USD 0.05");
    expect(formatMoney(15000000, "BDT")).toBe("BDT 150,000.00");
    expect(formatMoney(-2500, "EUR")).toBe("-EUR 25.00");
    expect(() => formatMoney(1.5, "USD")).toThrow();
  });

  it("round-trips through the edit form", () => {
    for (const minor of [0, 7, 1999, 123456])
      expect(parseMoneyInput(minorToInput(minor))).toBe(minor);
    expect(minorToInput(null)).toBe("");
  });
});
