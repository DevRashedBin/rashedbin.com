"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { idle } from "@/components/admin/action-state";
import { Input, Select, Textarea, Toggle } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { RepeatableField, StringListField } from "@/components/admin/repeatable";
import { DEMO_LABELS, SERVICE_DEMOS, type Service } from "@/domain/content/service";
import { saveServiceAction } from "../actions";

export function ServiceForm({
  service,
  otherServices,
}: {
  service: Service | null;
  otherServices: { slug: string; name: string }[];
}) {
  const [state, action] = useActionState(saveServiceAction, idle);
  const router = useRouter();
  const e = state.errors ?? {};
  const v = state.status === "error" ? (state.values ?? {}) : {};
  const s = service;

  // After creating a service or changing its URL, move to the new address.
  useEffect(() => {
    const slug = state.values?.slug;
    if (state.status === "success" && slug && slug !== s?.slug)
      router.replace(`/admin/content/services/${slug}`);
  }, [state, s?.slug, router]);

  const val = (key: string, fallback: string | number | undefined) =>
    v[key] ?? (fallback === undefined ? "" : String(fallback));

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="originalSlug" value={s?.slug ?? ""} />
      <FormMessage state={state} />

      <section className="grid gap-4 sm:grid-cols-2">
        <Input
          name="name"
          label="Service name"
          defaultValue={val("name", s?.name)}
          error={e.name}
          required
        />
        <Input
          name="shortName"
          label="Short name (menus)"
          defaultValue={val("shortName", s?.shortName)}
          error={e.shortName}
          required
          maxLength={40}
        />
        <Input
          name="slug"
          label="URL"
          defaultValue={val("slug", s?.slug)}
          error={e.slug}
          required
          hint={
            s?.published
              ? "Changing the URL of a published page breaks existing links and search results."
              : "Lowercase words separated by hyphens."
          }
        />
        <Input
          name="position"
          label="Order"
          type="number"
          min={0}
          defaultValue={val("position", s?.position ?? 99)}
          error={e.position}
        />
        <Textarea
          name="summary"
          label="Summary (cards and lists)"
          defaultValue={val("summary", s?.summary)}
          error={e.summary}
          rows={2}
          className="sm:col-span-2"
        />
      </section>

      <fieldset className="grid gap-4 rounded-2xl border border-ink/10 p-4">
        <legend className="px-1 text-sm font-medium">Search appearance</legend>
        <Input
          name="metaTitle"
          label="Page title"
          defaultValue={val("metaTitle", s?.metaTitle)}
          error={e.metaTitle}
          maxLength={51}
          hint="Up to 51 characters; “| Rashed” is added automatically."
        />
        <Textarea
          name="metaDescription"
          label="Meta description"
          defaultValue={val("metaDescription", s?.metaDescription)}
          error={e.metaDescription}
          rows={2}
          maxLength={170}
          hint="50–170 characters. Describe the service and who it's for."
        />
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-ink/10 p-4">
        <legend className="px-1 text-sm font-medium">Page header</legend>
        <Input
          name="eyebrow"
          label="Label above the heading"
          defaultValue={val("eyebrow", s?.eyebrow)}
          error={e.eyebrow}
        />
        <Input
          name="headline"
          label="Heading"
          defaultValue={val("headline", s?.headline)}
          error={e.headline}
          hint="Wrap one word in *asterisks* to set it in the serif accent."
        />
        <Textarea
          name="intro"
          label="Introduction"
          defaultValue={val("intro", s?.intro)}
          error={e.intro}
          rows={3}
        />
        <Select
          name="demo"
          label="Explainer graphic"
          defaultValue={val("demo", s?.demo ?? "blueprint")}
          options={SERVICE_DEMOS.map((d) => ({ value: d, label: DEMO_LABELS[d] }))}
          error={e.demo}
        />
      </fieldset>

      <RepeatableField
        name="problems"
        legend="Problems this solves"
        addLabel="Add problem"
        max={8}
        error={e.problems}
        fields={[
          { key: "title", label: "Problem", maxLength: 80 },
          { key: "body", label: "Description", multiline: true, maxLength: 400 },
        ]}
        initial={s?.problems ?? []}
      />
      <StringListField
        name="deliverables"
        legend="What's included"
        initial={s?.deliverables ?? []}
        error={e.deliverables}
      />
      <RepeatableField
        name="approach"
        legend="Approach steps"
        addLabel="Add step"
        max={6}
        error={e.approach}
        fields={[
          { key: "title", label: "Step", maxLength: 80 },
          { key: "body", label: "Description", multiline: true, maxLength: 400 },
        ]}
        initial={s?.approach ?? []}
      />
      <StringListField
        name="idealFor"
        legend="A good fit for"
        initial={s?.idealFor ?? []}
        max={6}
        error={e.idealFor}
      />
      <RepeatableField
        name="faqs"
        legend="Service FAQs"
        addLabel="Add question"
        max={12}
        error={e.faqs}
        fields={[
          { key: "question", label: "Question", maxLength: 200 },
          { key: "answer", label: "Answer", multiline: true, maxLength: 2000 },
        ]}
        initial={s?.faqs ?? []}
      />

      <fieldset className="rounded-2xl border border-ink/10 p-4">
        <legend className="px-1 text-sm font-medium">Related services (up to 3)</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {otherServices.map((o) => (
            <label key={o.slug} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="related"
                value={o.slug}
                defaultChecked={s?.related.includes(o.slug)}
                className="accent-ink"
              />
              {o.name}
            </label>
          ))}
        </div>
        {e.related && <p className="mt-2 text-xs text-danger">{e.related}</p>}
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-ink/10 p-4">
        <legend className="px-1 text-sm font-medium">Call to action</legend>
        <Input
          name="ctaTitle"
          label="Heading"
          defaultValue={val("ctaTitle", s?.cta.title)}
          error={e.ctaTitle}
        />
        <Textarea
          name="ctaBody"
          label="Text"
          defaultValue={val("ctaBody", s?.cta.body)}
          error={e.ctaBody}
          rows={2}
        />
        <Input
          name="ctaLabel"
          label="Button label"
          defaultValue={val("ctaLabel", s?.cta.label)}
          error={e.ctaLabel}
          maxLength={40}
        />
      </fieldset>

      <div className="sticky bottom-0 -mx-5 flex flex-col gap-3 border-t border-ink/10 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Toggle
          name="published"
          label="Published"
          description="Visible on the website."
          defaultChecked={state.status === "error" ? v.published === "on" : (s?.published ?? false)}
        />
        <SubmitButton>Save service</SubmitButton>
      </div>
    </form>
  );
}
