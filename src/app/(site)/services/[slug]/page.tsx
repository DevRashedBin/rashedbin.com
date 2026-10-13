import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceDemo } from "@/components/graphics/service-demo";
import { CtaBand } from "@/components/site/cta-band";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { Emphasis, stripEmphasis } from "@/components/ui/emphasis";
import { FaqList } from "@/components/ui/faq-list";
import { ArrowUpRight, Check } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionLabel } from "@/components/ui/section-label";
import { getRelatedServices, getService, getServices } from "@/content/services";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, serviceJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return getServices().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return pageMetadata({
    title: service.metaTitle,
    description: service.metaDescription,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const related = getRelatedServices(service);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: service.shortName, path: `/services/${service.slug}` },
  ];
  const enquiryHref = `/start-a-project?service=${service.slug}`;

  return (
    <>
      {/* Hero */}
      <section className="pt-10 pb-14 sm:pt-14 lg:pb-20">
        <Container>
          <Breadcrumbs items={crumbs} />
          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <div className="lg:sticky lg:top-28">
              <SectionLabel>{service.eyebrow}</SectionLabel>
              <h1 className="mt-6 text-[clamp(2.4rem,1.5rem+3.4vw,4.75rem)] leading-[1] font-medium tracking-[-0.035em]">
                <Emphasis text={service.headline} />
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-graphite">{service.intro}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={enquiryHref} size="lg" arrow>
                  {service.cta.label}
                </ButtonLink>
                <ButtonLink href="#included" size="lg" variant="outline">
                  What&rsquo;s included
                </ButtonLink>
              </div>
            </div>
            <ServiceDemo demo={service.demo} />
          </div>
        </Container>
      </section>

      {/* Problems */}
      <Section tone="white" aria-labelledby="problems-heading">
        <Container>
          <SectionLabel index="01">The problem</SectionLabel>
          <h2 id="problems-heading" className="mt-5 max-w-3xl text-headline font-medium">
            Does this sound like your website?
          </h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
            {service.problems.map((p) => (
              <li key={p.title} className="reveal bg-white p-6">
                <h3 className="text-lg font-medium tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Deliverables + ideal for */}
      <Section id="included" aria-labelledby="included-heading">
        <Container className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
            <SectionLabel index="02">What&rsquo;s included</SectionLabel>
            <h2 id="included-heading" className="mt-5 text-headline font-medium">
              What you get
            </h2>
            <ul className="mt-8 border-t border-ink/10">
              {service.deliverables.map((d) => (
                <li key={d} className="reveal flex gap-4 border-b border-ink/10 py-4">
                  <Check className="mt-1 size-4 shrink-0" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="self-start rounded-[var(--radius-panel)] bg-ink p-7 text-paper sm:p-9">
            <p className="font-mono text-xs tracking-[0.14em] text-paper/55 uppercase">
              A good fit for
            </p>
            <ul className="mt-5 flex flex-col gap-4">
              {service.idealFor.map((f) => (
                <li key={f} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-paper" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <ButtonLink href={enquiryHref} variant="inverse" arrow className="mt-8">
              {service.cta.label}
            </ButtonLink>
          </aside>
        </Container>
      </Section>

      {/* Approach */}
      <Section tone="ink" aria-labelledby="approach-heading">
        <Container>
          <SectionLabel index="03">Approach</SectionLabel>
          <h2 id="approach-heading" className="mt-5 max-w-3xl text-headline font-medium">
            How I work on {stripEmphasis(service.shortName).toLowerCase()} projects
          </h2>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {service.approach.map((step, i) => (
              <li key={step.title} className="reveal border-t border-paper/20 pt-5">
                <span className="font-mono text-xs text-paper/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-xl font-medium tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* FAQ */}
      <Section aria-labelledby="faq-heading">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <SectionLabel index="04">Questions</SectionLabel>
            <h2 id="faq-heading" className="mt-5 text-headline font-medium">
              Frequently asked
            </h2>
          </div>
          <FaqList faqs={service.faqs} />
        </Container>
      </Section>

      {/* Related services */}
      {related.length > 0 && (
        <Section tone="white" aria-labelledby="related-heading">
          <Container>
            <h2 id="related-heading" className="text-2xl font-medium tracking-tight">
              Related services
            </h2>
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/services/${r.slug}`}
                    className="group flex h-full flex-col justify-between gap-6 rounded-[var(--radius-card)] border border-ink/10 bg-paper p-6 transition-colors hover:border-ink/40"
                  >
                    <span>
                      <span className="block text-lg font-medium">{r.shortName}</span>
                      <span className="mt-2 block text-sm text-graphite">{r.summary}</span>
                    </span>
                    <ArrowUpRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <CtaBand
        title={service.cta.title}
        body={service.cta.body}
        label={service.cta.label}
        href={enquiryHref}
      />

      <JsonLd data={serviceJsonLd(service)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(service.faqs)} />
    </>
  );
}
