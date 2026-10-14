import { z } from "zod";

/**
 * Website content model. Validated on every admin save and when read from the
 * database, so a malformed row can never break a public page silently.
 */

export const SERVICE_DEMOS = [
  "blueprint",
  "before-after",
  "editable-blocks",
  "bug-trace",
  "crawl-index",
  "security-layers",
  "vitals",
  "checkout-flow",
] as const;
export type ServiceDemo = (typeof SERVICE_DEMOS)[number];

export const DEMO_LABELS: Record<ServiceDemo, string> = {
  blueprint: "Plan → wireframe → build",
  "before-after": "Before / after slider",
  "editable-blocks": "Global styles",
  "bug-trace": "Diagnose → fix → verify",
  "crawl-index": "Crawl & index check",
  "security-layers": "Layers of protection",
  vitals: "Core Web Vitals thresholds",
  "checkout-flow": "Checkout flow",
};

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

export const faqSchema = z.object({
  question: text(1, 200, "Question"),
  answer: text(1, 2000, "Answer"),
});
export type Faq = z.infer<typeof faqSchema>;

const titledItem = z.object({ title: text(1, 80, "Title"), body: text(1, 400, "Description") });

export const serviceSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.")
    .max(80),
  position: z.coerce.number().int().min(0).max(1000),
  published: z.boolean(),
  name: text(1, 120, "Name"),
  shortName: text(1, 40, "Short name"),
  summary: text(1, 200, "Summary"),
  metaTitle: text(1, 51, "Meta title"), // + " | Rashed" keeps it ≤ 60
  metaDescription: text(50, 170, "Meta description"),
  eyebrow: text(1, 80, "Eyebrow"),
  headline: text(1, 160, "Headline"),
  intro: text(1, 600, "Introduction"),
  problems: z.array(titledItem).min(1, "Add at least one problem.").max(8),
  deliverables: z
    .array(text(1, 200, "Deliverable"))
    .min(1, "Add at least one deliverable.")
    .max(12),
  approach: z.array(titledItem).min(1, "Add at least one step.").max(6),
  idealFor: z
    .array(text(1, 160, "Item"))
    .min(1, "Add at least one item.")
    .max(6),
  faqs: z.array(faqSchema).max(12),
  related: z.array(z.string()).max(3, "Choose up to three related services."),
  demo: z.enum(SERVICE_DEMOS),
  cta: z.object({
    title: text(1, 120, "CTA title"),
    body: text(1, 300, "CTA text"),
    label: text(1, 40, "Button label"),
  }),
});

export type Service = z.infer<typeof serviceSchema>;

/** Maps a database row (snake_case) to the domain shape. */
export function serviceFromRow(row: {
  slug: string;
  position: number;
  published: boolean;
  name: string;
  short_name: string;
  summary: string;
  meta_title: string;
  meta_description: string;
  eyebrow: string;
  headline: string;
  intro: string;
  problems: unknown;
  deliverables: unknown;
  approach: unknown;
  ideal_for: unknown;
  faqs: unknown;
  related: unknown;
  demo: string;
  cta: unknown;
}): Service {
  return serviceSchema.parse({
    slug: row.slug,
    position: row.position,
    published: row.published,
    name: row.name,
    shortName: row.short_name,
    summary: row.summary,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    eyebrow: row.eyebrow,
    headline: row.headline,
    intro: row.intro,
    problems: row.problems,
    deliverables: row.deliverables,
    approach: row.approach,
    idealFor: row.ideal_for,
    faqs: row.faqs,
    related: row.related,
    demo: row.demo,
    cta: row.cta,
  });
}

export function serviceToRow(s: Service) {
  return {
    slug: s.slug,
    position: s.position,
    published: s.published,
    name: s.name,
    short_name: s.shortName,
    summary: s.summary,
    meta_title: s.metaTitle,
    meta_description: s.metaDescription,
    eyebrow: s.eyebrow,
    headline: s.headline,
    intro: s.intro,
    problems: s.problems,
    deliverables: s.deliverables,
    approach: s.approach,
    ideal_for: s.idealFor,
    faqs: s.faqs,
    related: s.related,
    demo: s.demo,
    cta: s.cta,
  };
}
