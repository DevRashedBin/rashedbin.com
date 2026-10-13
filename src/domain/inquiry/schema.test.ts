import { describe, expect, it } from "vitest";
import { inquirySchema, normaliseWebsiteUrl, validateStep } from "./schema";

const valid = {
  service: "website-redesign",
  websiteUrl: "example.com",
  platform: "wordpress",
  description: "Our site is slow and looks dated. We want a modern redesign.",
  currency: "GBP",
  budget: "b3",
  timeline: "1-3-months",
  name: "Jane Doe",
  email: "  Jane@Example.COM ",
  company: "",
  consent: true,
};

describe("normaliseWebsiteUrl", () => {
  it("adds https to bare domains", () => {
    expect(normaliseWebsiteUrl("example.com")).toBe("https://example.com/");
    expect(normaliseWebsiteUrl("www.example.co.uk/about")).toBe("https://www.example.co.uk/about");
  });
  it("keeps explicit http(s) URLs", () => {
    expect(normaliseWebsiteUrl("http://example.com")).toBe("http://example.com/");
  });
  it.each([
    "",
    "not a url",
    "localhost",
    "javascript:alert(1)",
    "ftp://example.com",
    "https://user:pw@example.com",
  ])("rejects %j", (input) => {
    expect(normaliseWebsiteUrl(input)).toBeNull();
  });
});

describe("inquirySchema", () => {
  it("accepts a complete inquiry and normalises fields", () => {
    const result = inquirySchema.parse(valid);
    expect(result.email).toBe("jane@example.com");
    expect(result.websiteUrl).toBe("https://example.com/");
    expect(result.company).toBeUndefined();
  });

  it("requires consent", () => {
    const result = inquirySchema.safeParse({ ...valid, consent: false });
    expect(result.success).toBe(false);
  });

  it("requires a website URL for services about an existing site", () => {
    const result = inquirySchema.safeParse({ ...valid, websiteUrl: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["websiteUrl"]);
  });

  it("does not require a URL for a new website", () => {
    const result = inquirySchema.safeParse({
      ...valid,
      service: "website-design-development",
      websiteUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("requires urgency for bug fixes", () => {
    const missing = inquirySchema.safeParse({ ...valid, service: "website-bug-fixes" });
    expect(missing.success).toBe(false);
    const ok = inquirySchema.safeParse({
      ...valid,
      service: "website-bug-fixes",
      urgency: "site-down",
    });
    expect(ok.success).toBe(true);
  });

  it("requires store stage for WooCommerce", () => {
    const result = inquirySchema.safeParse({
      ...valid,
      service: "woocommerce-development",
      websiteUrl: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown services, currencies and budgets", () => {
    expect(inquirySchema.safeParse({ ...valid, service: "seo-guaranteed" }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, currency: "JPY" }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, budget: "b9" }).success).toBe(false);
  });

  it("rejects invalid email and over-long description", () => {
    expect(inquirySchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, description: "x".repeat(5001) }).success).toBe(
      false,
    );
  });
});

describe("validateStep", () => {
  it("validates only the fields of the current step", () => {
    expect(validateStep("service", { service: "technical-seo" })).toEqual({});
    expect(validateStep("service", {})).toHaveProperty("service");
    expect(validateStep("contact", { name: "A" })).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      consent: expect.any(String),
    });
  });

  it("applies service-dependent rules on the details step", () => {
    const errors = validateStep("details", { service: "website-bug-fixes", description: "short" });
    expect(Object.keys(errors).sort()).toEqual(["description", "urgency", "websiteUrl"]);
  });
});
