import type { Metadata } from "next";
import { absoluteUrl, site } from "@/content/site";
import type { Faq, Service } from "@/content/services";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** Use the title as-is instead of applying the "| Rashed" template. */
  absoluteTitle?: boolean;
};

/** Per-page metadata with canonical URL and social sharing tags. */
export function pageMetadata({ title, description, path, absoluteTitle }: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: site.brand,
      title,
      description,
      locale: "en_GB",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const businessId = absoluteUrl("/#business");
const personId = absoluteUrl("/#person");
const websiteId = absoluteUrl("/#website");

/** Site-wide structured data: the business, the person behind it and the website. */
export function siteJsonLd() {
  const sameAs = site.sameAs.length ? { sameAs: site.sameAs } : {};
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": businessId,
        name: site.brand,
        alternateName: site.personName,
        url: site.url,
        description: site.description,
        founder: { "@id": personId },
        areaServed: site.areaServed.map((name) => ({ "@type": "Place", name })),
        knowsAbout: [
          "Website design",
          "Web development",
          "WordPress",
          "Elementor",
          "WooCommerce",
          "Technical SEO",
          "Core Web Vitals",
          "Website security",
        ],
        ...(site.contactEmail ? { email: site.contactEmail } : {}),
        ...sameAs,
      },
      {
        "@type": "Person",
        "@id": personId,
        name: site.personName,
        alternateName: site.brand,
        jobTitle: site.jobTitle,
        url: absoluteUrl("/about"),
        worksFor: { "@id": businessId },
        ...sameAs,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: site.url,
        name: site.brand,
        publisher: { "@id": businessId },
        inLanguage: "en",
      },
    ],
  };
}

export function serviceJsonLd(service: Service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": absoluteUrl(`/services/${service.slug}#service`),
    name: service.name,
    serviceType: service.name,
    description: service.metaDescription,
    url: absoluteUrl(`/services/${service.slug}`),
    provider: { "@id": businessId },
    areaServed: site.areaServed.map((name) => ({ "@type": "Place", name })),
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** Serialise JSON-LD safely for embedding in a <script> tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
