import type { MetadataRoute } from "next";
import { absoluteUrl, indexingAllowed } from "@/content/site";

/**
 * robots.txt is crawler guidance, not access control: private areas are
 * protected by authentication and also send `X-Robots-Tag: noindex`.
 */
export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portal", "/login", "/auth", "/api"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
