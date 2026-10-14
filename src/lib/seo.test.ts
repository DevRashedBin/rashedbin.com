import { describe, expect, it } from "vitest";
import type { Service } from "@/domain/content/service";
import { breadcrumbJsonLd, faqJsonLd, serializeJsonLd, serviceJsonLd, siteJsonLd } from "./seo";

describe("structured data", () => {
  it("escapes < so JSON-LD cannot close the script tag", () => {
    const out = serializeJsonLd({ text: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).text).toBe("</script><script>alert(1)</script>");
  });

  it("does not include unconfirmed contact details or profiles", () => {
    const graph = JSON.stringify(siteJsonLd());
    expect(graph).not.toContain('"email"');
    expect(graph).not.toContain('"address"');
    expect(graph).not.toContain('"aggregateRating"');
  });

  it("builds absolute URLs for breadcrumbs and services", () => {
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]);
    expect(crumbs.itemListElement[1].item).toMatch(/^https:\/\/.+\/services$/);
    const svc = serviceJsonLd({
      slug: "technical-seo",
      name: "Technical SEO",
      metaDescription: "d",
    } as Service);
    expect(svc.url).toMatch(/^https:\/\//);
  });

  it("maps FAQs to Question/Answer pairs", () => {
    const ld = faqJsonLd([{ question: "Q?", answer: "A." }]);
    expect(ld.mainEntity[0]).toMatchObject({ "@type": "Question", name: "Q?" });
  });
});
