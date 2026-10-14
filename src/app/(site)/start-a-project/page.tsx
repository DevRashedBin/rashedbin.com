import type { Metadata } from "next";
import { Suspense } from "react";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { inquiryServiceOptions } from "./service-options";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Start a Project",
  description:
    "Tell me about your website project — a new site, redesign, fix or optimisation. A few short questions, and I'll reply personally with next steps.",
  path: "/start-a-project",
});

const nextSteps = [
  { title: "I review your enquiry", body: "Usually within one to two working days." },
  { title: "We talk it through", body: "A short call or email exchange to clarify scope." },
  { title: "You get a clear proposal", body: "Scope, timeline and a fixed quote — no obligation." },
];

export default async function StartProjectPage() {
  const serviceOptions = await inquiryServiceOptions();
  return (
    <section className="pt-10 pb-16 sm:pt-14 lg:pb-24">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <SectionLabel>Start a project</SectionLabel>
            <h1 className="mt-6 text-display font-medium">
              Let&rsquo;s talk about your <em className="accent">website</em>.
            </h1>
          </div>
          <p className="text-lg leading-relaxed text-graphite">
            Four short steps. The more context you share, the more useful my first reply will be.
          </p>
        </div>

        <div className="mt-12 grid gap-10 xl:grid-cols-[1fr_300px] xl:gap-12">
          <Suspense
            fallback={
              <div className="min-h-[520px] rounded-[var(--radius-panel)] border border-ink/10 bg-white" />
            }
          >
            <InquiryForm
              privacyHref="/privacy"
              serviceOptions={serviceOptions}
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
            />
          </Suspense>

          <aside className="self-start rounded-[var(--radius-panel)] bg-ink p-7 text-paper">
            <p className="font-mono text-xs tracking-[0.14em] text-paper/55 uppercase">
              What happens next
            </p>
            <ol className="mt-6 flex flex-col gap-6">
              {nextSteps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="grid size-8 place-items-center rounded-full border border-paper/25 font-mono text-xs">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-medium">{s.title}</span>
                    <span className="mt-1 block text-sm text-paper/60">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-8 border-t border-paper/10 pt-6 text-xs leading-relaxed text-paper/50">
              Your details are used only to respond to this enquiry. They&rsquo;re never sold or
              added to a newsletter.
            </p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
