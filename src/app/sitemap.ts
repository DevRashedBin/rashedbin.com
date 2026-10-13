import type { MetadataRoute } from "next";
import { getServices } from "@/content/services";
import { absoluteUrl } from "@/content/site";
import { getCaseStudies } from "@/content/work";

/** Public, indexable pages only. Private areas are never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/services"), changeFrequency: "monthly", priority: 0.9 },
    ...getServices().map((s) => ({
      url: absoluteUrl(`/services/${s.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getCaseStudies().map((c) => ({
      url: absoluteUrl(`/work/${c.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/start-a-project"), changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];
  return pages;
}
