import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { InquiryForm, type InquiryFormData } from "@/components/forms/inquiry-form";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { CURRENCIES, type Currency } from "@/domain/inquiry/schema";
import { loadDraftByToken } from "@/server/inquiries";
import { inquiryServiceOptions } from "../../service-options";

export const metadata: Metadata = {
  title: "Finish your enquiry",
  robots: { index: false, follow: false },
};

/** Private, single-use page reached from the "finish your enquiry" email. */
export default function ResumeInquiryPage({
  params,
}: PageProps<"/start-a-project/resume/[token]">) {
  return (
    <section className="pt-10 pb-16 sm:pt-14 lg:pb-24">
      <Container>
        <SectionLabel>Start a project</SectionLabel>
        <h1 className="mt-6 text-headline font-medium">
          Finish your <em className="accent">enquiry</em>
        </h1>
        <div className="mt-10 max-w-5xl">
          <Suspense
            fallback={
              <div className="min-h-[520px] rounded-[var(--radius-panel)] border border-ink/10 bg-white" />
            }
          >
            {params.then(({ token }) => (
              <ResumeForm token={token} />
            ))}
          </Suspense>
        </div>
      </Container>
    </section>
  );
}

async function ResumeForm({ token }: { token: string }) {
  const [draft, serviceOptions] = await Promise.all([
    loadDraftByToken(token),
    inquiryServiceOptions(),
  ]);
  if (!draft) {
    return (
      <div className="rounded-[var(--radius-panel)] border border-ink/10 bg-white p-8">
        <p className="text-lg font-medium">This link has expired or has already been used.</p>
        <p className="mt-2 text-graphite">
          Links to finish an enquiry work once and expire after 14 days. You can start a new enquiry
          — it only takes a few minutes.
        </p>
        <Link href="/start-a-project" className={buttonClasses({ className: "mt-6" })}>
          Start a new enquiry
        </Link>
      </div>
    );
  }
  const d = (draft.details ?? {}) as Record<string, string>;
  const initial: Partial<InquiryFormData> = {
    service: draft.service_slug ?? undefined,
    websiteUrl: draft.website_url ?? "",
    description: draft.description ?? "",
    platform: d.platform,
    urgency: d.urgency,
    storeStage: d.storeStage,
    currency: (CURRENCIES as readonly string[]).includes(d.currency)
      ? (d.currency as Currency)
      : "USD",
    budget: d.budget,
    timeline: d.timeline,
    name: draft.name,
    email: draft.email,
    company: draft.company ?? "",
  };
  return (
    <InquiryForm
      privacyHref="/privacy"
      serviceOptions={serviceOptions}
      initial={initial}
      resumeToken={token}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
    />
  );
}
