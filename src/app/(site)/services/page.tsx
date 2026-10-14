import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Section } from "@/components/ui/container";
import { FaqList } from "@/components/ui/faq-list";
import { ArrowUpRight } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionLabel } from "@/components/ui/section-label";
import { getGeneralFaqs, getServices } from "@/server/content";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Website Services: Design, Development, SEO & Maintenance",
  description:
    "Website design and development, redesigns, WordPress and Elementor, bug fixes, technical SEO, security, performance and WooCommerce — for businesses worldwide.",
  path: "/services",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
];

export default async function ServicesPage() {
  const [services, generalFaqs] = await Promise.all([getServices(), getGeneralFaqs()]);
  return (
    <>
      <section className="pt-10 pb-12 sm:pt-14 lg:pb-16">
        <Container>
          <Breadcrumbs items={crumbs} />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <h1 className="text-display font-medium">
              Services for websites that need to <em className="accent">work</em>.
            </h1>
            <p className="text-lg leading-relaxed text-graphite">
              From new builds to urgent fixes. Choose a service to see what&rsquo;s included, how I
              work and common questions.
            </p>
          </div>
        </Container>
      </section>

      <section className="pb-16 lg:pb-24">
        <Container>
          <ol className="border-t border-ink/15">
            {services.map((s, i) => (
              <li key={s.slug} className="reveal border-b border-ink/15">
                <Link
                  href={`/services/${s.slug}`}
                  className="group grid gap-3 py-7 transition-colors sm:grid-cols-[4rem_1.2fr_1.6fr_auto] sm:items-center sm:gap-8 sm:py-9"
                >
                  <span className="font-mono text-xs text-stone">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">{s.shortName}</h2>
                  <p className="text-graphite">{s.summary}</p>
                  <span className="hidden size-12 place-items-center rounded-full border border-ink/15 transition-colors duration-200 group-hover:bg-ink group-hover:text-paper sm:grid">
                    <ArrowUpRight className="size-5" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Section tone="white" aria-labelledby="faq-heading">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <SectionLabel>Questions</SectionLabel>
            <h2 id="faq-heading" className="mt-5 text-headline font-medium">
              Common questions
            </h2>
          </div>
          <FaqList faqs={generalFaqs} />
        </Container>
      </Section>

      <CtaBand
        title="Not sure which service you need?"
        body="Describe the problem or goal in your own words. I'll recommend the right starting point."
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(generalFaqs)} />
    </>
  );
}
