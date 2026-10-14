import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getServices } from "@/server/content";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default async function NotFound() {
  const services = await getServices();
  return (
    <>
      <SiteHeader />
      <main id="main" className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="font-mono text-xs tracking-[0.14em] text-stone uppercase">Error 404</p>
            <h1 className="mt-6 text-display font-medium">
              This page <em className="accent">doesn&rsquo;t</em> exist.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-graphite">
              The link may be out of date, or the page may have moved. Try one of these instead.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/" size="lg" arrow>
                Go to the homepage
              </ButtonLink>
              <ButtonLink href="/start-a-project" size="lg" variant="outline">
                Start a project
              </ButtonLink>
            </div>
          </div>
          <nav aria-label="Services">
            <p className="mb-4 font-mono text-xs tracking-[0.14em] text-stone uppercase">
              Services
            </p>
            <ul className="border-t border-ink/10">
              {services.map((s) => (
                <li key={s.slug} className="border-b border-ink/10">
                  <Link href={`/services/${s.slug}`} className="block py-3 hover:underline">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
