import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { ProcessTimeline } from "@/components/site/process-timeline";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Section } from "@/components/ui/container";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionLabel } from "@/components/ui/section-label";
import { principles } from "@/content/principles";
import { getServices } from "@/content/services";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Rashed — Independent Website Designer & Developer",
  description:
    "Rashedul Islam (Rashed) is an independent website designer and developer helping businesses in the UK, US, Europe and Bangladesh build, fix and optimise their websites.",
  path: "/about",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
];

export default function AboutPage() {
  const services = getServices();
  return (
    <>
      <section className="pt-10 pb-14 sm:pt-14 lg:pb-20">
        <Container>
          <Breadcrumbs items={crumbs} />
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <SectionLabel>About</SectionLabel>
              <h1 className="mt-6 text-display font-medium">
                One person, <em className="accent">accountable</em> from start to finish.
              </h1>
            </div>
            <div className="flex flex-col justify-end gap-5 text-lg leading-relaxed text-graphite">
              <p>
                I&rsquo;m Rashedul Islam — Rashed. I design, build and look after websites for
                businesses that rely on them to win customers.
              </p>
              <p>
                You work with me directly: the person who plans your site is the person who builds
                it, fixes it and answers your emails.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Section tone="white" aria-labelledby="focus-heading">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <SectionLabel index="01">Focus</SectionLabel>
            <h2 id="focus-heading" className="mt-5 text-headline font-medium">
              What I work on
            </h2>
            <p className="mt-5 max-w-md text-graphite">
              Business websites from first build to long-term care — with a particular focus on
              WordPress, performance and technical SEO.
            </p>
          </div>
          <ul className="flex flex-wrap content-start gap-2">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="inline-flex rounded-full border border-ink/15 px-4 py-2.5 text-sm transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section aria-labelledby="principles-heading">
        <Container>
          <SectionLabel index="02">Principles</SectionLabel>
          <h2 id="principles-heading" className="mt-5 max-w-2xl text-headline font-medium">
            How I like to work
          </h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => (
              <li key={p.title} className="reveal bg-white p-6">
                <h3 className="text-lg font-medium tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="ink" aria-labelledby="process-heading">
        <Container>
          <SectionLabel index="03">Process</SectionLabel>
          <h2 id="process-heading" className="mt-5 mb-12 max-w-2xl text-headline font-medium">
            How a project runs
          </h2>
          <ProcessTimeline />
        </Container>
      </Section>

      <CtaBand
        title="Have a project in mind?"
        body="Tell me what you're working on. I'll reply personally with next steps."
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
