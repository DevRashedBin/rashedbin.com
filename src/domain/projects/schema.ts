import { z } from "zod";
import { CURRENCY_CODES, parseMoneyInput } from "@/domain/money/money";

const isoDate = z
  .string()
  .default("")
  .transform((v) => v.trim())
  .refine(
    (v) =>
      v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`))),
    "Use a valid date.",
  )
  .transform((v) => (v === "" ? null : v));

// Missing fields (not on a given form) are treated the same as empty ones.
const optionalText = (max: number) =>
  z
    .string()
    .default("")
    .transform((v) => v.trim())
    .pipe(z.string().max(max, `Keep this under ${max} characters.`))
    .transform((v) => (v === "" ? null : v));

export const projectDetailsSchema = z
  .object({
    title: z.string().trim().min(1, "Give the project a title.").max(200),
    description: optionalText(5000),
    serviceSlug: optionalText(80),
    currency: z.enum(CURRENCY_CODES),
    value: z
      .string()
      .trim()
      .transform((v, ctx) => {
        if (v === "") return null;
        const minor = parseMoneyInput(v);
        if (minor === null) {
          ctx.addIssue({ code: "custom", message: "Enter an amount like 1500 or 1,500.00." });
          return z.NEVER;
        }
        return minor;
      }),
    startDate: isoDate,
    targetDate: isoDate,
  })
  .superRefine((d, ctx) => {
    if (d.startDate && d.targetDate && d.targetDate < d.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["targetDate"],
        message: "The target date can't be before the start date.",
      });
    }
  });

export const newProjectSchema = projectDetailsSchema.and(
  z.object({
    clientId: z.uuid({ error: "Choose a client." }),
    statusKey: z.string().regex(/^[a-z0-9_]{1,40}$/),
  }),
);

export const milestoneSchema = z.object({
  title: z.string().trim().min(1, "Name the milestone.").max(200),
  description: optionalText(2000),
  dueDate: isoDate,
  clientVisible: z.boolean(),
});

export const projectUpdateSchema = z.object({
  title: optionalText(200),
  body: z.string().trim().min(1, "Write the update.").max(10000),
  notify: z.boolean(),
  idempotencyKey: z.uuid(),
});

/** Today's date (UTC) as YYYY-MM-DD, for deadline comparisons. */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isOverdue(dueDate: string | null, done: boolean, today: string): boolean {
  return Boolean(dueDate) && !done && dueDate! < today;
}

/** Share of milestones completed, as a whole percentage. Null when there are none. */
export function milestoneProgress(milestones: { completed_at: string | null }[]): number | null {
  if (!milestones.length) return null;
  const done = milestones.filter((m) => m.completed_at).length;
  return Math.round((done / milestones.length) * 100);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type Deadline = { key: string; date: string; label: string; href: string; overdue: boolean };

/**
 * Upcoming and overdue deadlines for the overview: target dates of active
 * projects and due dates of open milestones within `days` from today.
 */
export function upcomingDeadlines(
  projects: { id: string; title: string; target_date: string | null; active: boolean }[],
  milestones: {
    id: string;
    title: string;
    due_date: string;
    project: { id: string; title: string } | null;
  }[],
  days = 14,
  now = new Date(),
): Deadline[] {
  const today = todayIso(now);
  const horizon = todayIso(new Date(now.getTime() + days * 86_400_000));
  return [
    ...projects
      .filter((p) => p.active && p.target_date && p.target_date <= horizon)
      .map((p) => ({
        key: `p-${p.id}`,
        date: p.target_date!,
        label: `${p.title} — target completion`,
        href: `/admin/projects/${p.id}`,
      })),
    ...milestones
      .filter((m) => m.due_date <= horizon && m.project)
      .map((m) => ({
        key: `m-${m.id}`,
        date: m.due_date,
        label: `${m.title} · ${m.project!.title}`,
        href: `/admin/projects/${m.project!.id}`,
      })),
  ]
    .map((d) => ({ ...d, overdue: d.date < today }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
