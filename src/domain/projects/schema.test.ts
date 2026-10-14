import { describe, expect, it } from "vitest";
import {
  formatDate,
  isOverdue,
  milestoneProgress,
  newProjectSchema,
  projectUpdateSchema,
  todayIso,
} from "./schema";

const base = {
  clientId: crypto.randomUUID(),
  statusKey: "in_progress",
  title: "Website redesign",
  description: "",
  serviceSlug: "website-redesign",
  currency: "GBP",
  value: "2,000.00",
  startDate: "2026-11-01",
  targetDate: "2026-12-15",
};

describe("project schema", () => {
  it("parses money exactly into minor units", () => {
    const p = newProjectSchema.parse(base);
    expect(p.value).toBe(200000);
    expect(p.description).toBeNull();
  });

  it("allows no value and no dates", () => {
    const p = newProjectSchema.parse({ ...base, value: "", startDate: "", targetDate: "" });
    expect(p).toMatchObject({ value: null, startDate: null, targetDate: null });
  });

  it("rejects bad amounts, bad dates and backwards date ranges", () => {
    expect(newProjectSchema.safeParse({ ...base, value: "-5" }).success).toBe(false);
    expect(newProjectSchema.safeParse({ ...base, value: "12.345" }).success).toBe(false);
    expect(newProjectSchema.safeParse({ ...base, startDate: "2026-13-01" }).success).toBe(false);
    expect(newProjectSchema.safeParse({ ...base, targetDate: "2026-10-01" }).success).toBe(false);
    expect(newProjectSchema.safeParse({ ...base, currency: "JPY" }).success).toBe(false);
  });

  it("requires an update body and an idempotency key", () => {
    expect(
      projectUpdateSchema.safeParse({
        title: "",
        body: " ",
        notify: true,
        idempotencyKey: crypto.randomUUID(),
      }).success,
    ).toBe(false);
    expect(
      projectUpdateSchema.safeParse({ title: "", body: "Done", notify: false, idempotencyKey: "x" })
        .success,
    ).toBe(false);
  });
});

describe("deadlines and progress", () => {
  it("flags only past, unfinished items as overdue", () => {
    expect(isOverdue("2026-10-01", false, "2026-10-16")).toBe(true);
    expect(isOverdue("2026-10-16", false, "2026-10-16")).toBe(false);
    expect(isOverdue("2026-10-01", true, "2026-10-16")).toBe(false);
    expect(isOverdue(null, false, "2026-10-16")).toBe(false);
    expect(todayIso(new Date("2026-10-16T23:30:00Z"))).toBe("2026-10-16");
  });

  it("computes milestone progress", () => {
    expect(milestoneProgress([])).toBeNull();
    expect(
      milestoneProgress([{ completed_at: "x" }, { completed_at: null }, { completed_at: null }]),
    ).toBe(33);
    expect(milestoneProgress([{ completed_at: "x" }])).toBe(100);
  });

  it("formats dates without timezone drift", () => {
    expect(formatDate("2026-01-05")).toBe("5 Jan 2026");
    expect(formatDate(null)).toBe("—");
  });
});

describe("upcomingDeadlines", () => {
  it("lists overdue and soon-due items in date order, ignoring finished projects", async () => {
    const { upcomingDeadlines } = await import("./schema");
    const now = new Date("2026-10-16T12:00:00Z");
    const out = upcomingDeadlines(
      [
        { id: "p1", title: "Late site", target_date: "2026-10-10", active: true },
        { id: "p2", title: "Done site", target_date: "2026-10-12", active: false },
        { id: "p3", title: "Far site", target_date: "2026-12-01", active: true },
      ],
      [
        {
          id: "m1",
          title: "Wireframes",
          due_date: "2026-10-20",
          project: { id: "p3", title: "Far site" },
        },
      ],
      14,
      now,
    );
    expect(out.map((d) => [d.key, d.overdue])).toEqual([
      ["p-p1", true],
      ["m-m1", false],
    ]);
  });
});

describe("milestone schema", () => {
  it("accepts a form without description or due date fields", async () => {
    const { milestoneSchema } = await import("./schema");
    const m = milestoneSchema.parse({ title: "Design approved", clientVisible: true });
    expect(m).toMatchObject({ title: "Design approved", description: null, dueDate: null });
  });
});
