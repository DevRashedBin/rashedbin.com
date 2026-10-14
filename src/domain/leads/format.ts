import {
  BUDGET_LABELS,
  CURRENCIES,
  PLATFORM_OPTIONS,
  STORE_STAGE_OPTIONS,
  TIMELINE_OPTIONS,
  URGENCY_OPTIONS,
  type Currency,
} from "@/domain/inquiry/schema";
import { z } from "zod";

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const labelOf = (
  options: readonly { value: string; label: string }[],
  value: string | undefined,
) => (value ? (options.find((o) => o.value === value)?.label ?? value) : undefined);

export function budgetLabel(details: Record<string, unknown>): string {
  const currency = (CURRENCIES as readonly string[]).includes(String(details.currency))
    ? (details.currency as Currency)
    : "USD";
  const band = String(details.budget ?? "");
  if (!band || band === "not-sure") return "Not sure yet";
  const label = (BUDGET_LABELS[currency] as Record<string, string>)[band];
  return label ? `${currency} ${label}` : band;
}

/** Human-readable answers for display in the dashboard. */
export function describeDetails(details: unknown): { label: string; value: string }[] {
  const d = (details && typeof details === "object" ? details : {}) as Record<string, string>;
  return [
    { label: "Budget", value: d.budget ? budgetLabel(d) : undefined },
    { label: "Timeline", value: labelOf(TIMELINE_OPTIONS, d.timeline) },
    { label: "Platform", value: labelOf(PLATFORM_OPTIONS, d.platform) },
    { label: "Urgency", value: labelOf(URGENCY_OPTIONS, d.urgency) },
    { label: "Store", value: labelOf(STORE_STAGE_OPTIONS, d.storeStage) },
  ].filter((x): x is { label: string; value: string } => Boolean(x.value));
}

export const leadStatusSchema = z.object({
  leadId: z.uuid(),
  stage: z.string().regex(/^[a-z0-9_]{1,40}$/),
  priority: z.enum(PRIORITIES),
});

export const followUpSchema = z.object({
  leadId: z.uuid(),
  templateKey: z
    .string()
    .regex(/^[a-z0-9_]{1,60}$/)
    .optional()
    .or(z.literal("")),
  idempotencyKey: z.uuid(),
  subject: z
    .string()
    .trim()
    .min(1, "Add a subject.")
    .max(200, "Keep the subject under 200 characters."),
  body: z
    .string()
    .trim()
    .min(1, "Write a message.")
    .max(10000, "Keep the message under 10,000 characters."),
});

/** Placeholders left in a message mean a variable wasn't filled in. */
export function unresolvedPlaceholders(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map((m) => m[1]))];
}
