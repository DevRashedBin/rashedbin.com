import { describe, expect, it } from "vitest";
import { budgetLabel, describeDetails, followUpSchema, unresolvedPlaceholders } from "./format";

describe("lead formatting", () => {
  it("formats budgets in the chosen currency without conversion", () => {
    expect(budgetLabel({ currency: "BDT", budget: "b2" })).toBe("BDT 50,000 – 150,000");
    expect(budgetLabel({ currency: "GBP", budget: "b3" })).toBe("GBP 1,500 – 3,000");
    expect(budgetLabel({ budget: "not-sure" })).toBe("Not sure yet");
  });

  it("describes only the answers that were given", () => {
    expect(describeDetails({ timeline: "asap", urgency: "site-down" })).toEqual([
      { label: "Timeline", value: "As soon as possible" },
      { label: "Urgency", value: "Site is down or unusable" },
    ]);
    expect(describeDetails(null)).toEqual([]);
  });

  it("finds unresolved placeholders", () => {
    expect(unresolvedPlaceholders("Hi {{first_name}}, see {{ consultation_link }}")).toEqual([
      "first_name",
      "consultation_link",
    ]);
  });

  it("validates follow-up messages", () => {
    const base = {
      leadId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      subject: "Hi",
      body: "Hello",
    };
    expect(followUpSchema.safeParse(base).success).toBe(true);
    expect(followUpSchema.safeParse({ ...base, body: "  " }).success).toBe(false);
    expect(followUpSchema.safeParse({ ...base, idempotencyKey: "x" }).success).toBe(false);
  });
});
