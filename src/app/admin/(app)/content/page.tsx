import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/shell";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { setServicePublishedAction } from "./actions";

export const metadata = { title: "Website content" };

export default async function ContentPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [{ data: services }, { count: faqCount }] = await Promise.all([
    supabase
      .from("services")
      .select("slug, name, short_name, position, published, updated_at")
      .order("position"),
    supabase.from("faqs").select("id", { count: "exact", head: true }).eq("scope", "general"),
  ]);

  return (
    <>
      <PageHeader
        title="Website content"
        description="Edit services and FAQs. Published changes appear on the website immediately."
        actions={
          <>
            <ButtonLink href="/admin/content/faqs" variant="outline">
              General FAQs ({faqCount ?? 0})
            </ButtonLink>
            <ButtonLink href="/admin/content/services/new">New service</ButtonLink>
          </>
        }
      />
      <Panel title="Services">
        <ul className="divide-y divide-ink/10">
          {services?.map((s) => (
            <li
              key={s.slug}
              className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 font-mono text-xs text-stone">{s.position}</span>
                <span>
                  <Link
                    href={`/admin/content/services/${s.slug}`}
                    className="font-medium hover:underline"
                  >
                    {s.name}
                  </Link>
                  <span className="block font-mono text-xs text-stone">/services/{s.slug}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 pl-10 sm:pl-0">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${s.published ? "bg-ink text-paper" : "border border-ink/20 text-stone"}`}
                >
                  {s.published ? "Published" : "Draft"}
                </span>
                <form action={setServicePublishedAction}>
                  <input type="hidden" name="slug" value={s.slug} />
                  <input type="hidden" name="published" value={String(!s.published)} />
                  <button className="rounded-full border border-ink/15 px-3 py-1 text-xs hover:border-ink">
                    {s.published ? "Unpublish" : "Publish"}
                  </button>
                </form>
                {s.published && (
                  <Link
                    href={`/services/${s.slug}`}
                    target="_blank"
                    className="rounded-full border border-ink/15 px-3 py-1 text-xs hover:border-ink"
                  >
                    View
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
