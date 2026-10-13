import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/ui/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export type LegalSection = { heading: string; body: (string | string[])[] };

/** Long-form legal document layout with an in-page table of contents. */
export function LegalPage({
  title,
  path,
  updated,
  intro,
  sections,
}: {
  title: string;
  path: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: title, path },
  ];
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  return (
    <section className="pt-10 pb-20 sm:pt-14">
      <Container>
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-8 text-headline font-medium">{title}</h1>
        <p className="mt-4 font-mono text-xs tracking-wide text-stone uppercase">
          Last updated {updated}
        </p>
        <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr]">
          <nav aria-label="Contents" className="hidden lg:block">
            <ol className="sticky top-28 flex flex-col gap-2 text-sm text-stone">
              {sections.map((s) => (
                <li key={s.heading}>
                  <a href={`#${slug(s.heading)}`} className="hover:text-ink">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="max-w-3xl">
            <p className="text-lg leading-relaxed text-graphite">{intro}</p>
            {sections.map((s) => (
              <section key={s.heading} id={slug(s.heading)} className="mt-12">
                <h2 className="text-2xl font-medium tracking-tight">{s.heading}</h2>
                <div className="mt-4 flex flex-col gap-4 leading-relaxed text-graphite">
                  {s.body.map((block, i) =>
                    Array.isArray(block) ? (
                      <ul key={i} className="flex list-disc flex-col gap-2 pl-5">
                        {block.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p key={i}>{block}</p>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </section>
  );
}
