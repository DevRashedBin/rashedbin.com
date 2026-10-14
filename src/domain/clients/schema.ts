import { z } from "zod";
import { CURRENCIES, normaliseWebsiteUrl } from "@/domain/inquiry/schema";

const optional = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((v) => (v === "" ? null : v));

export const clientSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a name for this client.").max(200),
  companyName: optional(200, "Company name"),
  contactName: optional(200, "Contact name"),
  billingEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email({ error: "Enter a valid billing email address." })),
  phone: optional(50, "Phone"),
  websiteUrl: optional(300, "Website").refine(
    (v) => v === null || normaliseWebsiteUrl(v) !== null,
    {
      message: "Enter a valid website address.",
    },
  ),
  billingAddress: optional(1000, "Billing address"),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[A-Z]{2}$/.test(v), "Use a two-letter country code, e.g. GB.")
    .transform((v) => (v === "" ? null : v)),
  taxId: optional(100, "Tax ID"),
  defaultCurrency: z.enum(CURRENCIES),
});

export type ClientInput = z.infer<typeof clientSchema>;

export function clientToRow(c: ClientInput) {
  return {
    display_name: c.displayName,
    company_name: c.companyName,
    contact_name: c.contactName,
    billing_email: c.billingEmail,
    phone: c.phone,
    website_url: c.websiteUrl ? normaliseWebsiteUrl(c.websiteUrl) : null,
    billing_address: c.billingAddress,
    country_code: c.countryCode,
    tax_id: c.taxId,
    default_currency: c.defaultCurrency,
  };
}

export function clientFormData(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "");
  return {
    displayName: get("displayName"),
    companyName: get("companyName"),
    contactName: get("contactName"),
    billingEmail: get("billingEmail"),
    phone: get("phone"),
    websiteUrl: get("websiteUrl"),
    billingAddress: get("billingAddress"),
    countryCode: get("countryCode"),
    taxId: get("taxId"),
    defaultCurrency: get("defaultCurrency"),
  };
}
