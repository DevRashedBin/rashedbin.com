import { z } from "zod";
import { CURRENCIES } from "@/domain/inquiry/schema";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .transform((v) => (v === "" ? null : v));

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(1, "Enter a business name.").max(200),
  legalName: optional(200),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address.")
    .transform((v) => (v === "" ? null : v)),
  notificationEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address.")
    .transform((v) => (v === "" ? null : v)),
  consultationUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https:\/\/[^\s]+\.[^\s]+$/.test(v), "Use a full https:// link.")
    .transform((v) => (v === "" ? null : v)),
  phone: optional(50),
  address: optional(1000),
  website: optional(300),
  taxId: optional(100),
  defaultCurrency: z.enum(CURRENCIES),
  invoicePrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,10}$/, "1–10 letters or digits."),
  projectPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,10}$/, "1–10 letters or digits."),
  numberPadding: z.coerce.number().int().min(3, "Between 3 and 8.").max(8, "Between 3 and 8."),
  defaultPaymentTermsDays: z.coerce.number().int().min(0, "0–365 days.").max(365, "0–365 days."),
  invoiceFooter: optional(2000),
  defaultTerms: optional(5000),
});

export type BusinessSettings = z.infer<typeof businessSettingsSchema>;

/** Preview of an invoice number with the configured format, e.g. INV-2026-0001. */
export function formatBusinessNumber(
  prefix: string,
  year: number,
  value: number,
  padding: number,
): string {
  return `${prefix}-${year}-${String(value).padStart(padding, "0")}`;
}
