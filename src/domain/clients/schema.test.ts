import { describe, expect, it } from "vitest";
import { clientSchema, clientToRow } from "./schema";

const base = {
  displayName: "Acme Ltd",
  companyName: "",
  contactName: "",
  billingEmail: " Accounts@Acme.Example ",
  phone: "",
  websiteUrl: "acme.example",
  billingAddress: "",
  countryCode: "gb",
  taxId: "",
  defaultCurrency: "GBP",
};

describe("clientSchema", () => {
  it("normalises email, country and empty optionals", () => {
    const c = clientSchema.parse(base);
    expect(c.billingEmail).toBe("accounts@acme.example");
    expect(c.countryCode).toBe("GB");
    expect(c.companyName).toBeNull();
    expect(clientToRow(c).website_url).toBe("https://acme.example/");
  });

  it("rejects invalid email, country code and currency", () => {
    expect(clientSchema.safeParse({ ...base, billingEmail: "nope" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...base, countryCode: "GBR" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...base, defaultCurrency: "JPY" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...base, displayName: " " }).success).toBe(false);
  });
});
