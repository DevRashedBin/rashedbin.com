import { z } from "zod";

/**
 * Inquiry ("Start a project") validation, shared by the browser form and the
 * server action. Pure module: no I/O, safe to import anywhere.
 */

/**
 * Services come from the database (published services) plus "not-sure". The
 * schema checks the shape of the value; the server checks it is a published
 * service. Slugs below drive service-specific questions in the form.
 */
export type InquiryService = string;

export const NOT_SURE = "not-sure";

export type ServiceOption = { value: string; label: string };

/** Services where an existing website is the subject of the work. */
export const SERVICES_REQUIRING_URL: readonly string[] = [
  "website-redesign",
  "website-bug-fixes",
  "technical-seo",
  "website-security-maintenance",
  "website-performance-optimisation",
];

export const PLATFORM_OPTIONS = [
  { value: "wordpress", label: "WordPress" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "shopify", label: "Shopify" },
  { value: "custom", label: "Custom-built" },
  { value: "other", label: "Something else" },
  { value: "not-sure", label: "Not sure" },
] as const;

export const URGENCY_OPTIONS = [
  { value: "site-down", label: "Site is down or unusable" },
  { value: "feature-broken", label: "A feature is broken (forms, checkout…)" },
  { value: "minor", label: "Minor issue, not urgent" },
] as const;

export const STORE_STAGE_OPTIONS = [
  { value: "new", label: "New store" },
  { value: "existing", label: "Improve an existing store" },
  { value: "migrating", label: "Moving from another platform" },
] as const;

export const CURRENCIES = ["USD", "GBP", "EUR", "BDT"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const BUDGET_BANDS = ["b1", "b2", "b3", "b4", "b5", "not-sure"] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number];

const westernBudgets: Record<Exclude<BudgetBand, "not-sure">, string> = {
  b1: "Under 500",
  b2: "500 – 1,500",
  b3: "1,500 – 3,000",
  b4: "3,000 – 6,000",
  b5: "6,000+",
};

/** Budget labels per currency. Bands are indicative and never converted between currencies. */
export const BUDGET_LABELS: Record<Currency, Record<Exclude<BudgetBand, "not-sure">, string>> = {
  USD: westernBudgets,
  GBP: westernBudgets,
  EUR: westernBudgets,
  BDT: {
    b1: "Under 50,000",
    b2: "50,000 – 150,000",
    b3: "150,000 – 300,000",
    b4: "300,000 – 600,000",
    b5: "600,000+",
  },
};

export const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-month", label: "Within a month" },
  { value: "1-3-months", label: "1–3 months" },
  { value: "flexible", label: "Flexible" },
] as const;

/**
 * Accepts "example.com", "www.example.com/page" or a full URL; returns a
 * normalised https URL, or null if it is not a plausible public web address.
 */
export function normaliseWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));

// ── Step schemas ─────────────────────────────────────────────────────────────

export const serviceStep = z.object({
  service: z
    .string({ error: "Choose the option closest to what you need." })
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Choose the option closest to what you need.")
    .max(80),
});

const detailsBase = z.object({
  websiteUrl: optionalText(300),
  platform: z.enum(PLATFORM_OPTIONS.map((o) => o.value) as [string, ...string[]]).optional(),
  urgency: z.enum(URGENCY_OPTIONS.map((o) => o.value) as [string, ...string[]]).optional(),
  storeStage: z.enum(STORE_STAGE_OPTIONS.map((o) => o.value) as [string, ...string[]]).optional(),
  description: z
    .string({ error: "Tell me a little about the project." })
    .trim()
    .min(20, "Please add a little more detail (at least 20 characters).")
    .max(5000, "Please keep this under 5,000 characters."),
});

export const scopeStep = z.object({
  currency: z.enum(CURRENCIES, { error: "Choose a currency." }),
  budget: z.enum(BUDGET_BANDS, { error: "Choose a budget range, or “Not sure yet”." }),
  timeline: z.enum(TIMELINE_OPTIONS.map((o) => o.value) as [string, ...string[]], {
    error: "Choose a timeline.",
  }),
});

export const contactStep = z.object({
  name: z
    .string({ error: "Please enter your name." })
    .trim()
    .min(2, "Please enter your name.")
    .max(120, "Please keep your name under 120 characters."),
  email: z
    .string({ error: "Please enter your email address." })
    .trim()
    .toLowerCase()
    .max(254, "That email address is too long.")
    .pipe(z.email({ error: "Please enter a valid email address." })),
  company: optionalText(160),
  consent: z.literal(true, {
    error: "Please confirm I can contact you about this enquiry.",
  }),
});

type DetailsShape = { service: InquiryService } & z.infer<typeof detailsBase>;

/** Rules that depend on the selected service. */
function checkDetails(data: DetailsShape, ctx: z.RefinementCtx) {
  const needsUrl = SERVICES_REQUIRING_URL.includes(data.service);
  if (data.websiteUrl) {
    if (!normaliseWebsiteUrl(data.websiteUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["websiteUrl"],
        message: "Please enter a valid website address, e.g. example.com.",
      });
    }
  } else if (needsUrl) {
    ctx.addIssue({
      code: "custom",
      path: ["websiteUrl"],
      message: "Please enter the address of the website involved.",
    });
  }
  if (data.service === "website-bug-fixes" && !data.urgency) {
    ctx.addIssue({ code: "custom", path: ["urgency"], message: "Let me know how urgent this is." });
  }
  if (data.service === "woocommerce-development" && !data.storeStage) {
    ctx.addIssue({
      code: "custom",
      path: ["storeStage"],
      message: "Choose the option that fits your store.",
    });
  }
}

export const detailsStep = serviceStep.extend(detailsBase.shape).superRefine(checkDetails);

/** The complete submission as validated on the server. */
export const inquirySchema = serviceStep
  .extend(detailsBase.shape)
  .extend(scopeStep.shape)
  .extend(contactStep.shape)
  .superRefine(checkDetails)
  .transform((data) => ({
    ...data,
    websiteUrl: data.websiteUrl ? (normaliseWebsiteUrl(data.websiteUrl) ?? undefined) : undefined,
  }));

export type InquiryInput = z.input<typeof inquirySchema>;
export type Inquiry = z.output<typeof inquirySchema>;

export const INQUIRY_STEPS = ["service", "details", "scope", "contact"] as const;
export type InquiryStep = (typeof INQUIRY_STEPS)[number];

const stepSchemas: Record<InquiryStep, z.ZodType> = {
  service: serviceStep,
  details: detailsStep,
  scope: scopeStep,
  contact: contactStep,
};

export type FieldErrors = Partial<Record<string, string>>;

/** First error message per field, keyed by top-level field name. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    out[key] ??= issue.message;
  }
  return out;
}

/**
 * Saving an unfinished enquiry: only name, email and explicit consent are
 * required; everything else is whatever the visitor has filled in so far.
 */
export const draftSchema = z.object({
  name: contactStep.shape.name,
  email: contactStep.shape.email,
  consent: z.literal(true, {
    error: "Please confirm you'd like me to store your answers and email you a link.",
  }),
  service: z.string().trim().max(80).optional(),
  websiteUrl: optionalText(300),
  platform: z.string().max(40).optional(),
  urgency: z.string().max(40).optional(),
  storeStage: z.string().max(40).optional(),
  description: optionalText(5000),
  currency: z.enum(CURRENCIES).optional(),
  budget: z.enum(BUDGET_BANDS).optional(),
  timeline: z.string().max(40).optional(),
  company: optionalText(160),
});
export type InquiryDraft = z.output<typeof draftSchema>;

/** Validate a single step of the multi-step form. */
export function validateStep(step: InquiryStep, data: Record<string, unknown>): FieldErrors {
  const result = stepSchemas[step].safeParse(data);
  return result.success ? {} : toFieldErrors(result.error);
}
