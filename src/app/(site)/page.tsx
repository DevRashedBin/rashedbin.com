import type { Metadata } from "next";
import Link from "next/link";
import { ConversionFlow } from "@/components/graphics/conversion-flow";
import { ServiceDemo } from "@/components/graphics/service-demo";
import { CtaBand } from "@/components/site/cta-band";
import { ProcessTimeline } from "@/components/site/process-timeline";
import { ServiceSwitcher } from "@/components/site/service-switcher";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { FaqList } from "@/components/ui/faq-list";
import { ArrowRight, ArrowUpRight, Check } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionLabel } from "@/components/ui/section-label";
import { principles } from "@/content/principles";
import { site } from "@/content/site";
import { getCaseStudies } from "@/content/work";
import { getGeneralFaqs, getServices } from "@/server/content";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: site.title,
  description: site.description,
  path: "/",
  absoluteTitle: true,
});

/** Common problems, each linked to the service that solves it. */
const problems = [
  { problem: "It looks outdated next to competitors", service: "website-redesign" },
  { problem: "It's slow, especially on phones", service: "website-performance-optimisation" },
  { problem: "It doesn't show up in search", service: "technical-seo" },
  { problem: "Something broke after an update", service: "website-bug-fixes" },
  { problem: "Visitors come, but don't enquire", service: "website-design-development" },
  { problem: "Every edit needs a developer", service: "wordpress-elementor-development" },
];

export default async function HomePage() {
  const [services, generalFaqs] = await Promise.all([getServices(), getGeneralFaqs()]);
  const caseStudies = getCaseStudies();
  const bySlug = new Map(services.map((s) => [s.slug, s]));

  return (
    <>
      {/* Hero */}
      <section className="pt-8 pb-16 sm:pt-12 lg:pt-14 lg:pb-24">
        <Container className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <SectionLabel>Website design · development · optimisation</SectionLabel>
            <h1 className="mt-6 text-display font-medium">
              Websites that turn visitors into <em className="accent">clients</em>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-graphite">
              I&rsquo;m Rashed — an independent website designer and developer. I build, fix and
              optimise business websites so they load fast, explain clearly and bring in enquiries.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/start-a-project" size="lg" arrow>
                Start a project
              </ButtonLink>
              <ButtonLink href="/services" size="lg" variant="outline">
                Explore services
              </ButtonLink>
            </div>
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs tracking-wide text-stone uppercase">
              <span>Working with businesses in</span>
              {["UK", "US", "Europe", "Bangladesh"].map((m) => (
                <span key={m} className="rounded-full border border-ink/15 px-2.5 py-1 text-ink">
                  {m}
                </span>
              ))}
            </p>
          </div>
          <ConversionFlow />
        </Container>
      </section>

      {/* Problems → services */}
      <Section tone="white" aria-labelledby="problems-heading">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="reveal">
            <SectionLabel index="01">Sound familiar?</SectionLabel>
            <h2 id="problems-heading" className="mt-5 text-headline font-medium">
              Most website problems have a <em className="accent">clear</em> fix.
            </h2>
            <p className="mt-5 max-w-md text-graphite">
              Pick the one that sounds like your site. Each links to how I&rsquo;d approach it.
            </p>
          </div>
          <ul className="border-t border-ink/10">
            {problems.map(({ problem, service }, i) => {
              const s = bySlug.get(service);
              if (!s) return null;
              return (
                <li key={problem} className="reveal border-b border-ink/10">
                  <Link
                    href={`/services/${s.slug}`}
                    className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 sm:gap-6"
                  >
                    <span className="font-mono text-xs text-stone">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block text-lg font-medium tracking-tight sm:text-xl">
                        {problem}
                      </span>
                      <span className="mt-1 block text-sm text-stone">{s.shortName}</span>
                    </span>
                    <span className="grid size-10 place-items-center rounded-full border border-ink/15 transition-colors duration-200 group-hover:bg-ink group-hover:text-paper">
                      <ArrowRight className="size-4" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* Services */}
      <Section aria-labelledby="services-heading">
        <Container>
          <div className="mb-10 flex flex-col gap-5 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="reveal max-w-2xl">
              <SectionLabel index="02">Services</SectionLabel>
              <h2 id="services-heading" className="mt-5 text-headline font-medium">
                Everything your website needs to <em className="accent">perform</em>.
              </h2>
            </div>
            <ButtonLink href="/services" variant="outline" arrow>
              All services
            </ButtonLink>
          </div>
          <ServiceSwitcher
            tabs={services.map((s, i) => ({
              key: s.slug,
              label: s.shortName,
              index: String(i + 1).padStart(2, "0"),
            }))}
            panels={services.map((s) => (
              <div key={s.slug} className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
                <div className="flex flex-col justify-between gap-8 rounded-[var(--radius-panel)] border border-ink/10 bg-white p-6 sm:p-8">
                  <div>
                    <h3 className="text-2xl font-medium tracking-tight sm:text-3xl">{s.name}</h3>
                    <p className="mt-3 text-graphite">{s.summary}</p>
                    <ul className="mt-6 flex flex-col gap-3">
                      {s.deliverables.slice(0, 4).map((d) => (
                        <li key={d} className="flex gap-3 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <ButtonLink href={`/services/${s.slug}`} arrow className="self-start">
                    Explore {s.shortName.toLowerCase()}
                  </ButtonLink>
                </div>
                <ServiceDemo demo={s.demo} />
              </div>
            ))}
          />
        </Container>
      </Section>

      {/* Principles */}
      <Section tone="white" aria-labelledby="principles-heading">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="reveal">
            <SectionLabel index="03">Working together</SectionLabel>
            <h2 id="principles-heading" className="mt-5 text-headline font-medium">
              Clear terms. <em className="accent">No</em> surprises.
            </h2>
            <p className="mt-5 max-w-md text-graphite">
              You work directly with me from first call to launch — no account managers, no
              hand-offs.
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-ink/10 bg-ink/10 sm:grid-cols-2">
            {principles.map((p, i) => (
              <li key={p.title} className="reveal bg-white p-6 sm:p-8">
                <span aria-hidden className="font-mono text-xs text-stone">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-xl font-medium tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Process */}
      <Section tone="ink" id="process" aria-labelledby="process-heading">
        <Container>
          <div className="reveal mb-12 max-w-2xl lg:mb-16">
            <SectionLabel index="04">Process</SectionLabel>
            <h2 id="process-heading" className="mt-5 text-headline font-medium">
              From first call to launch, <em className="accent">step by step</em>.
            </h2>
          </div>
          <ProcessTimeline />
        </Container>
      </Section>

      {/* Work — only rendered when genuine, published case studies exist */}
      {caseStudies.length > 0 && (
        <Section aria-labelledby="work-heading">
          <Container>
            <SectionLabel index="05">Selected work</SectionLabel>
            <h2 id="work-heading" className="mt-5 text-headline font-medium">
              Recent projects
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {caseStudies.slice(0, 4).map((c) => (
                <li
                  key={c.slug}
                  className="rounded-[var(--radius-card)] border border-ink/10 bg-white p-6"
                >
                  <Link
                    href={`/work/${c.slug}`}
                    className="group flex items-start justify-between gap-4"
                  >
                    <span>
                      <span className="block text-xl font-medium">{c.title}</span>
                      <span className="mt-2 block text-sm text-graphite">{c.summary}</span>
                    </span>
                    <ArrowUpRight className="size-5 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* FAQ */}
      <Section aria-labelledby="faq-heading">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="reveal">
            <SectionLabel index={caseStudies.length ? "06" : "05"}>Questions</SectionLabel>
            <h2 id="faq-heading" className="mt-5 text-headline font-medium">
              Before you <em className="accent">get in touch</em>
            </h2>
          </div>
          <FaqList faqs={generalFaqs} />
        </Container>
      </Section>

      <CtaBand
        title="Tell me about your website."
        body="A few questions about your business and what you need. I'll reply personally with next steps — no automated sales sequence."
      />
      <JsonLd data={faqJsonLd(generalFaqs)} />
    </>
  );
}
