/**
 * Business identity used across metadata, structured data and the UI.
 *
 * Only facts confirmed by the business owner belong here. Optional fields are
 * left empty until confirmed and are omitted from the page and from
 * structured data while empty.
 */
export const site = {
  brand: "Rashed",
  personName: "Rashedul Islam",
  legalName: "Rashedul Islam",
  domain: "rashedbin.com",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rashedbin.com").replace(/\/$/, ""),
  title: "Rashed — Website Design, Development & Optimisation",
  description:
    "Independent website designer and developer. I design, build, fix and optimise business websites for clients in the UK, US, Europe and Bangladesh.",
  jobTitle: "Website Designer & Developer",
  /** Markets served — used for `areaServed` in structured data. */
  areaServed: ["Bangladesh", "United Kingdom", "United States", "European Union"],
  /** Public contact email (confirmed by the business owner). */
  contactEmail: "hello@rashedbin.com",
  /** Verified profile URLs (LinkedIn, GitHub, etc.). Empty until provided. */
  sameAs: [] as string[],
  /** Version of the privacy notice that consent records reference. */
  privacyNoticeVersion: "2026-10-15",
  /** Version of the terms of service. */
  termsVersion: "2026-10-13",
} as const;

export const indexingAllowed = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export function absoluteUrl(path = "/"): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
